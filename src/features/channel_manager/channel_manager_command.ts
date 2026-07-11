import {
    SlashCommandAttachmentOption,
    SlashCommandBuilder,
    SlashCommandMentionableOption,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
} from 'discord.js';

import { channelManagerHandler } from '@/features/channel_manager/channel_manager_handler';

import type { GuildChatInputCommand } from '@/registry/types';

const chManager = new SlashCommandBuilder()
    .setName('ch_management')
    .setDescription('チャンネルを作ったり削除したりできます。')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('チャンネル作成')
            .setDescription('チャンネル一括作成')
            .addAttachmentOption((option: SlashCommandAttachmentOption) =>
                option
                    .setName('csv')
                    .setDescription(
                        'CSV（ヘッダー有り）:catID,catName,chID,chName,chType,roleID,roleName,roleColor,member1,member2,member',
                    )
                    .setRequired(true),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('ロール作成')
            .setDescription('ロール作成')
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('ロール名')
                    .setDescription('ロール名を指定してください。')
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('ロールカラー')
                    .setDescription('カラーコードをhexで入力してください。')
                    .setRequired(false),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('ロール割当')
            .setDescription('ロール割当')
            .addMentionableOption((option: SlashCommandMentionableOption) =>
                option
                    .setName('ターゲットロール')
                    .setDescription('どのロールにつけますか？')
                    .setRequired(true),
            )
            .addMentionableOption((option: SlashCommandMentionableOption) =>
                option
                    .setName('割当ロール')
                    .setDescription('どのロールをつけますか？')
                    .setRequired(true),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('ロール解除')
            .setDescription('ロール解除')
            .addMentionableOption((option: SlashCommandMentionableOption) =>
                option
                    .setName('ターゲットロール')
                    .setDescription('どのロールから外しますか？')
                    .setRequired(true),
            )
            .addMentionableOption((option: SlashCommandMentionableOption) =>
                option
                    .setName('解除ロール')
                    .setDescription('どのロールを外しますか？')
                    .setRequired(true),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('ロール削除')
            .setDescription('ロール削除')
            .addMentionableOption((option: SlashCommandMentionableOption) =>
                option
                    .setName('ロール名1')
                    .setDescription('ロール名を指定してください。')
                    .setRequired(true),
            )
            .addMentionableOption((option: SlashCommandMentionableOption) =>
                option
                    .setName('ロール名2')
                    .setDescription('ロール名を指定してください。')
                    .setRequired(false),
            )
            .addMentionableOption((option: SlashCommandMentionableOption) =>
                option
                    .setName('ロール名3')
                    .setDescription('ロール名を指定してください。')
                    .setRequired(false),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('カテゴリー削除')
            .setDescription('カテゴリー削除')
            .addAttachmentOption((option: SlashCommandAttachmentOption) =>
                option.setName('csv').setDescription('csv').setRequired(false),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('カテゴリーid')
                    .setDescription('カテゴリーIDを半角スペース区切りで指定')
                    .setRequired(false),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('チャンネル削除')
            .setDescription('チャンネル削除')
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('チャンネルid')
                    .setDescription('チャンネルIDをを半角スペース区切りで指定')
                    .setRequired(true),
            ),
    )
    .setDMPermission(false);

export const channelManagerCommand: GuildChatInputCommand = {
    kind: 'chatInput',
    guildOnly: true,
    definition: chManager,
    execute: channelManagerHandler,
};
