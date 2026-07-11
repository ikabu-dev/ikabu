import { prisma } from '@/infra/db/prisma';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
const logger = log4js_obj.getLogger('database');

export class ReactionService {
    static async save(emojiId: string, emojiName: string, count: number) {
        try {
            await prisma.reaction.upsert({
                where: {
                    emojiId_emojiName: {
                        emojiId: emojiId,
                        emojiName: emojiName,
                    },
                },
                update: {
                    count: count,
                },
                create: {
                    emojiId: emojiId,
                    emojiName: emojiName,
                    count: count,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
        }
    }

    static async update(reactionSeq: number, count: number) {
        try {
            await prisma.reaction.update({
                where: {
                    reactionSeq: reactionSeq,
                },
                data: {
                    count: count,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
        }
    }

    static async getTotalReactionByEmoji(emojiId: string, emojiName: string) {
        try {
            const result = await prisma.reaction.findUnique({
                where: {
                    emojiId_emojiName: {
                        emojiId: emojiId,
                        emojiName: emojiName,
                    },
                },
            });
            return result;
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }
}
