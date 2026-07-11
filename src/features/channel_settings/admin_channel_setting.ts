import {
    APIInteractionDataResolvedChannel,
    CategoryChannel,
    ChannelType,
    ChatInputCommandInteraction,
    ForumChannel,
    GuildTextBasedChannel,
    MediaChannel,
} from 'discord.js';

import { ChannelService } from '@/infra/db/repositories/channel_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { exists, notExists } from '@/shared/assert';
import { getGuildByInteraction } from '@/shared/discord_helpers/guild_manager';

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
