import {
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
} from 'discord.js';

import { variablesHandler } from '@/features/admin/environment_variables/variables_handler';

import type { GuildChatInputCommand } from '@/registry/types';

const variablesSettings = new SlashCommandBuilder()
    .setName('環境変数設定')
    .setDescription('環境変数の設定・表示ができます。')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('表示').setDescription('環境変数ファイル(.env)の設定内容を表示します。'),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('登録更新')
            .setDescription('環境変数ファイル(.env)を上書きします。')
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('key').setDescription('変数名を入力').setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('value').setDescription('登録する値を入力').setRequired(true),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('削除')
            .setDescription('環境変数ファイル(.env)から変数を削除します。')
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('key').setDescription('変数名を入力').setRequired(true),
            ),
    )
    .setDMPermission(false);

export const variablesSettingsCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: variablesSettings,
    execute: variablesHandler,
};
