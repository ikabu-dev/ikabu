import {
    CacheType,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageContextMenuCommandInteraction,
} from 'discord.js';

import { sendEmbedsWebhook } from '@/app/common/webhook';
import { env } from '@/config/env';
import { assertExistCheck, exists } from '@/shared/assert';

export function sendCommandLog(
    interaction:
        MessageContextMenuCommandInteraction<CacheType> | ChatInputCommandInteraction<CacheType>,
) {
    let authorName = '不明なユーザー';
    let authorId = '????????????????????';
    let iconUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';
    let channelName = '不明なチャンネル';
    if (interaction.inCachedGuild()) {
        const member = interaction.member;
        authorName = member.displayName;
        authorId = member.id;
        iconUrl = member.displayAvatarURL();
        if (exists(interaction.channel)) {
            channelName = interaction.channel.name;
        }
    } else {
        const user = interaction.user;
        authorName = user.displayName;
        authorId = user.id;
        iconUrl = user.avatarURL() ?? 'https://cdn.discordapp.com/embed/avatars/0.png';
        channelName = 'DM or RawGuild';
    }

    let commandName = interaction.commandName;
    let title = 'コマンドログ';
    if (interaction.isChatInputCommand()) {
        title = 'スラッシュコマンドログ';
        if (interaction.inGuild()) {
            commandName = interaction.toString(); // 鯖内の場合はコマンド名と引数を表示
        } else {
            commandName = interaction.commandName; // DMの場合はコマンド名のみ
        }
    } else if (interaction.isMessageContextMenuCommand()) {
        title = 'コンテキストメニューログ';
        commandName = interaction.commandName;
    }

    const embed = new EmbedBuilder();
    embed.setTitle(title);
    embed.setAuthor({
        name: `${authorName} [${authorId}]`,
        iconURL: iconUrl,
    });
    embed.addFields([
        {
            name: '使用コマンド',
            value: commandName,
            inline: true,
        },
        {
            name: '使用チャンネル',
            value: channelName,
            inline: false,
        },
    ]);
    embed.setColor('#CFCFCF');
    embed.setTimestamp(interaction.createdAt);
    assertExistCheck(env.commandLogWebhookUrl, 'COMMAND_LOG_WEBHOOK_URL');
    void sendEmbedsWebhook(env.commandLogWebhookUrl, [embed]);
}
