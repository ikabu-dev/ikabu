import { SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';

import { handleWiki } from '@/features/wiki/wiki';

import type { GlobalChatInputCommand } from '@/registry/types';

const wiki = new SlashCommandBuilder()
    .setName('wiki')
    .setDescription('wikipediaで調べる')
    .addStringOption((option: SlashCommandStringOption) =>
        option.setName('キーワード').setDescription('調べたいキーワードを入力').setRequired(true),
    );

export const wikiCommand: GlobalChatInputCommand = {
    kind: 'chatInput',
    guildOnly: false,
    definition: wiki,
    execute: handleWiki,
};
