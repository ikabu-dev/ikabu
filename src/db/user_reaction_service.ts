import { dbCall } from './db_call.js';
import { prisma } from './prisma';
import { log4js_obj } from '../log4js_settings';
const logger = log4js_obj.getLogger('database');

export class UserReactionService {
    static async save(
        userId: string,
        reactionSeq: number,
        channelId: string,
        year: string,
        count: number,
    ) {
        return dbCall(logger, undefined, async () => {
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
        });
    }

    static async getReactionCountByPK(
        userId: string,
        reactionSeq: number,
        channelId: string,
        year: string,
    ) {
        return dbCall(logger, null, async () => {
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
        });
    }

    static async getReactionCountByUserId(userId: string) {
        return dbCall(logger, [], async () => {
            const result = await prisma.userReaction.findMany({
                where: {
                    userId: userId,
                },
            });
            return result;
        });
    }

    static async getReactionCountByReactionSeq(reactionSeq: number) {
        return dbCall(logger, [], async () => {
            const result = await prisma.userReaction.findMany({
                where: {
                    reactionSeq: reactionSeq,
                },
            });
            return result;
        });
    }
}
