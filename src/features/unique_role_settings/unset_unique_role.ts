import { ChatInputCommandInteraction } from 'discord.js';

import { isRoleKey } from '@/config/constants/role_key';
import { RoleService } from '@/infra/db/repositories/role_service';
import { UniqueRoleService } from '@/infra/db/repositories/unique_role_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { assertExistCheck, notExists } from '@/shared/assert';

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

        // DB障害は throw されるようになったため、false は「解除する行が無かった」
        // (取得してから解除するまでの間に他の経路で解除された) を意味する
        const deleted = await UniqueRoleService.delete(interaction.guildId, key);

        if (!deleted) {
            await interaction.editReply({
                content: 'その項目は既に解除されていたでし！',
            });
            return;
        }

        const role = await RoleService.getRole(interaction.guildId, storedRoleId);
        assertExistCheck(role, 'storedRole');
        await interaction.editReply({
            content: `\`${role.name}\`を\`${key}\`の設定から解除したでし！`,
        });
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
