import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';

import { setUniqueChannelCommand } from '@/features/admin/unique_channel_settings/set_unique_channel';
import { showAllUniqueChannelSettings } from '@/features/admin/unique_channel_settings/show_all_unique_channel';
import { unsetUniqueChannelCommand } from '@/features/admin/unique_channel_settings/unset_unique_channel';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';

const logger = log4js_obj.getLogger('interaction');

export async function uniqueChannelSettingsHandler(
    interaction: ChatInputCommandInteraction<'cached'>,
) {
    try {
        await interaction.deferReply({});

        const member = interaction.member;

        if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return await interaction.editReply({
                content: 'チャンネルを管理する権限がないでし！',
            });
        }

        switch (interaction.options.getSubcommand()) {
            case '全設定表示':
                await showAllUniqueChannelSettings(interaction);
                break;
            case '登録':
                await setUniqueChannelCommand(interaction);
                break;
            case '解除':
                await unsetUniqueChannelCommand(interaction);
                break;
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
