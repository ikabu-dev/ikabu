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
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { ChannelService } from '@/db/channel_service';
import { log4js_obj } from '@/log4js_settings';
import { exists, notExists } from '@/shared/assert';

const logger = log4js_obj.getLogger('interaction');

export async function vcToolsSetting(
    interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
    targetChannel:
        | CategoryChannel
        | ForumChannel
        | MediaChannel
        | APIInteractionDataResolvedChannel
        | GuildTextBasedChannel,
    isVCToolsEnabled: boolean,
) {
    try {
        const guild = await getGuildByInteraction(interaction);

        const storedChannel = await ChannelService.setVCToolsEnabled(
            guild.id,
            targetChannel.id,
            isVCToolsEnabled,
        );

        if (exists(storedChannel) && storedChannel.type === ChannelType.GuildCategory) {
            const channels = await ChannelService.getChannelsByCategoryId(
                guild.id,
                storedChannel.channelId,
            );

            for (const channel of channels) {
                const result = await ChannelService.setVCToolsEnabled(
                    guild.id,
                    channel.channelId,
                    isVCToolsEnabled,
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
