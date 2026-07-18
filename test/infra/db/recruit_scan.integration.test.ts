import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import Database from 'better-sqlite3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { RECRUIT_CLOSE_SCAN_LIMIT, RECRUIT_FALLBACK_TTL_DAYS } from '@/config/constants/recruit';

/**
 * 仕様としての TTL 日数とスキャン上限。**実装の定数から計算してはいけない。**
 * 定数から期待値を組み立てると、定数を変えたときにテストの期待値も一緒に動いてしまい、
 * 「7日で掃除する」という仕様が壊れても検出できなくなる。
 * 仕様を変えるときは、ここを人間が意図して書き換えること。
 */
const EXPECTED_TTL_DAYS = 7;
const EXPECTED_SCAN_LIMIT = 50;

/**
 * getRecruitsToClose の統合テスト。
 *
 * services.test.ts は prisma をモックして findMany の引数を検証しているが、
 * 期待値を実装と同じ式で組み立てるため、TTL の計算が誤っていても検出できない。
 * ここでは実 SQLite に行を入れ、本当に狙った行だけが返るかを確かめる。
 */

const dbFile = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'ikabu-recruit-scan-')),
    'test.sqlite3',
);

// prisma.ts は import 時に一度だけ env.databaseUrl を読むため、
// RecruitService の import より先に差し替える必要がある。
process.env['DATABASE_URL'] = `file:${dbFile}`;

let RecruitService: typeof import('@/infra/db/repositories/recruit_service').RecruitService;
let seedDb: Database.Database;

/**
 * schema.prisma からテーブルを作る。
 *
 * prisma/migrations を頭から流す手は使えない。20230912213132 が unique_role を
 * channel_id カラムで作るのに 20230912224238 が role_id を SELECT しており、
 * 空の DB に対する再生が途中で落ちるため(既存 DB は適用済み記録があるので動く)。
 */
function createSchema(db: Database.Database) {
    const ddl = execSync(
        'pnpm exec prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script',
        {
            cwd: path.resolve(__dirname, '../../..'),
            encoding: 'utf8',
        },
    );
    db.exec(ddl);
}

/** Prisma の SQLite アダプタが DateTime を読める書式に揃える。 */
function toDbDate(date: Date) {
    return date.toISOString().replace('Z', '+00:00');
}

let seq = 0;
function seedRecruit(options: { createdAt: Date; closeAt: Date | null }) {
    seq += 1;
    const messageId = `m${seq}`;
    seedDb
        .prepare(
            `INSERT INTO recruit
             (guild_id, channel_id, message_id, author_id, recruit_num, "condition",
              recruit_type, created_at, close_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
            'g1',
            'c1',
            messageId,
            'a1',
            1,
            'なし',
            1,
            toDbDate(options.createdAt),
            options.closeAt === null ? null : toDbDate(options.closeAt),
        );
    return messageId;
}

const now = new Date('2026-07-18T12:00:00.000Z');
const day = 24 * 60 * 60 * 1000;
const minute = 60 * 1000;
/** TTL のしきい値ちょうど(= now から仕様上の7日前) */
const ttlThreshold = new Date(now.getTime() - EXPECTED_TTL_DAYS * day);

beforeAll(async () => {
    seedDb = new Database(dbFile);
    createSchema(seedDb);

    ({ RecruitService } = await import('@/infra/db/repositories/recruit_service'));
    // prisma CLI の起動を含むため既定の 5 秒では足りない
}, 60_000);

afterAll(() => {
    seedDb.close();
});

beforeEach(() => {
    seedDb.exec('DELETE FROM recruit');
});

describe('掃除の仕様', () => {
    // 定数を変えたときに、下のテストが黙って新しい値に追従するのではなく、
    // ここで「仕様を変えたのか?」と気づけるようにする
    it('closeAt を持たない募集は作成から7日で掃除する', () => {
        expect(RECRUIT_FALLBACK_TTL_DAYS).toBe(EXPECTED_TTL_DAYS);
    });

    it('1回のスキャンで扱う TTL 掃除は50件まで', () => {
        expect(RECRUIT_CLOSE_SCAN_LIMIT).toBe(EXPECTED_SCAN_LIMIT);
    });
});

describe('getRecruitsToClose — closeAt を持つ募集', () => {
    it('closeAt が now より過去なら拾う', async () => {
        const id = seedRecruit({ createdAt: now, closeAt: new Date(now.getTime() - minute) });

        const { recruits } = await RecruitService.getRecruitsToClose(now);

        expect(recruits.map((r) => r.messageId)).toEqual([id]);
    });

    it('closeAt がちょうど now なら拾う', async () => {
        const id = seedRecruit({ createdAt: now, closeAt: now });

        const { recruits } = await RecruitService.getRecruitsToClose(now);

        expect(recruits.map((r) => r.messageId)).toEqual([id]);
    });

    it('closeAt が未来なら拾わない', async () => {
        seedRecruit({ createdAt: now, closeAt: new Date(now.getTime() + minute) });

        const { recruits } = await RecruitService.getRecruitsToClose(now);

        expect(recruits).toEqual([]);
    });
});

describe('getRecruitsToClose — closeAt を持たない募集の TTL フォールバック', () => {
    it('作成から7日+1分経過していれば拾う', async () => {
        const id = seedRecruit({
            createdAt: new Date(ttlThreshold.getTime() - minute),
            closeAt: null,
        });

        const { recruits } = await RecruitService.getRecruitsToClose(now);

        expect(recruits.map((r) => r.messageId)).toEqual([id]);
    });

    it('作成からちょうど7日なら拾う', async () => {
        const id = seedRecruit({ createdAt: ttlThreshold, closeAt: null });

        const { recruits } = await RecruitService.getRecruitsToClose(now);

        expect(recruits.map((r) => r.messageId)).toEqual([id]);
    });

    it('作成から6日23時間しか経っていなければ拾わない', async () => {
        seedRecruit({
            createdAt: new Date(ttlThreshold.getTime() + 60 * minute),
            closeAt: null,
        });

        const { recruits } = await RecruitService.getRecruitsToClose(now);

        expect(recruits).toEqual([]);
    });
});

describe('getRecruitsToClose — スキャン上限', () => {
    /** TTL 対象の行を、作成が古い順に count 件入れる。 */
    function seedTtlBacklog(count: number) {
        const ids: string[] = [];
        for (let i = 0; i < count; i++) {
            // i が小さいほど古い
            ids.push(
                seedRecruit({
                    createdAt: new Date(ttlThreshold.getTime() - (count - i) * minute),
                    closeAt: null,
                }),
            );
        }
        return ids;
    }

    it('TTL対象が上限を超えると、古い順に上限件数だけ返し capped を立てる', async () => {
        const ids = seedTtlBacklog(EXPECTED_SCAN_LIMIT + 1);

        const { recruits, ttlScanCapped } = await RecruitService.getRecruitsToClose(now);

        expect(ttlScanCapped).toBe(true);
        expect(recruits).toHaveLength(EXPECTED_SCAN_LIMIT);
        expect(recruits.map((r) => r.messageId)).toEqual(ids.slice(0, EXPECTED_SCAN_LIMIT));
    });

    it('TTL対象がちょうど上限件数なら capped は立たない', async () => {
        seedTtlBacklog(EXPECTED_SCAN_LIMIT);

        const { recruits, ttlScanCapped } = await RecruitService.getRecruitsToClose(now);

        expect(ttlScanCapped).toBe(false);
        expect(recruits).toHaveLength(EXPECTED_SCAN_LIMIT);
    });

    it('closeAt 側には上限が無く、上限を超えても全件返す', async () => {
        const over = EXPECTED_SCAN_LIMIT + 10;
        for (let i = 0; i < over; i++) {
            seedRecruit({ createdAt: now, closeAt: new Date(now.getTime() - minute) });
        }

        const { recruits, ttlScanCapped } = await RecruitService.getRecruitsToClose(now);

        expect(recruits).toHaveLength(over);
        expect(ttlScanCapped).toBe(false);
    });
});

describe('getRecruitsToClose — 混在', () => {
    it('closeAt 期限切れを先頭に、TTL経過分をその後ろに連結して返す', async () => {
        const closeAtId = seedRecruit({
            createdAt: now,
            closeAt: new Date(now.getTime() - minute),
        });
        const ttlId = seedRecruit({
            createdAt: new Date(ttlThreshold.getTime() - minute),
            closeAt: null,
        });

        const { recruits } = await RecruitService.getRecruitsToClose(now);

        expect(recruits.map((r) => r.messageId)).toEqual([closeAtId, ttlId]);
    });

    it('期限内の募集は closeAt の有無にかかわらず拾わない', async () => {
        seedRecruit({ createdAt: now, closeAt: new Date(now.getTime() + minute) });
        seedRecruit({ createdAt: now, closeAt: null });

        const { recruits } = await RecruitService.getRecruitsToClose(now);

        expect(recruits).toEqual([]);
    });
});
