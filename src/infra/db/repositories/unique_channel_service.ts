import { ChannelKey, isChannelKey } from '@/config/constants/channel_key';
import { prisma } from '@/infra/db/prisma';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { notExists } from '@/shared/assert';

const logger = log4js_obj.getLogger('database');

export class UniqueChannelService {
    static async save(guildId: string, key: ChannelKey, channelId: string) {
        try {
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
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }

    static async getChannelIdByKey(guildId: string, key: ChannelKey) {
        try {
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
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }

    static async getAllUniqueChannels(guildId: string) {
        try {
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
        } catch (error) {
            await sendErrorLogs(logger, error);
            return [];
        }
    }

    static async delete(guildId: string, key: ChannelKey) {
        try {
            return await prisma.uniqueChannel.delete({
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
