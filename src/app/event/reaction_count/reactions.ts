import { MessageReaction, User } from 'discord.js';

import { ReactionService } from '@/db/reaction_service';
import { UserReactionService } from '@/db/user_reaction_service';
import { assertExistCheck, exists, notExists } from '@/shared/assert';

export async function emojiCountUp(reaction: MessageReaction, user: User) {
    if (!reaction.message.inGuild()) return;
    const userId = reaction.message.author.id;
    const emojiId = reaction.emoji.id ?? 'none';
    const emojiName = reaction.emoji.name ?? 'none';
    const channelId = reaction.message.channelId;
    const messageYear = reaction.message.createdAt.getFullYear().toString();
    const year = new Date().getFullYear().toString();
    if (messageYear !== year) return;
    // total_reactionからseq取得、なければ新規作成
    const result = await getTotalReaction(emojiId, emojiName);
    await ReactionService.update(result.reactionSeq, result.count + 1);
    if (messageYear === year && user.id !== userId) {
        // 同じ年のメッセージならカウントアップ、自分でリアクションした場合はカウントアップしない
        const count = await getReactionCount(userId, result.reactionSeq, channelId, year);
        await UserReactionService.save(userId, result.reactionSeq, channelId, year, count + 1);
    }
}

export async function emojiCountDown(reaction: MessageReaction, user: User) {
    if (!reaction.message.inGuild()) return;
    const userId = reaction.message.author.id;
    const emojiId = reaction.emoji.id ?? 'none';
    const emojiName = reaction.emoji.name ?? 'none';
    const channelId = reaction.message.channelId;
    const messageYear = reaction.message.createdAt.getFullYear().toString();
    const year = new Date().getFullYear().toString();
    if (messageYear !== year) return;
    // total_reactionからseq取得、なければ新規作成
    const result = await getTotalReaction(emojiId, emojiName);
    if (result.count > 0) {
        await ReactionService.update(result.reactionSeq, result.count - 1);
    }
    if (messageYear === year && user.id !== userId) {
        // 同じ年のメッセージならカウントダウン、自分でリアクションした場合はカウントダウンしない
        const count = await getReactionCount(userId, result.reactionSeq, channelId, year);
        if (count > 0) {
            await UserReactionService.save(userId, result.reactionSeq, channelId, year, count - 1);
        }
    }
}

async function getReactionCount(
    userId: string,
    reactionSeq: number,
    channelId: string,
    year: string,
) {
    let count = 1;
    const result = await UserReactionService.getReactionCountByPK(
        userId,
        reactionSeq,
        channelId,
        year,
    );
    if (exists(result)) {
        count = result.count;
    }
    return count;
}

async function getTotalReaction(emojiId: string, emojiName: string) {
    let result = await ReactionService.getTotalReactionByEmoji(emojiId, emojiName);
    if (notExists(result)) {
        await ReactionService.save(emojiId, emojiName, 0);
        result = await ReactionService.getTotalReactionByEmoji(emojiId, emojiName);
        assertExistCheck(result, 'reactionSeq');
    }
    return result;
}
