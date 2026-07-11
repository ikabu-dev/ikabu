import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';

import { handleShow } from '@/features/stage_info/show';

import type { GlobalChatInputCommand } from '@/registry/types';

const show = new SlashCommandBuilder()
    .setName('show')
    .setDescription('ステージ情報を表示')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('now').setDescription('現在のX,バンカラマッチのステージ情報を表示'),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('next').setDescription('次のX,バンカラマッチのステージ情報を表示'),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('nawabari').setDescription('現在のナワバリのステージ情報を表示'),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('run').setDescription('2つ先までのシフトを表示'),
    );

export const showCommand: GlobalChatInputCommand = {
    kind: 'chatInput',
    guildOnly: false,
    definition: show,
    execute: handleShow,
};
