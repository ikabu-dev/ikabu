import {
    ChannelType,
    SlashCommandBuilder,
    SlashCommandChannelOption,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
} from 'discord.js';

import { otherGameRecruit } from '@/features/recruit/create/other_game_recruit';

import type { GuildChatInputCommand } from '@/shared/command_types';

const otherGame = new SlashCommandBuilder()
    .setName('別ゲー募集')
    .setDescription('スプラ以外のゲーム募集コマンド')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('apex')
            .setDescription('ApexLegendsの募集')
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('募集人数')
                    .setDescription('募集人数')
                    .setChoices(
                        { name: '@1', value: '1' },
                        { name: '@2', value: '2' },
                        { name: '@3', value: '3' },
                    )
                    .setRequired(true),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('内容または参加条件').setDescription('プレイ内容や参加条件など'),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('mhw')
            .setDescription('モンスターハンターワイルズの募集')
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('募集人数')
                    .setDescription('募集人数')
                    .setChoices(
                        { name: '@1', value: '1' },
                        { name: '@2', value: '2' },
                        { name: '@3', value: '3' },
                    )
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('内容または参加条件').setDescription('プレイ内容や参加条件など'),
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
            .setName('valo')
            .setDescription('Valorantの募集')
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('募集人数').setDescription('募集人数 (自由入力)').setRequired(true),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('内容または参加条件').setDescription('プレイ内容や参加条件など'),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('overwatch')
            .setDescription('Overwatchの募集')
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('募集人数').setDescription('募集人数 (自由入力)').setRequired(true),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('内容または参加条件').setDescription('プレイ内容や参加条件など'),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('other')
            .setDescription('その他別ゲーの募集')
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('ゲームタイトル')
                    .setDescription('ゲームタイトルを入力してください。')
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('募集人数').setDescription('募集人数 (自由入力)').setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('内容または参加条件').setDescription('プレイ内容や参加条件など'),
            ),
    )
    .setDMPermission(false);

export const otherGameCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: otherGame,
    execute: otherGameRecruit,
};
