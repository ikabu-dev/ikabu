import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';

import { handleHelp } from '@/features/help/help';

import type { GlobalChatInputCommand } from '@/registry/types';

const help = new SlashCommandBuilder()
    .setName('help')
    .setDescription('ヘルプを表示します。')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('recruit').setDescription('募集コマンドの使い方を表示'),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('voice').setDescription('読み上げ機能のヘルプを表示'),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('other').setDescription('募集コマンド以外の使い方を表示'),
    );

export const helpCommand: GlobalChatInputCommand = {
    kind: 'chatInput',
    guildOnly: false,
    definition: help,
    execute: handleHelp,
};
