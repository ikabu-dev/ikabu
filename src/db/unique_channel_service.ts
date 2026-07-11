import { dbCall } from './db_call.js';
import { prisma } from './prisma';
import { notExists } from '../app/common/others';
import { ChannelKey, isChannelKey } from '../app/constant/channel_key';
import { log4js_obj } from '../log4js_settings';

const logger = log4js_obj.getLogger('database');

export class UniqueChannelService {
    static async save(guildId: string, key: ChannelKey, channelId: string) {
        return dbCall(logger, null, async () => {
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
        });
    }

    static async getChannelIdByKey(guildId: string, key: ChannelKey) {
        return dbCall(logger, null, async () => {
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
        });
    }

    static async getAllUniqueChannels(guildId: string) {
        return dbCall(logger, [], async () => {
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
        });
    }

    static async delete(guildId: string, key: ChannelKey) {
        return dbCall(logger, null, async () => {
            return await prisma.uniqueChannel.delete({
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
