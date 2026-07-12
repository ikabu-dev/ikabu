import { ColorResolvable } from 'discord.js';

import { prisma } from '@/infra/db/prisma';

export class RoleService {
    static async save(
        guildId: string,
        roleId: string,
        roleName: string,
        memberCount: number,
        color: ColorResolvable,
        position: number,
    ) {
        return await prisma.role.upsert({
            where: {
                guildId_roleId: {
                    guildId: guildId,
                    roleId: roleId,
                },
            },
            update: {
                name: roleName,
                mention: `<@&${roleId}>`,
                memberCount: memberCount,
                hexColor: color.toString(),
                position: position,
            },
            create: {
                guildId: guildId,
                roleId: roleId,
                name: roleName,
                mention: `<@&${roleId}>`,
                memberCount: memberCount,
                hexColor: color.toString(),
                position: position,
            },
        });
    }

    // delete() は対象行が無いと P2025 で throw するため、冪等性を保つために deleteMany を使う。
    static async delete(guildId: string, roleId: string): Promise<void> {
        await prisma.role.deleteMany({
            where: {
                guildId: guildId,
                roleId: roleId,
            },
        });
    }

    static async getRole(guildId: string, roleId: string) {
        return await prisma.role.findUnique({
            where: {
                guildId_roleId: {
                    guildId: guildId,
                    roleId: roleId,
                },
            },
        });
    }

    static async searchRole(guildId: string, roleName: string) {
        return await prisma.role.findFirst({
            where: {
                guildId: guildId,
                name: roleName,
            },
        });
    }

    static async getAllGuildRoles(guildId: string) {
        return await prisma.role.findMany({
            where: {
                guildId: guildId,
            },
        });
    }

    static async getAllRoles() {
        return await prisma.role.findMany();
    }
}
