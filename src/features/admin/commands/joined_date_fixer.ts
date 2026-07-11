import {
    SlashCommandBooleanOption,
    SlashCommandBuilder,
    SlashCommandIntegerOption,
    SlashCommandUserOption,
} from 'discord.js';

import { joinedAtFixer } from '@/features/admin/joined_date_fixer/fix_joined_date';

import type { GuildChatInputCommand } from '@/registry/types';

const joinedDateFixer = new SlashCommandBuilder()
    .setName('入部日修正')
    .setDMPermission(false)
    .setDescription('入部日を修正します。(開発者限定コマンド)')
    .addUserOption((option: SlashCommandUserOption) =>
        option
            .setName('ユーザー')
            .setDescription('入部日を修正するユーザーを指定')
            .setRequired(true),
    )
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option.setName('年').setDescription('西暦で年を入力').setRequired(true),
    )
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option.setName('月').setDescription('月を入力').setRequired(true),
    )
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option.setName('日').setDescription('日を入力').setRequired(true),
    )
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option.setName('時').setDescription('24h表記で時間を入力').setRequired(true),
    )
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option.setName('分').setDescription('分を入力').setRequired(true),
    )
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option.setName('秒').setDescription('秒を入力').setRequired(false),
    )
    .addBooleanOption((option: SlashCommandBooleanOption) =>
        option
            .setName('強制設定')
            .setDescription('入部日を強制的に設定します。【後の日付でも設定可能】')
            .setRequired(false),
    );

export const joinedDateFixerCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: joinedDateFixer,
    execute: joinedAtFixer,
};
