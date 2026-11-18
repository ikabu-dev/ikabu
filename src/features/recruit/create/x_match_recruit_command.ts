import { ChannelType, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';

import { ChannelKeySet } from '@/config/constants/channel_key';
import { X_POWER_BANDS } from '@/config/constants/recruit';
import { xMatchRecruit } from '@/features/recruit/create/x_match_recruit';

import type { GuildChatInputCommand } from '@/shared/command_types';

function xMatchSubcommand(name: 'now' | 'next', description: string) {
    return new SlashCommandSubcommandBuilder()
        .setName(name)
        .setDescription(description)
        .addStringOption((option) =>
            option
                .setName('xp帯')
                .setDescription('遊ぶルールでのXパワー帯')
                .setRequired(true)
                .addChoices(...X_POWER_BANDS.map((band) => ({ name: band, value: band }))),
        )
        .addStringOption((option) =>
            option.setName('参加条件').setDescription('プレイ内容や参加条件など').setMaxLength(120),
        )
        .addChannelOption((option) =>
            option
                .setName('使用チャンネル')
                .setDescription('使用するボイスチャンネル')
                .addChannelTypes(ChannelType.GuildVoice),
        );
}

export const xMatchRecruitCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: new SlashCommandBuilder()
        .setName(ChannelKeySet.XMatchRecruit.name.toLowerCase())
        .setDescription('Xマッチの相方を1人募集します')
        .addSubcommand(xMatchSubcommand('now', '現在のXマッチの募集をたてます。'))
        .addSubcommand(xMatchSubcommand('next', '次のXマッチの募集をたてます。'))
        .setDMPermission(false),
    execute: xMatchRecruit,
};
