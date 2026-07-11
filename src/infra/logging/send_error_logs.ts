import { Logger } from 'log4js';

import { client } from '@/app';
import { ChannelKeySet } from '@/config/constants/channel_key';
import { env } from '@/config/env';
import { UniqueChannelService } from '@/infra/db/repositories/unique_channel_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { assertExistCheck, notExists } from '@/shared/assert';

export async function sendErrorLogs(logger: Logger, error: unknown) {
    const defaultLogger = log4js_obj.getLogger('default');

    logger.error(error);

    if (!client.isReady()) return;

    const guildId = env.serverId;
    assertExistCheck(guildId, 'SERVER_ID');

    const errorLogChannelId = await UniqueChannelService.getChannelIdByKey(
        guildId,
        ChannelKeySet.ErrorLog.key,
    );

    if (notExists(errorLogChannelId)) {
        return defaultLogger.warn(ChannelKeySet.ErrorLog.key + ' is not defined.');
    }

    try {
        const guild = await client.guilds.fetch(guildId);
        const errorLogChannel = await guild.channels.fetch(errorLogChannelId);

        if (notExists(errorLogChannel)) {
            return defaultLogger.warn('error log channel is not found.');
        }

        if (!errorLogChannel.isTextBased()) {
            return defaultLogger.warn('error log channel is not text based.');
        }

        if (error instanceof Error) {
            await errorLogChannel.send(
                '### エラーログ\n' + '```\n' + (error.stack ?? error) + '\n```',
            );
        }
    } catch (error) {
        defaultLogger.error(error);
    }
}
