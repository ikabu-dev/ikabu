import type { Logger } from 'log4js';

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
        const original = new Error('original');

        await expect(sendErrorLogs(logger, original)).resolves.toBeUndefined();

        expect(logger.error).toHaveBeenCalledWith(original);
        expect(mocks.send).not.toHaveBeenCalled();
    });

    it('Discordへの送信が失敗しても throw しない', async () => {
        mocks.getChannelIdByKey.mockResolvedValue('c1');
        mocks.send.mockRejectedValue(new Error('discord is down'));

        await expect(sendErrorLogs(fakeLogger(), new Error('original'))).resolves.toBeUndefined();
    });

    // 以前は `error instanceof Error` のときしか送信していなかったため、
    // 文字列やオブジェクトを渡している呼び出し箇所は通知が一切飛んでいなかった。
    describe('Error でない値も通知する', () => {
        beforeEach(() => mocks.getChannelIdByKey.mockResolvedValue('c1'));

        it('文字列', async () => {
            await sendErrorLogs(fakeLogger(), 'rankRoleKey is not RoleKey');

            expect(vi.mocked(mocks.send).mock.calls[0][0]).toContain('rankRoleKey is not RoleKey');
        });

        it('オブジェクト(interaction のエラー詳細など)', async () => {
            await sendErrorLogs(fakeLogger(), { content: 'Command failed', replied: true });

            const sent = vi.mocked(mocks.send).mock.calls[0][0] as string;
            expect(sent).toContain('Command failed');
            expect(sent).toContain('replied');
        });

        it('循環参照があっても throw しない', async () => {
            const circular: Record<string, unknown> = {};
            circular.self = circular;

            await expect(sendErrorLogs(fakeLogger(), circular)).resolves.toBeUndefined();
            expect(mocks.send).toHaveBeenCalledOnce();
        });
    });

    it('Discordの文字数上限を超えないよう切り詰める', async () => {
        mocks.getChannelIdByKey.mockResolvedValue('c1');

        await sendErrorLogs(fakeLogger(), 'a'.repeat(5000));

        const sent = vi.mocked(mocks.send).mock.calls[0][0] as string;
        expect(sent.length).toBeLessThanOrEqual(2000);
    });
});
