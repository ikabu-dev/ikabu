import {
    ChannelType,
    SlashCommandBuilder,
    SlashCommandChannelOption,
    SlashCommandIntegerOption,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
    SlashCommandUserOption,
} from 'discord.js';

import { RoleKeySet } from '@/config/constants/role_key';
import { anarchyRecruit } from '@/features/recruit/create/anarchy_recruit';

import type { GuildChatInputCommand } from '@/shared/command_types';

const rankOption = new SlashCommandStringOption()
    .setName('募集ウデマエ')
    .setDescription('募集するウデマエを選択してください')
    .setChoices(
        { name: RoleKeySet.RankC.name, value: RoleKeySet.RankC.key },
        { name: RoleKeySet.RankB.name, value: RoleKeySet.RankB.key },
        { name: RoleKeySet.RankA.name, value: RoleKeySet.RankA.key },
        { name: RoleKeySet.RankS.name, value: RoleKeySet.RankS.key },
        { name: RoleKeySet.RankSP.name, value: RoleKeySet.RankSP.key },
    );

const anarchyMatch = new SlashCommandBuilder()
    .setName('バンカラ募集')
    .setDescription('バンカラマッチ募集コマンド')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('now')
            .setDescription('現在のバンカラマッチの募集をたてます。')
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
            .addStringOption(rankOption)
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
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('next')
            .setDescription('次のバンカラマッチの募集をたてます。')
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
            .addStringOption(rankOption)
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

export const anarchyRecruitCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: anarchyMatch,
    execute: anarchyRecruit,
};
