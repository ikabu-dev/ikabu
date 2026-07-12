import { SlashCommandBuilder } from 'discord.js';

import { closeCommand } from '@/features/recruit/interactions/close_recruit/close_by_command';

import type { GuildChatInputCommand } from '@/shared/command_types';

const closeRecruit = new SlashCommandBuilder()
    .setName('close')
    .setDescription('募集を〆ます。ボタンが使えないときに使ってください。')
    .setDMPermission(false);

export const closeRecruitCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: closeRecruit,
    execute: closeCommand,
};
