import {
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
} from 'discord.js';

import { handleTTSCommand } from '@/features/utils/voice/tts/discordjs_voice';

import type { GuildChatInputCommand } from '@/registry/types';

const voice = new SlashCommandBuilder()
    .setName('voice')
    .setDescription('テキストチャットの読み上げコマンド')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('join').setDescription('読み上げを開始'),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('type')
            .setDescription('読み上げボイスの種類を変更します。')
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('音声の種類')
                    .setDescription('声の種類を選択してください。')
                    .setChoices(
                        { name: 'ひかり（女性）', value: 'hikari' },
                        { name: 'はるか（女性）', value: 'haruka' },
                        { name: 'たける（男性）', value: 'takeru' },
                        { name: 'サンタ', value: 'santa' },
                        { name: '凶暴なクマ', value: 'bear' },
                        { name: 'ショウ（男性）', value: 'show' },
                    )
                    .setRequired(true),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('kill').setDescription('読み上げを終了'),
    )
    .setDMPermission(false);

export const voiceCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: voice,
    execute: handleTTSCommand,
};
