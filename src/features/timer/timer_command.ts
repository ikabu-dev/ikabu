import { SlashCommandBuilder, SlashCommandIntegerOption } from 'discord.js';

import { handleTimer } from '@/features/timer/timer';

import type { GlobalChatInputCommand } from '@/registry/types';

const minutesTimer = new SlashCommandBuilder()
    .setName('timer')
    .setDescription('分タイマー')
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option
            .setName('分')
            .setDescription('〇〇分後まで1分ごとにカウントダウンします。')
            .setRequired(true),
    );

export const timerCommand: GlobalChatInputCommand = {
    kind: 'chatInput',
    guildOnly: false,
    definition: minutesTimer,
    execute: handleTimer,
};
