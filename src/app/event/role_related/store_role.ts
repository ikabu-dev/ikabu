import { Client, Guild, Role } from 'discord.js';

import { notExists } from '@/app/common/others';
import { RoleService } from '@/db/role_service';

export async function saveRole(role: Role) {
    await RoleService.save(
        role.guild.id,
        role.id,
        role.name,
        role.members.size,
        role.color,
        role.position,
    );
}

export async function deleteRole(role: Role) {
    await RoleService.delete(role.guild.id, role.id);
}

export async function updateGuildRoles(guild: Guild) {
    const roleCollection = await guild.roles.fetch();

    // 各ロールをDBに保存する
    roleCollection.forEach(async (role) => {
        if (notExists(role)) return;

        await saveRole(role);
    });
}

export async function saveRoleAtLaunch(client: Client) {
    const clientGuilds = client.guilds.cache;
    clientGuilds.forEach(async (guild) => {
        const roleCollection = await guild.roles.fetch();

        // ロールをDBに保存する
        roleCollection.forEach(async (role) => {
            if (notExists(role)) return;

            await saveRole(role);
        });

        // 削除されたロールをDBから削除する
        const storedRoles = await RoleService.getAllGuildRoles(guild.id);
        storedRoles.forEach(async (storedRole) => {
            if (notExists(roleCollection.get(storedRole.roleId))) {
                await RoleService.delete(guild.id, storedRole.roleId);
            }
        });
    });

    // 存在しないサーバーのロールをDBから削除する
    const storedRoles = await RoleService.getAllRoles();
    storedRoles.forEach(async (storedRole) => {
        if (notExists(clientGuilds.get(storedRole.guildId))) {
            await RoleService.delete(storedRole.guildId, storedRole.roleId);
        }
    });
}
