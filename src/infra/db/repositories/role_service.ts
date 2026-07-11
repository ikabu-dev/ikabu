import { ColorResolvable } from 'discord.js';

import { prisma } from '@/infra/db/prisma';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';

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
        try {
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
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }

    static async delete(guildId: string, roleId: string) {
        try {
            return await prisma.role.delete({
                where: {
                    guildId_roleId: {
                        guildId: guildId,
                        roleId: roleId,
                    },
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }

    static async getRole(guildId: string, roleId: string) {
        try {
            return await prisma.role.findUnique({
                where: {
                    guildId_roleId: {
                        guildId: guildId,
                        roleId: roleId,
                    },
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }

    static async searchRole(guildId: string, roleName: string) {
        try {
            return await prisma.role.findFirst({
                where: {
                    guildId: guildId,
                    name: roleName,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }

    static async getAllGuildRoles(guildId: string) {
        try {
            return await prisma.role.findMany({
                where: {
                    guildId: guildId,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
            return [];
        }
    }

    static async getAllRoles() {
        try {
            return await prisma.role.findMany();
        } catch (error) {
            await sendErrorLogs(logger, error);
            return [];
        }
    }
}
