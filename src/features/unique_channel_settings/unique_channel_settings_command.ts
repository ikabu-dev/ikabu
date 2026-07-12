import {
    SlashCommandBuilder,
    SlashCommandChannelOption,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
} from 'discord.js';

import { ChannelKeySet } from '@/config/constants/channel_key';
import { uniqueChannelSettingsHandler } from '@/features/unique_channel_settings/unique_channel_settings_handler';

import type { GuildChatInputCommand } from '@/shared/command_types';

function addUniqueChannelChoices(stringOption: SlashCommandStringOption) {
    for (const { name, key } of Object.values(ChannelKeySet)) {
        stringOption.addChoices({ name: name, value: key });
    }
    return stringOption;
}

const uniqueChannelSettings = new SlashCommandBuilder()
    .setName('固有チャンネル設定')
    .setDescription('固有チャンネルの設定ができます。')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('全設定表示')
            .setDescription('すべての固有チャンネルの設定を表示します。'),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('登録')
            .setDescription('固有チャンネルを設定します。')
            .addStringOption((option: SlashCommandStringOption) =>
                addUniqueChannelChoices(option)
                    .setName('設定項目')
                    .setDescription('設定する項目を選択してください。')
                    .setRequired(true),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('チャンネル')
                    .setDescription('設定するチャンネルを指定してください。')
                    .setRequired(true),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('解除')
            .setDescription('固有チャンネルの設定を解除します。')
            .addStringOption((option: SlashCommandStringOption) =>
                addUniqueChannelChoices(option)
                    .setName('設定項目')
                    .setDescription('設定を解除する項目を選択してください。')
                    .setRequired(true),
            ),
    )
    .setDMPermission(false);

export const uniqueChannelSettingsCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: uniqueChannelSettings,
    execute: uniqueChannelSettingsHandler,
};
