import { SlashCommandBuilder } from 'discord.js';

import { shutdown as shutdownHandler } from '@/features/shutdown/shutdown_process';

import type { GuildChatInputCommand } from '@/registry/types';

const shutdown = new SlashCommandBuilder()
    .setName('shutdown')
    .setDescription('このBOTをシャットダウンします。')
    .setDMPermission(false);

export const shutdownCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: shutdown,
    execute: shutdownHandler,
};
