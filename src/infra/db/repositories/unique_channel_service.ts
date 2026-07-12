import { ChannelKey, isChannelKey } from '@/config/constants/channel_key';
import { prisma } from '@/infra/db/prisma';
import { notExists } from '@/shared/assert';

export class UniqueChannelService {
    static async save(guildId: string, key: ChannelKey, channelId: string) {
        return await prisma.uniqueChannel.upsert({
            where: {
                guildId_key: {
                    guildId: guildId,
                    key: key,
                },
            },
            update: {
                channelId: channelId,
            },
            create: {
                guildId: guildId,
                channelId: channelId,
                key: key,
            },
        });
    }

    static async getChannelIdByKey(guildId: string, key: ChannelKey) {
        const result = await prisma.uniqueChannel.findUnique({
            where: {
                guildId_key: {
                    guildId: guildId,
                    key: key,
                },
            },
        });
        if (notExists(result)) return null;
        return result.channelId;
    }

    static async getAllUniqueChannels(guildId: string) {
        const results = await prisma.uniqueChannel.findMany({
            where: {
                guildId: guildId,
            },
        });

        // ChannelKeyの型を保証するために、新しく配列を作り直す
        const filteredResults: { guildId: string; key: ChannelKey; channelId: string }[] = [];

        for (const result of results) {
            if (isChannelKey(result.key)) {
                // ChannelKeyの値が正しいかどうかのチェック
                filteredResults.push({
                    guildId: result.guildId,
                    key: result.key,
                    channelId: result.channelId,
                });
            } else {
                throw new Error(`Invalid ChannelKey: ${result.key}`);
            }
        }

        return filteredResults;
    }

    // delete() は対象行が無いと P2025 で throw するため、冪等性を保つために deleteMany を使う。
    // deleteMany は削除した行そのものを返さないので、削除できたかどうかを boolean で返す。
    static async delete(guildId: string, key: ChannelKey): Promise<boolean> {
        const result = await prisma.uniqueChannel.deleteMany({
            where: {
                guildId: guildId,
                key: key,
            },
        });
        return result.count > 0;
    }
}
