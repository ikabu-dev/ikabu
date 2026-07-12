import { Client, Guild, Role } from 'discord.js';

import { RoleService } from '@/infra/db/repositories/role_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { notExists } from '@/shared/assert';

const logger = log4js_obj.getLogger('database');

// roleCreate / roleUpdate / roleDelete から呼ばれる。
// 呼び出し元(gateway/events.ts)は await せず投げっぱなしにするため、
// ここで受け止めないと例外がそのまま unhandled rejection になる。
export async function saveRole(role: Role) {
    try {
        await RoleService.save(
            role.guild.id,
            role.id,
            role.name,
            role.members.size,
            role.color,
            role.position,
        );
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}

export async function deleteRole(role: Role) {
    try {
        await RoleService.delete(role.guild.id, role.id);
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}

export async function updateGuildRoles(guild: Guild) {
    const roleCollection = await guild.roles.fetch();

    // 各ロールをDBに保存する
    for (const role of roleCollection.values()) {
        if (notExists(role)) continue;

        await saveRole(role);
    }
}

export async function saveRoleAtLaunch(client: Client) {
    const clientGuilds = client.guilds.cache;

    // forEach(async ...) は返り値の Promise を捨てるため、呼び出し元が await しても
    // 完了が保証されず、例外も拾えない。逐次 await する。
    for (const guild of clientGuilds.values()) {
        const roleCollection = await guild.roles.fetch();

        // ロールをDBに保存する
        for (const role of roleCollection.values()) {
            if (notExists(role)) continue;

            await saveRole(role);
        }

        // 削除されたロールをDBから削除する
        const storedRoles = await RoleService.getAllGuildRoles(guild.id);
        for (const storedRole of storedRoles) {
            if (notExists(roleCollection.get(storedRole.roleId))) {
                await RoleService.delete(guild.id, storedRole.roleId);
            }
        }
    }

    // 存在しないサーバーのロールをDBから削除する
    const storedRoles = await RoleService.getAllRoles();
    for (const storedRole of storedRoles) {
        if (notExists(clientGuilds.get(storedRole.guildId))) {
            await RoleService.delete(storedRole.guildId, storedRole.roleId);
        }
    }
}
