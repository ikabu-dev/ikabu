import { SlashCommandBuilder, SlashCommandIntegerOption } from 'discord.js';

import { handleKansen } from '@/features/utils/other/kansen';

import type { GlobalChatInputCommand } from '@/registry/types';

const kansen = new SlashCommandBuilder()
    .setName('kansen')
    .setDescription('プラベの観戦する人をランダムな組み合わせで抽出します。')
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option
            .setName('回数')
            .setDescription('何回分の組み合わせを抽出するかを指定します。5回がおすすめ')
            .setRequired(true),
    );

export const kansenCommand: GlobalChatInputCommand = {
    kind: 'chatInput',
    guildOnly: false,
    definition: kansen,
    execute: handleKansen,
};
