import { Logger } from 'log4js';

import { ChannelKeySet } from '@/config/constants/channel_key';
import { env } from '@/config/env';
import { UniqueChannelService } from '@/infra/db/repositories/unique_channel_service';
import { client } from '@/infra/discord/client';
import { log4js_obj } from '@/infra/logging/log4js';
import { notExists } from '@/shared/assert';

/**
 * エラーをログファイルと Discord のエラーログチャンネルに送る。
 *
 * この関数は**決して throw してはならない**。
 * ほぼ全ての catch 節がここを呼ぶため、ここが throw すると
 * 「エラーを握り潰すはずの catch 節が、逆にエラーを投げる」ことになり、
 * しかもそれが起きるのは DB 障害時 —— つまり最も通知が必要な場面である。
 *
 * そのため本体は丸ごと try で囲み、通知に失敗してもログだけ残して戻る。
 */
export async function sendErrorLogs(logger: Logger, error: unknown) {
    const defaultLogger = log4js_obj.getLogger('default');

    logger.error(error);

    try {
        await notifyErrorLogChannel(error);
    } catch (notifyError) {
        // 通知経路の失敗は、元のエラーを潰さないようログに留める
        defaultLogger.error('failed to notify the error log channel', notifyError);
    }
}

async function notifyErrorLogChannel(error: unknown) {
    const defaultLogger = log4js_obj.getLogger('default');

    if (!client.isReady()) return;

    const guildId = env.serverId;
    if (notExists(guildId)) {
        return defaultLogger.warn('SERVER_ID is not defined.');
    }

    // DB 参照。ここが throw しても呼び出し元の try が受け止める
    const errorLogChannelId = await UniqueChannelService.getChannelIdByKey(
        guildId,
        ChannelKeySet.ErrorLog.key,
    );

    if (notExists(errorLogChannelId)) {
        return defaultLogger.warn(ChannelKeySet.ErrorLog.key + ' is not defined.');
    }

    const guild = await client.guilds.fetch(guildId);
    const errorLogChannel = await guild.channels.fetch(errorLogChannelId);

    if (notExists(errorLogChannel)) {
        return defaultLogger.warn('error log channel is not found.');
    }

    if (!errorLogChannel.isTextBased()) {
        return defaultLogger.warn('error log channel is not text based.');
    }

    if (error instanceof Error) {
        await errorLogChannel.send('### エラーログ\n' + '```\n' + (error.stack ?? error) + '\n```');
    }
}
