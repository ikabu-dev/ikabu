import { EmbedBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';

import { ErrorTexts } from '@/config/constants/error_texts';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { notExists, assertExistCheck, exists } from '@/shared/assert';
import { searchChannelById } from '@/shared/discord_helpers/channel_manager';
import { searchAPIMemberById, getMemberColor } from '@/shared/discord_helpers/member_manager';
import { isNotEmpty, isEmpty } from '@/shared/string';

const logger = log4js_obj.getLogger('interaction');

export async function voiceMention(interaction: ChatInputCommandInteraction<'cached'>) {
    try {
        await interaction.deferReply({});

        const guild = interaction.guild;

        let text = interaction.options.getString('メッセージ', true);
        let voiceChannel = interaction.options.getChannel('チャンネル');
        let sendChannel;

        if (notExists(voiceChannel)) {
            voiceChannel = await searchChannelById(guild, interaction.channelId);
            sendChannel = voiceChannel;
        } else {
            voiceChannel = await searchChannelById(guild, voiceChannel.id);
            sendChannel = await searchChannelById(guild, interaction.channelId);
        }
        assertExistCheck(voiceChannel, 'channel');
        assertExistCheck(sendChannel, 'channel');

        if (!voiceChannel.isVoiceBased()) {
            await interaction.editReply({
                content:
                    'このチャンネルはテキストチャンネルでし！\nここにメンションしたい場合は、オプションでメンションしたいメンバーがいるボイスチャンネルを指定するでし！',
            });
            return;
        }

        const author = await searchAPIMemberById(guild, interaction.member.user.id);
        assertExistCheck(author, 'author');
        const members = voiceChannel.members;

        if (members.size < 1) {
            await interaction.editReply({ content: 'そのVCには誰もいないでし！' });
            return;
        }

        let mentions = '';
        for (const member of members) {
            mentions += `<@${member[1].id}>`;
        }
        mentions += '\n';

        if (isEmpty(text)) {
            text = 'メッセージはありません。';
        }

        await interaction.deleteReply();

        const embed = await createEmbed(author, text, interaction.createdAt);
        if (sendChannel.isTextBased()) {
            await sendChannel.send({ content: mentions, embeds: [embed] });
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        if (exists(interaction.channel) && interaction.channel.isTextBased()) {
            await interaction.channel.send(ErrorTexts.UndefinedError);
        }
    }
}

async function createEmbed(author: GuildMember, text: string, createdAt: Date) {
    const embed = new EmbedBuilder();
    const color = getMemberColor(author);
    if (isNotEmpty(text)) {
        embed.setDescription(text);
    }
    embed.setTimestamp(createdAt);
    embed.setColor(color);
    embed.setAuthor({
        name: author.displayName,
        iconURL: author.displayAvatarURL(),
    });
    return embed;
}
