import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    recruit: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        deleteMany: vi.fn(),
        updateMany: vi.fn(),
        findFirst: vi.fn(),
    },
    member: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn() },
    uniqueChannel: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
    uniqueRole: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
}));

vi.mock('@/infra/db/prisma', () => ({ prisma: mocks }));

import { ChannelKeySet } from '@/config/constants/channel_key';
import { RECRUIT_CLOSE_SCAN_LIMIT } from '@/config/constants/recruit';
import { RoleKeySet } from '@/config/constants/role_key';
import { MemberService } from '@/infra/db/repositories/member_service';
import { RecruitService } from '@/infra/db/repositories/recruit_service';
import { UniqueChannelService } from '@/infra/db/repositories/unique_channel_service';
import { UniqueRoleService } from '@/infra/db/repositories/unique_role_service';

describe('DBサービスは失敗を呼び出し側に伝える', () => {
    beforeEach(() => vi.clearAllMocks());

    // 以前は全メソッドが try/catch でエラーをログに出すだけで正常終了しており、
    // 「募集がDBに入っていないのに Discord にはメッセージだけ送信される」といった
    // データ不整合が、表面上は成功して見えるまま起きていた。
    it('DB障害は握り潰さず throw する', async () => {
        mocks.recruit.findUnique.mockRejectedValueOnce(new Error('db'));
        await expect(RecruitService.getRecruit('g', 'm')).rejects.toThrow('db');

        mocks.recruit.findMany.mockRejectedValueOnce(new Error('db'));
        await expect(RecruitService.getRecruitsByChannelId('g', 'c')).rejects.toThrow('db');

        mocks.recruit.create.mockRejectedValueOnce(new Error('db'));
        await expect(
            RecruitService.registerRecruit('g', 'c', 'm', 'u', 4, 'なし', null, null, 2),
        ).rejects.toThrow('db');

        mocks.member.upsert.mockRejectedValueOnce(new Error('db'));
        await expect(
            MemberService.saveMember('g', 'u', 'name', 'icon', new Date(), false),
        ).rejects.toThrow('db');

        mocks.uniqueChannel.findUnique.mockRejectedValueOnce(new Error('db'));
        await expect(
            UniqueChannelService.getChannelIdByKey('g', ChannelKeySet.Lobby.key),
        ).rejects.toThrow('db');
    });

    it('正常時は結果を返す', async () => {
        const recruit = { guildId: 'g', messageId: 'm' };
        mocks.recruit.findUnique.mockResolvedValue(recruit);
        await expect(RecruitService.getRecruit('g', 'm')).resolves.toBe(recruit);

        mocks.recruit.findMany.mockResolvedValue([recruit]);
        await expect(RecruitService.getRecruitsByChannelId('g', 'c')).resolves.toEqual([recruit]);

        mocks.uniqueRole.findUnique.mockResolvedValue({ roleId: 'r' });
        await expect(UniqueRoleService.getRoleIdByKey('g', RoleKeySet.Developer.key)).resolves.toBe(
            'r',
        );
    });

    it('レコードが無い場合は null を返す(エラーではない)', async () => {
        mocks.uniqueChannel.findUnique.mockResolvedValue(null);
        await expect(
            UniqueChannelService.getChannelIdByKey('g', ChannelKeySet.Lobby.key),
        ).resolves.toBeNull();

        mocks.uniqueRole.findUnique.mockResolvedValue(null);
        await expect(
            UniqueRoleService.getRoleIdByKey('g', RoleKeySet.Developer.key),
        ).resolves.toBeNull();

        mocks.member.findUnique.mockResolvedValue(null);
        await expect(MemberService.getMemberByUserId('g', 'u')).resolves.toBeNull();
    });

    // 〆ボタンと自動締切ジョブが競合して二重削除になるのは正常系のため、
    // 0件マッチで throw しない deleteMany を使っている。
    it('募集の二重削除は正常系として扱う', async () => {
        mocks.recruit.deleteMany.mockResolvedValue({ count: 0 });

        await expect(RecruitService.deleteRecruit('g', 'm')).resolves.toBeUndefined();
        expect(mocks.recruit.deleteMany).toHaveBeenCalledWith({
            where: { guildId: 'g', messageId: 'm' },
        });
    });

    it('ユニークチャンネルの解除は、解除できたかを boolean で返す', async () => {
        mocks.uniqueChannel.deleteMany.mockResolvedValue({ count: 1 });
        await expect(UniqueChannelService.delete('g', ChannelKeySet.Lobby.key)).resolves.toBe(true);

        mocks.uniqueChannel.deleteMany.mockResolvedValue({ count: 0 });
        await expect(UniqueChannelService.delete('g', ChannelKeySet.Lobby.key)).resolves.toBe(
            false,
        );
    });

    it('ユニークロールの解除は、解除できたかを boolean で返す', async () => {
        mocks.uniqueRole.deleteMany.mockResolvedValue({ count: 1 });
        await expect(UniqueRoleService.delete('g', RoleKeySet.Developer.key)).resolves.toBe(true);

        mocks.uniqueRole.deleteMany.mockResolvedValue({ count: 0 });
        await expect(UniqueRoleService.delete('g', RoleKeySet.Developer.key)).resolves.toBe(false);
    });
});

describe('締切対象の募集スキャン', () => {
    beforeEach(() => vi.clearAllMocks());

    const now = new Date('2026-07-12T12:00:00Z');
    // now から 7 日前
    const ttlThreshold = new Date('2026-07-05T12:00:00Z');

    it('closeAt 期限切れはキャップ無しのクエリ、closeAt なしで作成から7日経った募集はキャップ付きのクエリで拾う', async () => {
        mocks.recruit.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

        await RecruitService.getRecruitsToClose(now);

        // スケジュール終了時刻を持つ募集。通常運用の自動締切そのものなので上限を設けない
        expect(mocks.recruit.findMany).toHaveBeenNthCalledWith(1, {
            where: { closeAt: { not: null, lte: now } },
        });
        // 持たない募集(バイト・レイダース・プラベ・別ゲー)は作成から7日。バックログdrain用に上限を設ける
        // ちょうど上限件数で溢れが無いケースを capped と誤判定しないよう、上限+1件を取得する
        expect(mocks.recruit.findMany).toHaveBeenNthCalledWith(2, {
            where: { closeAt: null, createdAt: { lte: ttlThreshold } },
            orderBy: { createdAt: 'asc' },
            take: RECRUIT_CLOSE_SCAN_LIMIT + 1,
        });
    });

    it('closeAt 期限切れの結果を先頭に、TTL経過分をその後ろに連結して返す', async () => {
        const closeAtRecruit = { messageId: 'a' };
        const ttlRecruit = { messageId: 'b' };
        mocks.recruit.findMany
            .mockResolvedValueOnce([closeAtRecruit])
            .mockResolvedValueOnce([ttlRecruit]);

        const result = await RecruitService.getRecruitsToClose(now);

        expect(result.recruits).toEqual([closeAtRecruit, ttlRecruit]);
    });

    it('TTLクエリがスキャン上限に達したときだけ ttlScanCapped が true になる', async () => {
        // 上限+1件返ってきた(=溢れがある)ケースだけ capped
        const overflowingTtlRecruits = Array.from(
            { length: RECRUIT_CLOSE_SCAN_LIMIT + 1 },
            (_, i) => ({ messageId: `ttl${i}` }),
        );
        mocks.recruit.findMany
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce(overflowingTtlRecruits);

        const capped = await RecruitService.getRecruitsToClose(now);
        expect(capped.ttlScanCapped).toBe(true);
        // 溢れた分は切り落として上限件数までしか返さない
        expect(capped.recruits).toHaveLength(RECRUIT_CLOSE_SCAN_LIMIT);

        mocks.recruit.findMany
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ messageId: 'x' }]);

        const notCapped = await RecruitService.getRecruitsToClose(now);
        expect(notCapped.ttlScanCapped).toBe(false);
    });

    it('TTLの backlog がちょうど上限件数で溢れが無い場合は ttlScanCapped が false になる', async () => {
        const exactlyFullTtlRecruits = Array.from({ length: RECRUIT_CLOSE_SCAN_LIMIT }, (_, i) => ({
            messageId: `ttl${i}`,
        }));
        mocks.recruit.findMany
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce(exactlyFullTtlRecruits);

        const result = await RecruitService.getRecruitsToClose(now);

        expect(result.ttlScanCapped).toBe(false);
        expect(result.recruits).toHaveLength(RECRUIT_CLOSE_SCAN_LIMIT);
    });

    it('DB障害は握り潰さず throw する', async () => {
        mocks.recruit.findMany.mockRejectedValueOnce(new Error('db'));

        await expect(RecruitService.getRecruitsToClose(now)).rejects.toThrow('db');
    });
});

describe('ボタンメッセージIDの保存', () => {
    beforeEach(() => vi.clearAllMocks());

    // プラベ・別ゲーはボタンを募集登録の後に送るため、登録時には ID が無い。
    // 自動〆はこの ID が無いとボタンを無効化できず、ゾンビボタンが残る。
    it('募集にボタンメッセージIDを紐付ける', async () => {
        mocks.recruit.updateMany.mockResolvedValue({ count: 1 });

        await RecruitService.updateButtonMessageId('g', 'm', 'btn');

        expect(mocks.recruit.updateMany).toHaveBeenCalledWith({
            where: { guildId: 'g', messageId: 'm' },
            data: { buttonMessageId: 'btn' },
        });
    });

    it('DB障害は握り潰さず throw する', async () => {
        mocks.recruit.updateMany.mockRejectedValueOnce(new Error('db'));

        await expect(RecruitService.updateButtonMessageId('g', 'm', 'btn')).rejects.toThrow('db');
    });
});
