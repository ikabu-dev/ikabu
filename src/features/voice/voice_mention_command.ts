import {
    ChannelType,
    SlashCommandBuilder,
    SlashCommandChannelOption,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
} from 'discord.js';

import { voiceMention } from '@/features/voice/voice_mention';

import type { GuildChatInputCommand } from '@/registry/types';

const voiceChannelMention = new SlashCommandBuilder()
    .setName('ボイスメンション')
    .setDescription('VCメンバー全員にメンションを送ります。')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('vcmention')
            .setDescription(
                'このチャンネルに、指定したVCにいるメンバー全員へのメンションを送ります。',
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('メッセージ')
                    .setDescription('メンションと一緒に送るメッセージを入力します。')
                    .setRequired(true),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('チャンネル')
                    .setDescription('メンションを送りたいメンバーがいるVCを指定します。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            ),
    )
    .setDMPermission(false);

export const voiceMentionCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: voiceChannelMention,
    execute: voiceMention,
};
