import { Attachment, EmbedBuilder, Message } from 'discord.js';

import { placeHold } from '@/config/constants/images';
import { exists } from '@/shared/assert';
import { searchAPIMemberById } from '@/shared/discord_helpers/member_manager';
import { isNotEmpty } from '@/shared/string';

export async function composeEmbed(message: Message<true>, url: string) {
    const embed = new EmbedBuilder();
    if (exists(message.content) && isNotEmpty(message.content)) {
        embed.setDescription(message.content);
    }
    embed.setTimestamp(message.createdAt);
    // webhookの場合はauthorがないので、getAPIMemberは使用しない
    const member = await searchAPIMemberById(message.guild, message.author.id);
    if (exists(url)) {
        embed.setTitle('引用元へジャンプ');
        embed.setURL(url);
    }
    if (exists(member)) {
        embed.setAuthor({
            name: member.displayName,
            iconURL: member.displayAvatarURL(),
        });
    } else {
        embed.setAuthor({
            name: '不明なユーザー',
            iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png',
        });
    }
    embed.setFooter({
        text: message.channel.name,
        iconURL: message.guild.iconURL() ?? placeHold.error100x100,
    });
    if (message.attachments.size > 0) {
        message.attachments.forEach((attachment: Attachment) => {
            embed.setImage(attachment.proxyURL);
        });
    }
    return embed;
}

/**
 * メッセージから順番に取得したメンションを配列で返す
 * @param message メッセージ
 * @param idOnly 取得したメンションをIDで返す場合はtrue
 * @returns メンション文字列を格納した配列を返す
 */
export function getMentionsFromMessage(message: Message<true>, idOnly = false) {
    const content = message.content;
    const matched = content.match(/<@\d{18,19}>/g);
    const results = [];
    if (exists(idOnly) && exists(matched)) {
        for (const mention of matched) {
            const delete_lead = mention.slice(2); // remove <@
            const delete_backward = delete_lead.slice(0, -1); // remove >
            results.push(delete_backward);
        }
        return results;
    }
    return matched;
}
