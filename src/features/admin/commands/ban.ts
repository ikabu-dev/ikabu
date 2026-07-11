import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandUserOption } from 'discord.js';

import { handleBan } from '@/features/admin/ban/ban';

import type { GuildChatInputCommand } from '@/registry/types';

const ban = new SlashCommandBuilder()
    .setName('ban')
    .setDMPermission(false)
    .setDescription('banします。')
    .addUserOption((option: SlashCommandUserOption) =>
        option.setName('ban対象').setDescription('banする人を指定してください。').setRequired(true),
    )
    .addStringOption((option: SlashCommandStringOption) =>
        option
            .setName('ban理由')
            .setDescription('ban対象の人にブキチがDMします。')
            .setRequired(true),
    );

export const banCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: ban,
    execute: handleBan,
};
