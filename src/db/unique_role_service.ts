import { dbCall } from './db_call.js';
import { prisma } from './prisma';
import { notExists } from '../app/common/others';
import { RoleKey, isRoleKey } from '../app/constant/role_key';
import { log4js_obj } from '../log4js_settings';

const logger = log4js_obj.getLogger('database');

export class UniqueRoleService {
    static async save(guildId: string, key: RoleKey, roleId: string) {
        return dbCall(logger, null, async () => {
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
        });
    }

    static async getRoleIdByKey(guildId: string, key: RoleKey) {
        return dbCall(logger, null, async () => {
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
        });
    }

    static async getAllUniqueRoles(guildId: string) {
        return dbCall(logger, [], async () => {
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
        });
    }

    static async delete(guildId: string, key: RoleKey) {
        return dbCall(logger, null, async () => {
            return await prisma.uniqueRole.delete({
                where: {
                    guildId_key: {
                        guildId: guildId,
                        key: key,
                    },
                },
            });
        });
    }
}
