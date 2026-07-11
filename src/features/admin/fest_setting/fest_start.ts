import { CategoryChannel, ChatInputCommandInteraction, Guild } from 'discord.js';

import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';

const logger = log4js_obj.getLogger('interaction');

export async function festStart(
    interaction: ChatInputCommandInteraction<'cached'>,
    guild: Guild,
    categoryChannel: CategoryChannel,
) {
    try {
        const channels = categoryChannel.children.cache;
        channels.each(async (channel) => {
            await channel.permissionOverwrites.edit(guild.roles.everyone, {
                ViewChannel: true,
            });
        });
        return await interaction.editReply('フェス設定を`オン`にしたでし！');
    } catch (error) {
        await sendErrorLogs(logger, error);
        return await interaction.editReply('設定中にエラーが発生したでし！');
    }
}
