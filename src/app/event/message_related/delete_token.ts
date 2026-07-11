import { ChannelType, Message } from 'discord.js';

import { searchChannelById, searchChannelIdByName } from '@/app/common/manager/channel_manager';
import { assertExistCheck, exists } from '@/app/common/others';

export async function deleteToken(message: Message<true>) {
    if (message.content.match('[a-zA-Z0-9_-]{23,28}\\.[a-zA-Z0-9_-]{6,7}\\.[a-zA-Z0-9_-]{27}')) {
        await message.delete();

        const notifyChannelId = await searchChannelIdByName(
            message.guild,
            '精神とテクの部屋',
            ChannelType.GuildText,
        );
        assertExistCheck(notifyChannelId, '精神とテクの部屋');
        const notifyChannel = await searchChannelById(message.guild, notifyChannelId);
        if (exists(notifyChannel) && notifyChannel.isTextBased()) {
            await notifyChannel.send(`token検出 (author: <@${message.author.id}>)`);
        }
    }
}
