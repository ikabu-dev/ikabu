import { ColorResolvable } from 'discord.js';

import { dbCall } from './db_call.js';
import { prisma } from './prisma';
import { log4js_obj } from '../log4js_settings';

const logger = log4js_obj.getLogger('database');

export class RoleService {
    static async save(
        guildId: string,
        roleId: string,
        roleName: string,
        memberCount: number,
        color: ColorResolvable,
        position: number,
    ) {
        return dbCall(logger, null, async () => {
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
        });
    }

    static async delete(guildId: string, roleId: string) {
        return dbCall(logger, null, async () => {
            return await prisma.role.delete({
                where: {
                    guildId_roleId: {
                        guildId: guildId,
                        roleId: roleId,
                    },
                },
            });
        });
    }

    static async getRole(guildId: string, roleId: string) {
        return dbCall(logger, null, async () => {
            return await prisma.role.findUnique({
                where: {
                    guildId_roleId: {
                        guildId: guildId,
                        roleId: roleId,
                    },
                },
            });
        });
    }

    static async searchRole(guildId: string, roleName: string) {
        return dbCall(logger, null, async () => {
            return await prisma.role.findFirst({
                where: {
                    guildId: guildId,
                    name: roleName,
                },
            });
        });
    }

    static async getAllGuildRoles(guildId: string) {
        return dbCall(logger, [], async () => {
            return await prisma.role.findMany({
                where: {
                    guildId: guildId,
                },
            });
        });
    }

    static async getAllRoles() {
        return dbCall(logger, [], async () => {
            return await prisma.role.findMany();
        });
    }
}
