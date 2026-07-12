import { SlashCommandBuilder, SlashCommandIntegerOption } from 'discord.js';

import { handleVoicePick } from '@/features/voice/vpick';

import type { GuildChatInputCommand } from '@/shared/command_types';

const vpick = new SlashCommandBuilder()
    .setName('vpick')
    .setDMPermission(false)
    .setDescription('VCに接続しているメンバーからランダムに抽出します。')
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option
            .setName('ピックする人数')
            .setDescription('2人以上ピックしたい場合は指定してください。')
            .setRequired(false),
    );

export const vpickCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: vpick,
    execute: handleVoicePick,
};
