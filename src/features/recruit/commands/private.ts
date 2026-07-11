import {
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
} from 'discord.js';

import { privateRecruit } from '@/features/recruit/create/private_recruit';

import type { GuildChatInputCommand } from '@/registry/types';

const privateMatch = new SlashCommandBuilder()
    .setName('プラベ募集')
    .setDescription('プラベ募集コマンド')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('private')
            .setDescription(
                '開始時刻や人数などを細かく設定できます。通常はこちらを使ってください。',
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('開始時刻')
                    .setDescription('何時から始める？例: 21:00')
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('所要時間')
                    .setDescription('何時間ぐらいやる？例: 2時間')
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('募集人数').setDescription('募集人数 (自由入力)').setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('内容または参加条件').setDescription('プレイ内容や参加条件など'),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('ヘヤタテurl')
                    .setDescription('イカリング3のヘヤタテURLがある場合はこちらに入力してください'),
            ),
    )
    .setDMPermission(false);

export const privateRecruitCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: privateMatch,
    execute: privateRecruit,
};
