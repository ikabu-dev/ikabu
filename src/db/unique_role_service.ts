import { RoleKey, isRoleKey } from '@/config/constants/role_key';
import { notExists } from '@/shared/assert';

import { prisma } from './prisma';
import { sendErrorLogs } from '../app/logs/error/send_error_logs';
import { log4js_obj } from '../log4js_settings';

const logger = log4js_obj.getLogger('database');

export class UniqueRoleService {
    static async save(guildId: string, key: RoleKey, roleId: string) {
        try {
            return await prisma.uniqueRole.upsert({
                where: {
                    guildId_key: {
                        guildId: guildId,
                        key: key,
                    },
                },
                update: {
                    roleId: roleId,
                },
                create: {
                    guildId: guildId,
                    roleId: roleId,
                    key: key,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }

    static async getRoleIdByKey(guildId: string, key: RoleKey) {
        try {
            const result = await prisma.uniqueRole.findUnique({
                where: {
                    guildId_key: {
                        guildId: guildId,
                        key: key,
                    },
                },
            });
            if (notExists(result)) return null;
            return result.roleId;
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }

    static async getAllUniqueRoles(guildId: string) {
        try {
            const results = await prisma.uniqueRole.findMany({
                where: {
                    guildId: guildId,
                },
            });

            // RoleKeyの型を保証するために、新しく配列を作り直す
            const filteredResults: { guildId: string; key: RoleKey; roleId: string }[] = [];

            for (const result of results) {
                if (isRoleKey(result.key)) {
                    // RoleKeyの値が正しいかどうかのチェック
                    filteredResults.push({
                        guildId: result.guildId,
                        key: result.key,
                        roleId: result.roleId,
                    });
                } else {
                    throw new Error(`Invalid RoleKey: ${result.key}`);
                }
            }

            return filteredResults;
        } catch (error) {
            await sendErrorLogs(logger, error);
            return [];
        }
    }

    static async delete(guildId: string, key: RoleKey) {
        try {
            return await prisma.uniqueRole.delete({
                where: {
                    guildId_key: {
                        guildId: guildId,
                        key: key,
                    },
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }
}
