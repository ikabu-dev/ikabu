import { describe, expect, it } from 'vitest';

import {
    checkBigRun,
    checkFes,
    checkTeamContest,
    event2txt,
    getAnarchyList,
    getBigRunList,
    getEventList,
    getFesList,
    getRegularList,
    getSalmonList,
    getTeamContestList,
    getXMatchList,
    rule2txt,
    stage2txt,
} from '@/infra/external/splatoon3-ink/splatoon3_ink';

import type { Sp3Locale } from '@/infra/external/splatoon3-ink/types/locale';
import type { Sp3Schedule } from '@/infra/external/splatoon3-ink/types/schedule';

const past = '2000-01-01T00:00:00.000Z';
const future = '2099-01-01T00:00:00.000Z';

const schedule = {
    regularSchedules: { nodes: [{ endTime: future }, { endTime: past }] },
    bankaraSchedules: { nodes: [{ endTime: future }, { endTime: past }] },
    xSchedules: { nodes: [{ endTime: future }, { endTime: past }] },
    eventSchedules: { nodes: [{ endTime: past }] },
    festSchedules: { nodes: [{ endTime: future, festMatchSettings: {} }, { endTime: past }] },
    coopGroupingSchedule: {
        bannerImage: { url: 'https://example.test/banner.png' },
        regularSchedules: { nodes: [{ endTime: future }, { endTime: past }] },
        bigRunSchedules: { nodes: [{ startTime: past, endTime: future, setting: {} }] },
        teamContestSchedules: { nodes: [{ startTime: past, endTime: future, setting: {} }] },
    },
} as unknown as Sp3Schedule;

const locale = {
    stages: { stage: { name: 'ユノハナ大渓谷' } },
    rules: { rule: { name: 'ナワバリバトル' } },
    weapons: {},
    brands: {},
    gear: {},
    powers: {},
    festivals: {},
    events: { event: { name: 'チャレンジ', desc: '説明', regulation: 'ルール' } },
} as Sp3Locale;

// 取得系は外部APIとNodeCacheを伴うため、ここではネットワーク非依存の公開抽出・変換関数を安全網として検証する。
describe('splatoon3.ink のスケジュール抽出', () => {
    it('期限付きの各リストから未来の要素だけを返す', () => {
        expect(getRegularList(schedule)).toHaveLength(1);
        expect(getAnarchyList(schedule)).toHaveLength(1);
        expect(getSalmonList(schedule)).toHaveLength(1);
        expect(getXMatchList(schedule)).toHaveLength(1);
        expect(getFesList(schedule)).toHaveLength(1);
    });

    it('期限を絞らないイベント・Big Run・コンテストを返す', () => {
        expect(getEventList(schedule)).toHaveLength(1);
        expect(getBigRunList(schedule)).toHaveLength(1);
        expect(getTeamContestList(schedule)).toHaveLength(1);
    });

    it('フェス・Big Run・チームコンテストの開催を判定する', () => {
        expect(checkFes(schedule, 0)).toBe(true);
        expect(checkBigRun(schedule, 0)).toBe(true);
        expect(checkTeamContest(schedule, 0)).toBe(true);
    });
});

describe('splatoon3.ink のロケール変換', () => {
    it('ステージ・ルール・イベントを名前へ変換する', async () => {
        await expect(stage2txt(locale, 'stage')).resolves.toBe('ユノハナ大渓谷');
        await expect(rule2txt(locale, 'rule')).resolves.toBe('ナワバリバトル');
        await expect(event2txt(locale, 'event')).resolves.toEqual({
            title: 'チャレンジ',
            description: '説明',
            regulation: 'ルール',
        });
    });

    it('見つからないIDはフォールバック文言を返す', async () => {
        await expect(stage2txt(locale, 'missing', false)).resolves.toBe(
            'そーりー・あんでふぁいんど',
        );
        await expect(rule2txt(locale, 'missing', false)).resolves.toBe(
            'そーりー・あんでふぁいんど',
        );
        await expect(event2txt(locale, 'missing', false)).resolves.toEqual({
            title: 'そーりー・あんでふぁいんど',
            description: 'そーりー・あんでふぁいんど',
            regulation: 'そーりー・あんでふぁいんど',
        });
    });
});
