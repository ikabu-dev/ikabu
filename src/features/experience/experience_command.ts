import { SlashCommandBuilder } from 'discord.js';

import { handleIkabuExperience } from '@/features/experience/experience';

import type { GuildChatInputCommand } from '@/shared/command_types';

const experience = new SlashCommandBuilder()
    .setName('イカ部歴')
    .setDescription('イカ部歴を表示します。')
    .setDMPermission(false);

export const experienceCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: experience,
    execute: handleIkabuExperience,
};
