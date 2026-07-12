import {
    ChannelType,
    SlashCommandBuilder,
    SlashCommandChannelOption,
    SlashCommandIntegerOption,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
    SlashCommandUserOption,
} from 'discord.js';

import { raidersRecruit } from '@/features/recruit/create/raiders_recruit';

import type { GuildChatInputCommand } from '@/shared/command_types';

const raidersMatch = new SlashCommandBuilder()
    .setName('レイダース募集')
    .setDescription('スプラトゥーン レイダース募集コマンド')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('recruit')
            .setDescription('スプラトゥーン レイダースの募集をたてます。')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('募集人数')
                    .setDescription(
                        '募集人数を設定します。あなたの他に参加者が決定している場合は参加者に指定してください。',
                    )
                    .setChoices(
                        { name: '@1', value: 1 },
                        { name: '@2', value: 2 },
                        { name: '@3', value: 3 },
                    )
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('参加条件')
                    .setDescription('プレイ内容や参加条件など')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者1')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者2')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            ),
    )
    .setDMPermission(false);

export const raidersRecruitCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: raidersMatch,
    execute: raidersRecruit,
};
