import { MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';

import { emojiCountDown, emojiCountUp } from '@/features/stats/reactions';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';

export async function handleReactionAdd(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
) {
    const loggerMRA = log4js_obj.getLogger('messageReactionAdd');
    try {
        // When a reaction is received, check if the structure is partial
        if (reaction.partial) {
            // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
            reaction = await reaction.fetch();
        }

        if (user.partial) {
            user = await user.fetch();
        }

        if (user.bot) {
            return;
        }

        await emojiCountUp(reaction, user);
    } catch (error) {
        await sendErrorLogs(loggerMRA, error);
    }
}

export async function handleReactionRemove(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
) {
    try {
        if (reaction.partial) {
            reaction = await reaction.fetch();
        }

        if (user.partial) {
            user = await user.fetch();
        }

        if (user.bot) {
            return;
        }

        await emojiCountDown(reaction, user);
    } catch (error) {
        const loggerMRR = log4js_obj.getLogger('messageReactionRemove');
        await sendErrorLogs(loggerMRR, error);
    }
}
