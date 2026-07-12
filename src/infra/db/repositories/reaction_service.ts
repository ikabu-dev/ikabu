import { prisma } from '@/infra/db/prisma';

export class ReactionService {
    static async save(emojiId: string, emojiName: string, count: number) {
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
    }

    static async update(reactionSeq: number, count: number) {
        await prisma.reaction.updateMany({
            where: {
                reactionSeq: reactionSeq,
            },
            data: {
                count: count,
            },
        });
    }

    static async getTotalReactionByEmoji(emojiId: string, emojiName: string) {
        const result = await prisma.reaction.findUnique({
            where: {
                emojiId_emojiName: {
                    emojiId: emojiId,
                    emojiName: emojiName,
                },
            },
        });
        return result;
    }
}
