import { Logger } from 'log4js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
    // env.serverId は process.env の遅延ゲッター。モジュールごと差し替えると
    // 同じ env を見ている log4js の設定まで消えるため、環境変数だけを与える。
    process.env.SERVER_ID ??= 'g1';

    return {
        getChannelIdByKey: vi.fn(),
        isReady: vi.fn(() => true),
        send: vi.fn(),
        channelsFetch: vi.fn(),
    };
});

vi.mock('@/infra/db/repositories/unique_channel_service', () => ({
    UniqueChannelService: { getChannelIdByKey: mocks.getChannelIdByKey },
}));
vi.mock('@/infra/discord/client', () => ({
    client: {
        isReady: mocks.isReady,
        guilds: {
            fetch: vi.fn(async () => ({
                channels: { fetch: mocks.channelsFetch },
            })),
        },
    },
}));

import { sendErrorLogs } from '@/infra/logging/send_error_logs';

function fakeLogger() {
    return { error: vi.fn() } as unknown as Logger;
}

describe('sendErrorLogs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.isReady.mockReturnValue(true);
        mocks.channelsFetch.mockResolvedValue({ isTextBased: () => true, send: mocks.send });
    });

    it('エラーログチャンネルにエラーを通知する', async () => {
        mocks.getChannelIdByKey.mockResolvedValue('c1');

        await sendErrorLogs(fakeLogger(), new Error('boom'));

        expect(mocks.send).toHaveBeenCalledOnce();
        expect(vi.mocked(mocks.send).mock.calls[0][0]).toContain('boom');
    });

    // この関数はほぼ全ての catch 節から呼ばれるため、ここが throw すると
    // 「エラーを握り潰すはずの catch 節が逆にエラーを投げる」ことになる。
    // しかもそれが起きるのは DB 障害時 = 最も通知が必要な場面である。
    it('DB参照が失敗しても throw せず、元のエラーはログに残す', async () => {
        mocks.getChannelIdByKey.mockRejectedValue(new Error('db is down'));
        const logger = fakeLogger();

        await expect(sendErrorLogs(logger, new Error('original'))).resolves.toBeUndefined();

        expect(logger.error).toHaveBeenCalledWith(new Error('original'));
        expect(mocks.send).not.toHaveBeenCalled();
    });

    it('Discordへの送信が失敗しても throw しない', async () => {
        mocks.getChannelIdByKey.mockResolvedValue('c1');
        mocks.send.mockRejectedValue(new Error('discord is down'));

        await expect(sendErrorLogs(fakeLogger(), new Error('original'))).resolves.toBeUndefined();
    });
});
