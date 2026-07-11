import { SlashCommandBuilder } from 'discord.js';

import { commandNames } from '@/config/constants/commands';

export const shutdown = new SlashCommandBuilder()
    .setName(commandNames.shutdown)
    .setDescription('このBOTをシャットダウンします。')
    .setDMPermission(false);
