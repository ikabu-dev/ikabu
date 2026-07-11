import { ChatInputCommandInteraction } from 'discord.js';

import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { isRoleKey } from '@/config/constants/role_key';
import { RoleService } from '@/db/role_service';
import { UniqueRoleService } from '@/db/unique_role_service';
import { log4js_obj } from '@/log4js_settings';
import { assertExistCheck, exists, notExists } from '@/shared/assert';

const logger = log4js_obj.getLogger('interaction');

export async function unsetUniqueRoleCommand(
    interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
) {
    try {
        const options = interaction.options;
        const key = options.getString('設定項目', true);

        // keyがRoleKeyに存在するかチェック
        if (!isRoleKey(key)) {
            return await interaction.editReply({
                content: '存在しないキーが選択されたでし！',
            });
        }

        const storedRoleId = await UniqueRoleService.getRoleIdByKey(interaction.guildId, key);

        if (notExists(storedRoleId)) {
            await interaction.editReply({
                content: 'その項目にはロールが設定されていなかったでし！',
            });
            return;
        }

        const deletedRole = await UniqueRoleService.delete(interaction.guildId, key);

        if (exists(deletedRole)) {
            const role = await RoleService.getRole(interaction.guildId, deletedRole.roleId);
            assertExistCheck(role, 'storedRole');
            await interaction.editReply({
                content: `\`${role.name}\`を\`${key}\`の設定から解除したでし！`,
            });
        } else {
            await interaction.editReply({
                content: '設定の解除に失敗したでし！',
            });
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
