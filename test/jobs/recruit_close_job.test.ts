import { Client } from 'discord.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getRecruitsToClose: vi.fn(),
    deleteRecruit: vi.fn(),
    deleteAllParticipant: vi.fn(),
    recruitAutoClose: vi.fn(),
    sendRecruitSticky: vi.fn(),
    sendCloseEmbedSticky: vi.fn(),
    searchChannelById: vi.fn(),
    sendErrorLogs: vi.fn(),
    loggerInfo: vi.fn(),
}));

vi.mock('@/infra/db/repositories/recruit_service', () => ({
    RecruitService: {
        getRecruitsToClose: mocks.getRecruitsToClose,
        deleteRecruit: mocks.deleteRecruit,
    },
}));
vi.mock('@/infra/db/repositories/participant_service', () => ({
    ParticipantService: { deleteAllParticipant: mocks.deleteAllParticipant },
}));
vi.mock('@/features/recruit/interactions/close_recruit/auto_close', () => ({
    recruitAutoClose: mocks.recruitAutoClose,
}));
vi.mock('@/features/recruit/sticky/recruit_sticky_messages', () => ({
    sendRecruitSticky: mocks.sendRecruitSticky,
    sendCloseEmbedSticky: mocks.sendCloseEmbedSticky,
}));
vi.mock('@/shared/discord_helpers/channel_manager', () => ({
    searchChannelById: mocks.searchChannelById,
}));
vi.mock('@/infra/logging/send_error_logs', () => ({ sendErrorLogs: mocks.sendErrorLogs }));
vi.mock('@/infra/logging/log4js', () => ({
    log4js_obj: { getLogger: () => ({ info: mocks.loggerInfo }) },
}));

import { closeExpiredRecruits } from '@/jobs/recruit_close_job';

const guild = { id: 'g1' };

function clientWithGuilds(guildIds: string[]): Client {
    return {
        isReady: () => true,
        guilds: { cache: new Map(guildIds.map((id) => [id, guild])) },
    } as unknown as Client;
}

const expiredRecruit = { guildId: 'g1', messageId: 'm1', channelId: 'c1' };

// recruitAutoClose の既定の戻り値。個別テストで上書きしない限りこれを使う。
const defaultStickyTarget = { kind: 'channel', guildId: 'g1', channelId: 'c1' };

describe('期限切れ募集の自動締切スキャン', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.recruitAutoClose.mockResolvedValue(defaultStickyTarget);
        mocks.searchChannelById.mockResolvedValue({ id: 'c1' });
    });

    it('期限切れの募集を〆る', async () => {
        mocks.getRecruitsToClose.mockResolvedValue({
            recruits: [expiredRecruit],
            ttlScanCapped: false,
        });

        await closeExpiredRecruits(clientWithGuilds(['g1']));

        expect(mocks.recruitAutoClose).toHaveBeenCalledWith(guild, expiredRecruit);
    });

    it('Botが抜けたサーバーの募集は、Discordを触らずDBの行だけ削除する', async () => {
        mocks.getRecruitsToClose.mockResolvedValue({
            recruits: [expiredRecruit],
            ttlScanCapped: false,
        });

        await closeExpiredRecruits(clientWithGuilds([]));

        expect(mocks.recruitAutoClose).not.toHaveBeenCalled();
        expect(mocks.deleteRecruit).toHaveBeenCalledWith('g1', 'm1');
        expect(mocks.deleteAllParticipant).toHaveBeenCalledWith('g1', 'm1');
        expect(mocks.sendErrorLogs).not.toHaveBeenCalled();
    });

    it('Botが抜けたサーバーの行削除に失敗しても、残りの募集は〆る', async () => {
        const inGuild = { guildId: 'g1', messageId: 'm2', channelId: 'c1' };
        const leftGuild = { guildId: 'gone', messageId: 'm1', channelId: 'c1' };
        mocks.getRecruitsToClose.mockResolvedValue({
            recruits: [leftGuild, inGuild],
            ttlScanCapped: false,
        });
        mocks.deleteRecruit.mockRejectedValueOnce(new Error('db'));

        await closeExpiredRecruits(clientWithGuilds(['g1']));

        expect(mocks.sendErrorLogs).toHaveBeenCalledTimes(1);
        expect(mocks.recruitAutoClose).toHaveBeenCalledWith(guild, inGuild);
    });

    it('1件の締切に失敗しても、残りの募集は〆る', async () => {
        const other = { ...expiredRecruit, messageId: 'm2' };
        mocks.getRecruitsToClose.mockResolvedValue({
            recruits: [expiredRecruit, other],
            ttlScanCapped: false,
        });
        mocks.recruitAutoClose.mockRejectedValueOnce(new Error('discord'));

        await closeExpiredRecruits(clientWithGuilds(['g1']));

        expect(mocks.recruitAutoClose).toHaveBeenCalledTimes(2);
        expect(mocks.sendErrorLogs).toHaveBeenCalledTimes(1);
    });

    it('TTLスキャンが上限に達したときはログを出す', async () => {
        mocks.getRecruitsToClose.mockResolvedValue({
            recruits: [],
            ttlScanCapped: true,
        });

        await closeExpiredRecruits(clientWithGuilds(['g1']));

        expect(mocks.loggerInfo).toHaveBeenCalledTimes(1);
    });

    it('TTLスキャンが上限に達していないときは上限到達ログを出さない', async () => {
        mocks.getRecruitsToClose.mockResolvedValue({
            recruits: [],
            ttlScanCapped: false,
        });

        await closeExpiredRecruits(clientWithGuilds(['g1']));

        expect(mocks.loggerInfo).not.toHaveBeenCalled();
    });

    it('同じチャンネルの募集を複数〆ても、そのチャンネルの sticky 更新は1回にまとめる', async () => {
        const recruitA = { guildId: 'g1', messageId: 'm1', channelId: 'c1' };
        const recruitB = { guildId: 'g1', messageId: 'm2', channelId: 'c1' };
        const recruitC = { guildId: 'g1', messageId: 'm3', channelId: 'c1' };
        mocks.getRecruitsToClose.mockResolvedValue({
            recruits: [recruitA, recruitB, recruitC],
            ttlScanCapped: false,
        });
        mocks.recruitAutoClose.mockResolvedValue({
            kind: 'channel',
            guildId: 'g1',
            channelId: 'c1',
        });
        const channel = { id: 'c1' };
        mocks.searchChannelById.mockResolvedValue(channel);

        await closeExpiredRecruits(clientWithGuilds(['g1']));

        // 締切自体は3件分行われる(sticky を連打しないことと、締切件数を減らさないことは別)
        expect(mocks.recruitAutoClose).toHaveBeenCalledTimes(3);
        // だが sticky の更新は同じチャンネルにつき1回だけ
        expect(mocks.sendCloseEmbedSticky).toHaveBeenCalledTimes(1);
        expect(mocks.sendCloseEmbedSticky).toHaveBeenCalledWith(guild, channel);
    });

    it('プラベ/別ゲー(スレッド募集)の sticky は専用チャンネルへ1回だけ送る', async () => {
        const recruitA = { guildId: 'g1', messageId: 'm1', channelId: 'thread1' };
        const recruitB = { guildId: 'g1', messageId: 'm2', channelId: 'thread2' };
        mocks.getRecruitsToClose.mockResolvedValue({
            recruits: [recruitA, recruitB],
            ttlScanCapped: false,
        });
        mocks.recruitAutoClose.mockResolvedValue({
            kind: 'thread',
            guildId: 'g1',
            channelId: 'private-recruit-channel',
        });

        await closeExpiredRecruits(clientWithGuilds(['g1']));

        expect(mocks.sendRecruitSticky).toHaveBeenCalledTimes(1);
        expect(mocks.sendRecruitSticky).toHaveBeenCalledWith({
            channelOpt: { guild: guild, channelId: 'private-recruit-channel' },
        });
        expect(mocks.sendCloseEmbedSticky).not.toHaveBeenCalled();
    });

    it('異なるチャンネルの募集を〆た場合は、チャンネルごとに sticky を更新する', async () => {
        const recruitA = { guildId: 'g1', messageId: 'm1', channelId: 'c1' };
        const recruitB = { guildId: 'g1', messageId: 'm2', channelId: 'c2' };
        mocks.getRecruitsToClose.mockResolvedValue({
            recruits: [recruitA, recruitB],
            ttlScanCapped: false,
        });
        mocks.recruitAutoClose.mockImplementation((_guild, recruit) =>
            Promise.resolve({ kind: 'channel', guildId: 'g1', channelId: recruit.channelId }),
        );
        mocks.searchChannelById.mockImplementation((_guild, channelId) =>
            Promise.resolve({ id: channelId }),
        );

        await closeExpiredRecruits(clientWithGuilds(['g1']));

        expect(mocks.sendCloseEmbedSticky).toHaveBeenCalledTimes(2);
    });

    it('1チャンネルの sticky 更新に失敗しても、他チャンネルの sticky 更新は行う', async () => {
        const recruitA = { guildId: 'g1', messageId: 'm1', channelId: 'c1' };
        const recruitB = { guildId: 'g1', messageId: 'm2', channelId: 'c2' };
        mocks.getRecruitsToClose.mockResolvedValue({
            recruits: [recruitA, recruitB],
            ttlScanCapped: false,
        });
        mocks.recruitAutoClose.mockImplementation((_guild, recruit) =>
            Promise.resolve({ kind: 'channel', guildId: 'g1', channelId: recruit.channelId }),
        );
        mocks.searchChannelById.mockImplementation((_guild, channelId) =>
            Promise.resolve({ id: channelId }),
        );
        mocks.sendCloseEmbedSticky.mockRejectedValueOnce(new Error('discord'));

        await closeExpiredRecruits(clientWithGuilds(['g1']));

        expect(mocks.sendCloseEmbedSticky).toHaveBeenCalledTimes(2);
        expect(mocks.sendErrorLogs).toHaveBeenCalledTimes(1);
    });
});
