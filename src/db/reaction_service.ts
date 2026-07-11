import { dbCall } from './db_call.js';
import { prisma } from './prisma';
import { log4js_obj } from '../log4js_settings';
const logger = log4js_obj.getLogger('database');

export class ReactionService {
    static async save(emojiId: string, emojiName: string, count: number) {
        return dbCall(logger, undefined, async () => {
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
        });
    }

    static async update(reactionSeq: number, count: number) {
        return dbCall(logger, undefined, async () => {
            await prisma.reaction.update({
                where: {
                    reactionSeq: reactionSeq,
                },
                data: {
                    count: count,
                },
            });
        });
    }

    static async getTotalReactionByEmoji(emojiId: string, emojiName: string) {
        return dbCall(logger, null, async () => {
            const result = await prisma.reaction.findUnique({
                where: {
                    emojiId_emojiName: {
                        emojiId: emojiId,
                        emojiName: emojiName,
                    },
                },
            });
            return result;
        });
    }
}
