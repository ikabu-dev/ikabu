import {
    SlashCommandBooleanOption,
    SlashCommandBuilder,
    SlashCommandIntegerOption,
    SlashCommandSubcommandBuilder,
} from 'discord.js';

import { dividerInitialMessage } from '@/features/team_divider/divider';

import type { GuildChatInputCommand } from '@/shared/command_types';

const teamDivider = new SlashCommandBuilder()
    .setName('チーム分け')
    .setDescription('チーム分けを行います。')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('team')
            .setDescription('勝率に応じてチーム分けを行うことができます。')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('各チームのメンバー数')
                    .setDescription('それぞれのチームメンバー数(ex: スプラ=4, valo=5)')
                    .setRequired(true),
            )
            .addBooleanOption((option: SlashCommandBooleanOption) =>
                option
                    .setName('勝利数と勝率を隠す')
                    .setDescription('勝利数と勝率を隠すことができます。'),
            ),
    )
    .setDMPermission(false);

export const teamDividerCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: teamDivider,
    execute: dividerInitialMessage,
};
