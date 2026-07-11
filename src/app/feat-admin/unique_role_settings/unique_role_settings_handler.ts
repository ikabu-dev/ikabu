import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';

import { setUniqueRoleCommand } from './set_unique_role';
import { showAllUniqueRoleSettings } from './show_all_unique_role';
import { unsetUniqueRoleCommand } from './unset_unique_role';
import { log4js_obj } from '../../../log4js_settings';
import { sendErrorLogs } from '../../logs/error/send_error_logs';

const logger = log4js_obj.getLogger('interaction');

export async function uniqueRoleSettingsHandler(
    interaction: ChatInputCommandInteraction<'cached'>,
) {
    try {
        await interaction.deferReply({});

        const member = interaction.member;

        if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return await interaction.editReply({
                content: 'ロールを管理する権限がないでし！',
            });
        }

        switch (interaction.options.getSubcommand()) {
            case '全設定表示':
                await showAllUniqueRoleSettings(interaction);
                break;
            case '登録':
                await setUniqueRoleCommand(interaction);
                break;
            case '解除':
                await unsetUniqueRoleCommand(interaction);
                break;
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
