import {
    ChannelType,
    SlashCommandBuilder,
    SlashCommandChannelOption,
    SlashCommandIntegerOption,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
    SlashCommandUserOption,
} from 'discord.js';

import { festRecruit } from '@/features/recruit/create/fest_recruit';

import type { GuildChatInputCommand } from '@/shared/command_types';

/**
 * フェス募集コマンドは陣営ごとに存在するが、陣営名以外はすべて同一。
 * 陣営が入れ替わってもここだけ直せば済むよう、定義はファクトリで組み立てる。
 */
function createFestRecruitCommand(team: string): GuildChatInputCommand {
    const camp = `${team}陣営`;

    const definition = new SlashCommandBuilder()
        .setName(camp)
        .setDescription(`フェス(${camp}) 募集コマンド`)
        .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
            addRecruitOptions(subcommand)
                .setName('now')
                .setDescription(`現在のフェスマッチの募集をたてます。(${camp})`),
        )
        .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
            addRecruitOptions(subcommand)
                .setName('next')
                .setDescription(`次のフェスマッチの募集をたてます。(${camp})`),
        )
        .setDMPermission(false);

    return {
        kind: 'chatInput',
        guildOnly: true,
        definition,
        execute: festRecruit,
    };
}

function addRecruitOptions(subcommand: SlashCommandSubcommandBuilder) {
    return subcommand
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
        );
}

export const fesACommand = createFestRecruitCommand('フウカ');
export const fesBCommand = createFestRecruitCommand('マンタロー');
export const fesCCommand = createFestRecruitCommand('ウツホ');
