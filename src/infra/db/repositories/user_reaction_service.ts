import { prisma } from '@/infra/db/prisma';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
const logger = log4js_obj.getLogger('database');

export class UserReactionService {
    static async save(
        userId: string,
        reactionSeq: number,
        channelId: string,
        year: string,
        count: number,
    ) {
        try {
            await prisma.userReaction.upsert({
                where: {
                    userId_reactionSeq_year_channelId: {
                        userId: userId,
                        reactionSeq: reactionSeq,
                        channelId: channelId,
                        year: year,
                    },
                },
                update: {
                    count: count,
                },
                create: {
                    userId: userId,
                    reactionSeq: reactionSeq,
                    channelId: channelId,
                    year: year,
                    count: count,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
        }
    }

    static async getReactionCountByPK(
        userId: string,
        reactionSeq: number,
        channelId: string,
        year: string,
    ) {
        try {
            const result = await prisma.userReaction.findUnique({
                where: {
                    userId_reactionSeq_year_channelId: {
                        userId: userId,
                        reactionSeq: reactionSeq,
                        channelId: channelId,
                        year: year,
                    },
                },
            });
            return result;
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }

    static async getReactionCountByUserId(userId: string) {
        try {
            const result = await prisma.userReaction.findMany({
                where: {
                    userId: userId,
                },
            });
            return result;
        } catch (error) {
            await sendErrorLogs(logger, error);
            return [];
        }
    }

    static async getReactionCountByReactionSeq(reactionSeq: number) {
        try {
            const result = await prisma.userReaction.findMany({
                where: {
                    reactionSeq: reactionSeq,
                },
            });
            return result;
        } catch (error) {
            await sendErrorLogs(logger, error);
            return [];
        }
    }
}
