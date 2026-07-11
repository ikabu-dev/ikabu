import {
    APIInteractionDataResolvedChannel,
    CategoryChannel,
    ChannelType,
    ChatInputCommandInteraction,
    ForumChannel,
    GuildTextBasedChannel,
    MediaChannel,
} from 'discord.js';

import { getGuildByInteraction } from '@/app/common/manager/guild_manager';
import { exists, notExists } from '@/app/common/others';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { ChannelService } from '@/db/channel_service';
import { log4js_obj } from '@/log4js_settings';

const logger = log4js_obj.getLogger('interaction');

export async function adminChannelSetting(
    interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
    targetChannel:
        | CategoryChannel
        | ForumChannel
        | MediaChannel
        | APIInteractionDataResolvedChannel
        | GuildTextBasedChannel,
    isAdminChannel: boolean,
) {
    try {
        const guild = await getGuildByInteraction(interaction);

        const storedChannel = await ChannelService.setAdminChannel(
            guild.id,
            targetChannel.id,
            isAdminChannel,
        );

        if (exists(storedChannel) && storedChannel.type === ChannelType.GuildCategory) {
            const channels = await ChannelService.getChannelsByCategoryId(
                guild.id,
                storedChannel.channelId,
            );

            for (const channel of channels) {
                const result = await ChannelService.setAdminChannel(
                    guild.id,
                    channel.channelId,
                    isAdminChannel,
                );

                if (notExists(result)) {
                    return null;
                }
            }
        }

        return storedChannel;
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
