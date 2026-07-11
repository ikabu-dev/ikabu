import {
    SlashCommandBuilder,
    SlashCommandIntegerOption,
    SlashCommandSubcommandBuilder,
} from 'discord.js';

import { buttonRecruit as buttonRecruitHandler } from '@/features/recruit/create/button_recruit';

import type { GuildChatInputCommand } from '@/registry/types';

const buttonRecruit = new SlashCommandBuilder()
    .setName('募集ボタン')
    .setDescription('募集ボタンを使って募集を建てます。')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('button')
            .setDescription(
                '募集条件を通常のチャットで打ち込んだ後に通知と募集用のボタンを出せます。',
            )
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('募集人数')
                    .setDescription('募集人数を入力してください。')
                    .setRequired(false),
            ),
    )
    .setDMPermission(false);

export const buttonRecruitCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: buttonRecruit,
    execute: buttonRecruitHandler,
};
