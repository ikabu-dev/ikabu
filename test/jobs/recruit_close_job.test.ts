import { Client } from 'discord.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getRecruitsToClose: vi.fn(),
    recruitAutoClose: vi.fn(),
    sendErrorLogs: vi.fn(),
}));

vi.mock('@/infra/db/repositories/recruit_service', () => ({
    RecruitService: { getRecruitsToClose: mocks.getRecruitsToClose },
}));
vi.mock('@/features/recruit/interactions/close_recruit/auto_close', () => ({
    recruitAutoClose: mocks.recruitAutoClose,
}));
vi.mock('@/infra/logging/send_error_logs', () => ({ sendErrorLogs: mocks.sendErrorLogs }));

import { closeExpiredRecruits } from '@/jobs/recruit_close_job';

const guild = { id: 'g1' };

function clientWithGuilds(guildIds: string[]): Client {
    return {
        isReady: () => true,
        guilds: { cache: new Map(guildIds.map((id) => [id, guild])) },
    } as unknown as Client;
}

const expiredRecruit = { guildId: 'g1', messageId: 'm1', channelId: 'c1' };

describe('期限切れ募集の自動締切スキャン', () => {
    beforeEach(() => vi.clearAllMocks());

    it('期限切れの募集を〆る', async () => {
        mocks.getRecruitsToClose.mockResolvedValue([expiredRecruit]);

        await closeExpiredRecruits(clientWithGuilds(['g1']));

        expect(mocks.recruitAutoClose).toHaveBeenCalledWith(guild, expiredRecruit);
    });

    it('Botが抜けたサーバーの募集には触らない', async () => {
        mocks.getRecruitsToClose.mockResolvedValue([expiredRecruit]);

        await closeExpiredRecruits(clientWithGuilds([]));

        expect(mocks.recruitAutoClose).not.toHaveBeenCalled();
        expect(mocks.sendErrorLogs).not.toHaveBeenCalled();
    });

    it('1件の締切に失敗しても、残りの募集は〆る', async () => {
        const other = { ...expiredRecruit, messageId: 'm2' };
        mocks.getRecruitsToClose.mockResolvedValue([expiredRecruit, other]);
        mocks.recruitAutoClose.mockRejectedValueOnce(new Error('discord'));

        await closeExpiredRecruits(clientWithGuilds(['g1']));

        expect(mocks.recruitAutoClose).toHaveBeenCalledTimes(2);
        expect(mocks.sendErrorLogs).toHaveBeenCalledTimes(1);
    });
});
