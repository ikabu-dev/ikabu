import {
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
} from 'discord.js';

import { handleFriendCode } from '@/features/friend_code/friendcode';

import type { GlobalChatInputCommand } from '@/shared/command_types';

const friendCode = new SlashCommandBuilder()
    .setName('friend_code')
    .setDescription('フレンドコードの登録・表示')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('add')
            .setDescription('フレンドコードを登録します。')
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('フレンドコード')
                    .setDescription('例：SW-0000-0000-0000')
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('フレンドコードurl')
                    .setDescription('Nintendo Switch OnlineのフレンドコードURLを登録できます。'),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('show')
            .setDescription(
                '登録したフレンドコードを表示します。未登録の場合は自己紹介から引用します。',
            ),
    );

export const friendCodeCommand: GlobalChatInputCommand = {
    kind: 'chatInput',
    guildOnly: false,
    definition: friendCode,
    execute: handleFriendCode,
};
