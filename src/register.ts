import {
    ApplicationCommandType,
    ChannelType,
    ContextMenuCommandBuilder,
    PermissionFlagsBits,
    REST,
    Routes,
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

import { ChannelKeySet } from '@/config/constants/channel_key';
import { commandNames } from '@/config/constants/commands';
import { RoleKeySet } from '@/config/constants/role_key';
import { env } from '@/config/env';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { assertExistCheck } from '@/shared/assert';

import { shutdown } from './app/feat-admin/shutdown/command_builder.js';
import { uniqueRoleSettings } from './app/feat-admin/unique_role_settings/command_builder.js';

const voiceLock = new SlashCommandBuilder()
    .setName(commandNames.vclock)
    .setDescription('ボイスチャンネルに人数制限を設定します。')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('vclock')
            .setDescription('このボイスチャンネルに人数制限をかけます')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('人数')
                    .setDescription('制限人数を指定する場合は1～99で指定してください。')
                    .setRequired(false),
            ),
    )
    .setDMPermission(false);

const friendCode = new SlashCommandBuilder()
    .setName(commandNames.friend_code)
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

const wiki = new SlashCommandBuilder()
    .setName(commandNames.wiki)
    .setDescription('wikipediaで調べる')
    .addStringOption((option: SlashCommandStringOption) =>
        option.setName('キーワード').setDescription('調べたいキーワードを入力').setRequired(true),
    );

const kansen = new SlashCommandBuilder()
    .setName(commandNames.kansen)
    .setDescription('プラベの観戦する人をランダムな組み合わせで抽出します。')
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option
            .setName('回数')
            .setDescription('何回分の組み合わせを抽出するかを指定します。5回がおすすめ')
            .setRequired(true),
    );

const minutesTimer = new SlashCommandBuilder()
    .setName(commandNames.timer)
    .setDescription('分タイマー')
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option
            .setName('分')
            .setDescription('〇〇分後まで1分ごとにカウントダウンします。')
            .setRequired(true),
    );

const pick = new SlashCommandBuilder()
    .setName(commandNames.pick)
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

const vpick = new SlashCommandBuilder()
    .setName(commandNames.voice_pick)
    .setDMPermission(false)
    .setDescription('VCに接続しているメンバーからランダムに抽出します。')
    .addIntegerOption((option: SlashCommandIntegerOption) =>
        option
            .setName('ピックする人数')
            .setDescription('2人以上ピックしたい場合は指定してください。')
            .setRequired(false),
    );

const buki = new SlashCommandBuilder()
    .setName(commandNames.buki)
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

const show = new SlashCommandBuilder()
    .setName(commandNames.show)
    .setDescription('ステージ情報を表示')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('now').setDescription('現在のX,バンカラマッチのステージ情報を表示'),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('next').setDescription('次のX,バンカラマッチのステージ情報を表示'),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('nawabari').setDescription('現在のナワバリのステージ情報を表示'),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('run').setDescription('2つ先までのシフトを表示'),
    );

const help = new SlashCommandBuilder()
    .setName(commandNames.help)
    .setDescription('ヘルプを表示します。')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('recruit').setDescription('募集コマンドの使い方を表示'),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('voice').setDescription('読み上げ機能のヘルプを表示'),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('other').setDescription('募集コマンド以外の使い方を表示'),
    );

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

const experience = new SlashCommandBuilder()
    .setName(commandNames.experience)
    .setDescription('イカ部歴を表示します。')
    .setDMPermission(false);

const voice = new SlashCommandBuilder()
    .setName(commandNames.voice)
    .setDescription('テキストチャットの読み上げコマンド')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('join').setDescription('読み上げを開始'),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('type')
            .setDescription('読み上げボイスの種類を変更します。')
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('音声の種類')
                    .setDescription('声の種類を選択してください。')
                    .setChoices(
                        { name: 'ひかり（女性）', value: 'hikari' },
                        { name: 'はるか（女性）', value: 'haruka' },
                        { name: 'たける（男性）', value: 'takeru' },
                        { name: 'サンタ', value: 'santa' },
                        { name: '凶暴なクマ', value: 'bear' },
                        { name: 'ショウ（男性）', value: 'show' },
                    )
                    .setRequired(true),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('kill').setDescription('読み上げを終了'),
    )
    .setDMPermission(false);

const closeRecruit = new SlashCommandBuilder()
    .setName(commandNames.close)
    .setDescription('募集を〆ます。ボタンが使えないときに使ってください。')
    .setDMPermission(false);

const regularMatch = new SlashCommandBuilder()
    .setName(commandNames.regular)
    .setDescription('ナワバリ募集コマンド')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('now')
            .setDescription('現在のナワバリバトルの募集をたてます。')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('募集人数')
                    .setDescription(
                        '募集人数を設定します。あなたの他に参加者が決定している場合は参加者に指定してください。',
                    )
                    .setChoices(
                        { name: '@1', value: 1 },
                        { name: '@2', value: 2 },
                        { name: '@3', value: 3 },
                        { name: '@4', value: 4 },
                        { name: '@5', value: 5 },
                        { name: '@6', value: 6 },
                        { name: '@7', value: 7 },
                    )
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('参加条件')
                    .setDescription('プレイ内容や参加条件など')
                    .setRequired(false),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者1')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者2')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者3')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('next')
            .setDescription('次のナワバリバトルの募集をたてます。')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('募集人数')
                    .setDescription(
                        '募集人数を設定します。あなたの他に参加者が決定している場合は参加者に指定してください。',
                    )
                    .setChoices(
                        { name: '@1', value: 1 },
                        { name: '@2', value: 2 },
                        { name: '@3', value: 3 },
                        { name: '@4', value: 4 },
                        { name: '@5', value: 5 },
                        { name: '@6', value: 6 },
                        { name: '@7', value: 7 },
                    )
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('参加条件')
                    .setDescription('プレイ内容や参加条件など')
                    .setRequired(false),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者1')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者2')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者3')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            ),
    )
    .setDMPermission(false);

const eventMatch = new SlashCommandBuilder()
    .setName(commandNames.event)
    .setDescription('イベントマッチ募集コマンド')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('event')
            .setDescription('現在開催中のイベントマッチの募集をたてます。')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('募集人数')
                    .setDescription(
                        '募集人数を設定します。あなたの他に参加者が決定している場合は参加者に指定してください。',
                    )
                    .setChoices(
                        { name: '@1', value: 1 },
                        { name: '@2', value: 2 },
                        { name: '@3', value: 3 },
                    )
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('参加条件')
                    .setDescription('プレイ内容や参加条件など')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者1')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者2')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            ),
    )
    .setDMPermission(false);

const rankOption = new SlashCommandStringOption()
    .setName('募集ウデマエ')
    .setDescription('募集するウデマエを選択してください')
    .setChoices(
        { name: RoleKeySet.RankC.name, value: RoleKeySet.RankC.key },
        { name: RoleKeySet.RankB.name, value: RoleKeySet.RankB.key },
        { name: RoleKeySet.RankA.name, value: RoleKeySet.RankA.key },
        { name: RoleKeySet.RankS.name, value: RoleKeySet.RankS.key },
        { name: RoleKeySet.RankSP.name, value: RoleKeySet.RankSP.key },
    );

const anarchyMatch = new SlashCommandBuilder()
    .setName(commandNames.anarchy)
    .setDescription('バンカラマッチ募集コマンド')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('now')
            .setDescription('現在のバンカラマッチの募集をたてます。')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('募集人数')
                    .setDescription(
                        '募集人数を設定します。あなたの他に参加者が決定している場合は参加者に指定してください。',
                    )
                    .setChoices(
                        { name: '@1', value: 1 },
                        { name: '@2', value: 2 },
                        { name: '@3', value: 3 },
                    )
                    .setRequired(true),
            )
            .addStringOption(rankOption)
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('参加条件')
                    .setDescription('プレイ内容や参加条件など')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者1')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者2')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('next')
            .setDescription('次のバンカラマッチの募集をたてます。')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('募集人数')
                    .setDescription(
                        '募集人数を設定します。あなたの他に参加者が決定している場合は参加者に指定してください。',
                    )
                    .setChoices(
                        { name: '@1', value: 1 },
                        { name: '@2', value: 2 },
                        { name: '@3', value: 3 },
                    )
                    .setRequired(true),
            )
            .addStringOption(rankOption)
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('参加条件')
                    .setDescription('プレイ内容や参加条件など')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者1')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者2')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            ),
    )
    .setDMPermission(false);

const salmonRun = new SlashCommandBuilder()
    .setName(commandNames.salmon)
    .setDescription('サーモンラン募集コマンド')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('run')
            .setDescription('サーモンランの募集をたてます。')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('募集人数')
                    .setDescription(
                        '募集人数を設定します。あなたの他に参加者が決定している場合は参加者に指定してください。',
                    )
                    .setChoices(
                        { name: '@1', value: 1 },
                        { name: '@2', value: 2 },
                        { name: '@3', value: 3 },
                    )
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('参加条件')
                    .setDescription('プレイ内容や参加条件など')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者1')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者2')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('bigrun')
            .setDescription('ビッグランの募集をたてます。')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('募集人数')
                    .setDescription(
                        '募集人数を設定します。あなたの他に参加者が決定している場合は参加者に指定してください。',
                    )
                    .setChoices(
                        { name: '@1', value: 1 },
                        { name: '@2', value: 2 },
                        { name: '@3', value: 3 },
                    )
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('参加条件')
                    .setDescription('プレイ内容や参加条件など')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者1')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者2')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('contest')
            .setDescription('バイトチームコンテストの募集をたてます。')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('募集人数')
                    .setDescription(
                        '募集人数を設定します。あなたの他に参加者が決定している場合は参加者に指定してください。',
                    )
                    .setChoices(
                        { name: '@1', value: 1 },
                        { name: '@2', value: 2 },
                        { name: '@3', value: 3 },
                    )
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('参加条件')
                    .setDescription('プレイ内容や参加条件など')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者1')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者2')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            ),
    )
    .setDMPermission(false);

const raidersMatch = new SlashCommandBuilder()
    .setName(commandNames.raiders)
    .setDescription('スプラトゥーン レイダース募集コマンド')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('recruit')
            .setDescription('スプラトゥーン レイダースの募集をたてます。')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('募集人数')
                    .setDescription(
                        '募集人数を設定します。あなたの他に参加者が決定している場合は参加者に指定してください。',
                    )
                    .setChoices(
                        { name: '@1', value: 1 },
                        { name: '@2', value: 2 },
                        { name: '@3', value: 3 },
                    )
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('参加条件')
                    .setDescription('プレイ内容や参加条件など')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者1')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者2')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            ),
    )
    .setDMPermission(false);

const fesA = new SlashCommandBuilder()
    .setName(commandNames.fesA)
    .setDescription('フェス(フウカ陣営) 募集コマンド')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('now')
            .setDescription('現在のフェスマッチの募集をたてます。(フウカ陣営)')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('募集人数')
                    .setDescription(
                        '募集人数を設定します。あなたの他に参加者が決定している場合は参加者に指定してください。',
                    )
                    .setChoices(
                        { name: '@1', value: 1 },
                        { name: '@2', value: 2 },
                        { name: '@3', value: 3 },
                    )
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('参加条件')
                    .setDescription('プレイ内容や参加条件など')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者1')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者2')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('next')
            .setDescription('次のフェスマッチの募集をたてます。(フウカ陣営)')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('募集人数')
                    .setDescription(
                        '募集人数を設定します。あなたの他に参加者が決定している場合は参加者に指定してください。',
                    )
                    .setChoices(
                        { name: '@1', value: 1 },
                        { name: '@2', value: 2 },
                        { name: '@3', value: 3 },
                    )
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('参加条件')
                    .setDescription('プレイ内容や参加条件など')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者1')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者2')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            ),
    )
    .setDMPermission(false);

const fesB = new SlashCommandBuilder()
    .setName(commandNames.fesB)
    .setDescription('フェス(マンタロー陣営) 募集コマンド')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('now')
            .setDescription('現在のフェスマッチの募集をたてます。(マンタロー陣営)')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('募集人数')
                    .setDescription(
                        '募集人数を設定します。あなたの他に参加者が決定している場合は参加者に指定してください。',
                    )
                    .setChoices(
                        { name: '@1', value: 1 },
                        { name: '@2', value: 2 },
                        { name: '@3', value: 3 },
                    )
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('参加条件')
                    .setDescription('プレイ内容や参加条件など')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者1')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者2')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('next')
            .setDescription('次のフェスマッチの募集をたてます。(マンタロー陣営)')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('募集人数')
                    .setDescription(
                        '募集人数を設定します。あなたの他に参加者が決定している場合は参加者に指定してください。',
                    )
                    .setChoices(
                        { name: '@1', value: 1 },
                        { name: '@2', value: 2 },
                        { name: '@3', value: 3 },
                    )
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('参加条件')
                    .setDescription('プレイ内容や参加条件など')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者1')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者2')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            ),
    )
    .setDMPermission(false);

const fesC = new SlashCommandBuilder()
    .setName(commandNames.fesC)
    .setDescription('フェス(ウツホ陣営) 募集コマンド')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('now')
            .setDescription('現在のフェスマッチの募集をたてます。(ウツホ陣営)')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('募集人数')
                    .setDescription(
                        '募集人数を設定します。あなたの他に参加者が決定している場合は参加者に指定してください。',
                    )
                    .setChoices(
                        { name: '@1', value: 1 },
                        { name: '@2', value: 2 },
                        { name: '@3', value: 3 },
                    )
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('参加条件')
                    .setDescription('プレイ内容や参加条件など')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者1')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者2')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('next')
            .setDescription('次のフェスマッチの募集をたてます。(ウツホ陣営)')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('募集人数')
                    .setDescription(
                        '募集人数を設定します。あなたの他に参加者が決定している場合は参加者に指定してください。',
                    )
                    .setChoices(
                        { name: '@1', value: 1 },
                        { name: '@2', value: 2 },
                        { name: '@3', value: 3 },
                    )
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('参加条件')
                    .setDescription('プレイ内容や参加条件など')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者1')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addUserOption((option: SlashCommandUserOption) =>
                option
                    .setName('参加者2')
                    .setDescription('既に決定している参加者を指定してください。')
                    .setRequired(false),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            ),
    )
    .setDMPermission(false);

const privateMatch = new SlashCommandBuilder()
    .setName(commandNames.private)
    .setDescription('プラベ募集コマンド')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('private')
            .setDescription(
                '開始時刻や人数などを細かく設定できます。通常はこちらを使ってください。',
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('開始時刻')
                    .setDescription('何時から始める？例: 21:00')
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('所要時間')
                    .setDescription('何時間ぐらいやる？例: 2時間')
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('募集人数').setDescription('募集人数 (自由入力)').setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('内容または参加条件').setDescription('プレイ内容や参加条件など'),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('ヘヤタテurl')
                    .setDescription('イカリング3のヘヤタテURLがある場合はこちらに入力してください'),
            ),
    )
    .setDMPermission(false);

const otherGame = new SlashCommandBuilder()
    .setName(commandNames.other_game)
    .setDescription('スプラ以外のゲーム募集コマンド')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('apex')
            .setDescription('ApexLegendsの募集')
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('募集人数')
                    .setDescription('募集人数')
                    .setChoices(
                        { name: '@1', value: '1' },
                        { name: '@2', value: '2' },
                        { name: '@3', value: '3' },
                    )
                    .setRequired(true),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('内容または参加条件').setDescription('プレイ内容や参加条件など'),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('mhw')
            .setDescription('モンスターハンターワイルズの募集')
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('募集人数')
                    .setDescription('募集人数')
                    .setChoices(
                        { name: '@1', value: '1' },
                        { name: '@2', value: '2' },
                        { name: '@3', value: '3' },
                    )
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('内容または参加条件').setDescription('プレイ内容や参加条件など'),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('valo')
            .setDescription('Valorantの募集')
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('募集人数').setDescription('募集人数 (自由入力)').setRequired(true),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('内容または参加条件').setDescription('プレイ内容や参加条件など'),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('overwatch')
            .setDescription('Overwatchの募集')
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('募集人数').setDescription('募集人数 (自由入力)').setRequired(true),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('使用チャンネル')
                    .setDescription('使用するボイスチャンネルを指定できます。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('内容または参加条件').setDescription('プレイ内容や参加条件など'),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('other')
            .setDescription('その他別ゲーの募集')
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('ゲームタイトル')
                    .setDescription('ゲームタイトルを入力してください。')
                    .setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('募集人数').setDescription('募集人数 (自由入力)').setRequired(true),
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('内容または参加条件').setDescription('プレイ内容や参加条件など'),
            ),
    )
    .setDMPermission(false);

const buttonRecruit = new SlashCommandBuilder()
    .setName(commandNames.buttonRecruit)
    .setDescription('募集ボタンを使って募集を建てます。')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('button')
            .setDescription(
                '募集条件を通常のチャットで打ち込んだ後に通知と募集用のボタンを出せます。',
            )
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('募集人数')
                    .setDescription('募集人数を入力してください。')
                    .setRequired(false),
            ),
    )
    .setDMPermission(false);

const teamDivider = new SlashCommandBuilder()
    .setName(commandNames.team_divider)
    .setDescription('チーム分けを行います。')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('team')
            .setDescription('勝率に応じてチーム分けを行うことができます。')
            .addIntegerOption((option: SlashCommandIntegerOption) =>
                option
                    .setName('各チームのメンバー数')
                    .setDescription('それぞれのチームメンバー数(ex: スプラ=4, valo=5)')
                    .setRequired(true),
            )
            .addBooleanOption((option: SlashCommandBooleanOption) =>
                option
                    .setName('勝利数と勝率を隠す')
                    .setDescription('勝利数と勝率を隠すことができます。'),
            ),
    )
    .setDMPermission(false);

const buttonEnabler = new ContextMenuCommandBuilder()
    .setName(commandNames.buttonEnabler)
    .setType(ApplicationCommandType.Message)
    .setDMPermission(false);

const recruitEditor = new ContextMenuCommandBuilder()
    .setName(commandNames.recruitEditor)
    .setType(ApplicationCommandType.Message)
    .setDMPermission(false);

const voiceChannelMention = new SlashCommandBuilder()
    .setName(commandNames.voiceChannelMention)
    .setDescription('VCメンバー全員にメンションを送ります。')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('vcmention')
            .setDescription(
                'このチャンネルに、指定したVCにいるメンバー全員へのメンションを送ります。',
            )
            .addStringOption((option: SlashCommandStringOption) =>
                option
                    .setName('メッセージ')
                    .setDescription('メンションと一緒に送るメッセージを入力します。')
                    .setRequired(true),
            )
            .addChannelOption((option: SlashCommandChannelOption) =>
                option
                    .setName('チャンネル')
                    .setDescription('メンションを送りたいメンバーがいるVCを指定します。')
                    .addChannelTypes(ChannelType.GuildVoice)
                    .setRequired(false),
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

export const commandDefinitions = [
    shutdown,
    voiceLock,
    friendCode,
    wiki,
    kansen,
    teamDivider,
    minutesTimer,
    pick,
    vpick,
    buki,
    show,
    help,
    ban,
    chManager,
    experience,
    voice,
    closeRecruit,
    otherGame,
    buttonRecruit,
    privateMatch,
    regularMatch,
    eventMatch,
    anarchyMatch,
    salmonRun,
    raidersMatch,
    fesA,
    fesB,
    fesC,
    buttonEnabler,
    recruitEditor,
    voiceChannelMention,
    channelSettings,
    uniqueChannelSettings,
    uniqueRoleSettings,
    variablesSettings,
    joinedDateFixer,
    festivalSettings,
];

// 登録用関数
const rest = new REST({ version: '10' }).setToken(env.discordBotToken || '');
export async function registerSlashCommands() {
    const logger = log4js_obj.getLogger();
    const botId = env.discordBotId;
    const serverId = env.serverId;

    assertExistCheck(botId, 'DISCORD_BOT_ID');
    assertExistCheck(serverId, 'SERVER_ID');

    const mode = env.slashCommandRegisterMode;
    if (mode === 'guild') {
        await rest
            .put(Routes.applicationCommands(botId), { body: [] })
            .then(() => logger.info('Successfully deleted application global commands.'))
            .catch(async (error) => {
                await sendErrorLogs(logger, error);
            });
        await rest
            .put(Routes.applicationGuildCommands(botId, serverId), {
                body: commandDefinitions,
            })
            .then(() => logger.info('Successfully registered application guild commands.'))
            .catch(async (error) => {
                await sendErrorLogs(logger, error);
            });
    } else if (mode === 'global') {
        await rest
            .put(Routes.applicationGuildCommands(botId, serverId), { body: [] })
            .then(() => logger.info('Successfully deleted application guild commands.'))
            .catch(async (error) => {
                await sendErrorLogs(logger, error);
            });
        await rest
            .put(Routes.applicationCommands(botId), {
                body: commandDefinitions,
            })
            .then(() => logger.info('Successfully registered application global commands.'))
            .catch(async (error) => {
                await sendErrorLogs(logger, error);
            });
    }
}
