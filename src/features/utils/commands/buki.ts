import {
    SlashCommandBuilder,
    SlashCommandIntegerOption,
    SlashCommandStringOption,
} from 'discord.js';

import { handleBuki } from '@/features/utils/splat3/buki';

import type { GlobalChatInputCommand } from '@/registry/types';

const buki = new SlashCommandBuilder()
    .setName('buki')
    .setDescription('ブキをランダムに抽出します。')
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option
            .setName('ブキの数')
            .setDescription('指定するとn個のブキをランダムに選びます。')
            .setRequired(false),
    )
    .addStringOption((option: SlashCommandStringOption) =>
        option
            .setName('ブキ種')
            .setDescription('ブキ種を指定したい場合は指定できます。')
            .setChoices(
                { name: 'シューター', value: 'shooter' },
                { name: 'ブラスター', value: 'blaster' },
                { name: 'シェルター', value: 'brella' },
                { name: 'フデ', value: 'brush' },
                { name: 'チャージャー', value: 'charger' },
                { name: 'マニューバー', value: 'maneuver' },
                { name: 'リールガン', value: 'reelgun' },
                { name: 'ローラー', value: 'roller' },
                { name: 'スロッシャー', value: 'slosher' },
                { name: 'スピナー', value: 'splatling' },
                { name: 'ワイパー', value: 'wiper' },
                { name: 'ストリンガー', value: 'stringer' },
            )
            .setRequired(false),
    );

export const bukiCommand: GlobalChatInputCommand = {
    kind: 'chatInput',
    guildOnly: false,
    definition: buki,
    execute: handleBuki,
};
