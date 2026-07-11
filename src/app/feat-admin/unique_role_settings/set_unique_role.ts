import { ChatInputCommandInteraction } from 'discord.js';

import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { isRoleKey } from '@/config/constants/role_key';
import { UniqueRoleService } from '@/db/unique_role_service';
import { log4js_obj } from '@/log4js_settings';
import { exists } from '@/shared/assert';

const logger = log4js_obj.getLogger('interaction');

export async function setUniqueRoleCommand(
    interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
) {
    try {
        const options = interaction.options;
        const key = options.getString('設定項目', true);
        const role = options.getRole('ロール', true);

        // keyがRoleKeyに存在するかチェック
        if (!isRoleKey(key)) {
            return await interaction.editReply({
                content: '存在しないキーが選択されたでし！',
            });
        }

        const registeredRole = await UniqueRoleService.save(interaction.guildId, key, role.id);

        if (exists(registeredRole)) {
            await interaction.editReply({
                content: `\`${role.name}\`を\`${key}\`として設定したでし！`,
            });
        } else {
            await interaction.editReply({
                content: '設定に失敗したでし！',
            });
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
