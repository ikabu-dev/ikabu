import { SlashCommandBuilder } from 'discord.js';

import { commandNames } from '@/constant';

export const shutdown = new SlashCommandBuilder()
    .setName(commandNames.shutdown)
    .setDescription('このBOTをシャットダウンします。')
    .setDMPermission(false);
