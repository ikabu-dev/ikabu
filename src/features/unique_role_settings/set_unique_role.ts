import { ChatInputCommandInteraction } from 'discord.js';

import { isRoleKey } from '@/config/constants/role_key';
import { UniqueRoleService } from '@/infra/db/repositories/unique_role_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
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
