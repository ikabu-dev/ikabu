import {
    SlashCommandBuilder,
    SlashCommandIntegerOption,
    SlashCommandStringOption,
} from 'discord.js';

import { handlePick } from '@/features/pick/pick';

import type { GlobalChatInputCommand } from '@/shared/command_types';

const pick = new SlashCommandBuilder()
    .setName('pick')
    .setDescription('選択肢の中からランダムに抽出します。')
    .addStringOption((option: SlashCommandStringOption) =>
        option
            .setName('選択肢')
            .setDescription('半角スペースで区切って入力してください。')
            .setRequired(true),
    )
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option
            .setName('ピックする数')
            .setDescription('2つ以上ピックしたい場合は指定してください。')
            .setRequired(false),
    );

export const pickCommand: GlobalChatInputCommand = {
    kind: 'chatInput',
    guildOnly: false,
    definition: pick,
    execute: handlePick,
};
