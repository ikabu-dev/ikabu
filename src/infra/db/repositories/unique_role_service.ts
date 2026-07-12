import { RoleKey, isRoleKey } from '@/config/constants/role_key';
import { prisma } from '@/infra/db/prisma';
import { notExists } from '@/shared/assert';

export class UniqueRoleService {
    static async save(guildId: string, key: RoleKey, roleId: string) {
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
    }

    static async getRoleIdByKey(guildId: string, key: RoleKey) {
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
    }

    static async getAllUniqueRoles(guildId: string) {
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
    }

    // delete() は対象行が無いと P2025 で throw するため、冪等性を保つために deleteMany を使う。
    // deleteMany は削除した行そのものを返さないので、削除できたかどうかを boolean で返す。
    static async delete(guildId: string, key: RoleKey): Promise<boolean> {
        const result = await prisma.uniqueRole.deleteMany({
            where: {
                guildId: guildId,
                key: key,
            },
        });
        return result.count > 0;
    }
}
