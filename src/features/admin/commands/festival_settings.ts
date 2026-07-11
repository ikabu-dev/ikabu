import {
    PermissionFlagsBits,
    SlashCommandBooleanOption,
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
} from 'discord.js';

import { festSettingHandler } from '@/features/admin/fest_setting/fest_settings';

import type { GuildChatInputCommand } from '@/registry/types';

const festStart = new SlashCommandSubcommandBuilder()
    .setName('開始')
    .setDescription('フェスカテゴリのチャンネルを表示します。');

const festEnd = new SlashCommandSubcommandBuilder()
    .setName('終了')
    .setDescription('フェスカテゴリのチャンネルを非表示にします。')
    .addBooleanOption((option: SlashCommandBooleanOption) =>
        option
            .setName('フェスロールを外す')
            .setDescription('フェスロールを全部員から剥奪します。')
            .setRequired(false),
    );

const festivalSettings = new SlashCommandBuilder()
    .setName('フェスカテゴリ設定')
    .setDescription('フェスカテゴリの表示設定を行います。')
    .addSubcommand(festStart)
    .addSubcommand(festEnd)
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export const festivalSettingsCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: festivalSettings,
    execute: festSettingHandler,
};
