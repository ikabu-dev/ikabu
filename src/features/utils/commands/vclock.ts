import {
    SlashCommandBuilder,
    SlashCommandIntegerOption,
    SlashCommandSubcommandBuilder,
} from 'discord.js';

import { voiceLocker } from '@/features/utils/voice/voice_locker';

import type { GuildChatInputCommand } from '@/registry/types';

const voiceLock = new SlashCommandBuilder()
    .setName('ボイスロック')
    .setDescription('ボイスチャンネルに人数制限を設定します。')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('vclock')
            .setDescription('このボイスチャンネルに人数制限をかけます')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('人数')
                    .setDescription('制限人数を指定する場合は1～99で指定してください。')
                    .setRequired(false),
            ),
    )
    .setDMPermission(false);

export const vclockCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: voiceLock,
    // 応答済み・保留中のインタラクションでは何もしない(移行前の分岐条件を維持)
    execute: async (interaction) => {
        if (interaction.replied || interaction.deferred) return;
        await voiceLocker(interaction);
    },
};
