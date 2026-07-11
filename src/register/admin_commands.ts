import {
    PermissionFlagsBits,
    SlashCommandAttachmentOption,
    SlashCommandBooleanOption,
    SlashCommandBuilder,
    SlashCommandChannelOption,
    SlashCommandIntegerOption,
    SlashCommandMentionableOption,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
    SlashCommandUserOption,
} from 'discord.js';

import { ChannelKeySet } from '../app/constant/channel_key.js';
import { shutdown } from '../app/feat-admin/shutdown/command_builder.js';
import { uniqueRoleSettings } from '../app/feat-admin/unique_role_settings/command_builder.js';
import { commandNames } from '../constant.js';

const ban = new SlashCommandBuilder()
    .setName(commandNames.ban)
    .setDMPermission(false)
    .setDescription('banします。')
    .addUserOption((option: SlashCommandUserOption) =>
        option.setName('ban対象').setDescription('banする人を指定してください。').setRequired(true),
    )
    .addStringOption((option: SlashCommandStringOption) =>
        option
            .setName('ban理由')
            .setDescription('ban対象の人にブキチがDMします。')
            .setRequired(true),
    );
const chManager = new SlashCommandBuilder()
    .setName(commandNames.ch_manager)
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

const channelSettings = new SlashCommandBuilder()
    .setName(commandNames.channelSetting)
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

function addUniqueChannelChoices(stringOption: SlashCommandStringOption) {
    for (const { name, key } of Object.values(ChannelKeySet)) {
        stringOption.addChoices({ name: name, value: key });
    }
    return stringOption;
}

const uniqueChannelSettings = new SlashCommandBuilder()
    .setName(commandNames.uniqueChannelSetting)
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

const variablesSettings = new SlashCommandBuilder()
    .setName(commandNames.variablesSettings)
    .setDescription('環境変数の設定・表示ができます。')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('表示').setDescription('環境変数ファイル(.env)の設定内容を表示します。'),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('登録更新')
            .setDescription('環境変数ファイル(.env)を上書きします。')
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('key').setDescription('変数名を入力').setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('value').setDescription('登録する値を入力').setRequired(true),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('削除')
            .setDescription('環境変数ファイル(.env)から変数を削除します。')
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('key').setDescription('変数名を入力').setRequired(true),
            ),
    )
    .setDMPermission(false);

const joinedDateFixer = new SlashCommandBuilder()
    .setName(commandNames.joinedDateFixer)
    .setDMPermission(false)
    .setDescription('入部日を修正します。(開発者限定コマンド)')
    .addUserOption((option: SlashCommandUserOption) =>
        option
            .setName('ユーザー')
            .setDescription('入部日を修正するユーザーを指定')
            .setRequired(true),
    )
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option.setName('年').setDescription('西暦で年を入力').setRequired(true),
    )
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option.setName('月').setDescription('月を入力').setRequired(true),
    )
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option.setName('日').setDescription('日を入力').setRequired(true),
    )
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option.setName('時').setDescription('24h表記で時間を入力').setRequired(true),
    )
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option.setName('分').setDescription('分を入力').setRequired(true),
    )
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option.setName('秒').setDescription('秒を入力').setRequired(false),
    )
    .addBooleanOption((option: SlashCommandBooleanOption) =>
        option
            .setName('強制設定')
            .setDescription('入部日を強制的に設定します。【後の日付でも設定可能】')
            .setRequired(false),
    );

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
    .setName(commandNames.festivalSettings)
    .setDescription('フェスカテゴリの表示設定を行います。')
    .addSubcommand(festStart)
    .addSubcommand(festEnd)
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export const shutdownCommandDefinitions = [shutdown];
export const adminEarlyCommandDefinitions = [ban, chManager];
export const adminLateCommandDefinitions = [
    channelSettings,
    uniqueChannelSettings,
    uniqueRoleSettings,
    variablesSettings,
    joinedDateFixer,
    festivalSettings,
];
