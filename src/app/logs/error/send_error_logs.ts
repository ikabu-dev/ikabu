import { Logger } from 'log4js';

import { client } from '@/app';
import { assertExistCheck, notExists } from '@/app/common/others';
import { ChannelKeySet } from '@/app/constant/channel_key';
import { UniqueChannelService } from '@/db/unique_channel_service';
import { log4js_obj } from '@/log4js_settings';

export async function sendErrorLogs(logger: Logger, error: unknown) {
    const defaultLogger = log4js_obj.getLogger('default');

    logger.error(error);

    if (!client.isReady()) return;

    const guildId = process.env.SERVER_ID;
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
