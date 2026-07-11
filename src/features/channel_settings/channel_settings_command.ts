import {
    SlashCommandBooleanOption,
    SlashCommandBuilder,
    SlashCommandChannelOption,
} from 'discord.js';

import { channelSettingsHandler } from '@/features/channel_settings/channel_settings_handler';

import type { GuildChatInputCommand } from '@/registry/types';

const channelSettings = new SlashCommandBuilder()
    .setName('チャンネル設定')
    .setDescription('各チャンネルの設定ができます。')
    .addBooleanOption((option: SlashCommandBooleanOption) =>
        option
            .setName('vctoolsを使用する')
            .setDescription('VCToolsを使用するかどうかを設定します。')
            .setRequired(false),
    )
    .addBooleanOption((option: SlashCommandBooleanOption) =>
        option
            .setName('管理者限定チャンネルとして設定する')
            .setDescription(
                '⚠このチャンネルで管理者限定コマンドを使用することができるようになります。',
            )
            .setRequired(false),
    )
    .addChannelOption((option: SlashCommandChannelOption) =>
        option
            .setName('チャンネル')
            .setDescription('⚠カテゴリを指定するとカテゴリ内のチャンネルが一括で変更されます。')
            .setRequired(false),
    );

export const channelSettingsCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: channelSettings,
    execute: channelSettingsHandler,
};
