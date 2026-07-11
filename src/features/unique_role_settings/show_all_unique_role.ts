import { ChatInputCommandInteraction } from 'discord.js';

import { RoleKeySet, getUniqueRoleNameByKey } from '@/config/constants/role_key';
import { UniqueRoleService } from '@/infra/db/repositories/unique_role_service';
import { notExists } from '@/shared/assert';

export async function showAllUniqueRoleSettings(
    interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
) {
    const uniqueRoles = await UniqueRoleService.getAllUniqueRoles(interaction.guildId);

    let message =
        `設定済みの項目を表示するでし！` +
        `[${uniqueRoles.length}/${Object.values(RoleKeySet).length}]\n`;

    for (const uniqueRole of uniqueRoles) {
        const keyName = getUniqueRoleNameByKey(uniqueRole.key);

        if (notExists(keyName)) {
            message += `- \`${uniqueRole.key}\`: \`keyName missing.\`\n`;
        } else {
            message += `- **${keyName}**: <@&${uniqueRole.roleId}>\n`;
        }
    }

    await interaction.editReply(message);
}
