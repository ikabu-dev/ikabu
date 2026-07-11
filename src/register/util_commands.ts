import {
    ApplicationCommandType,
    ContextMenuCommandBuilder,
    SlashCommandBooleanOption,
    SlashCommandBuilder,
    SlashCommandIntegerOption,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
} from 'discord.js';

import { commandNames } from '../constant.js';

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

export const vpick = new SlashCommandBuilder()
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

const experience = new SlashCommandBuilder()
    .setName(commandNames.experience)
    .setDescription('イカ部歴を表示します。')
    .setDMPermission(false);

export const voice = new SlashCommandBuilder()
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

export const buttonEnabler = new ContextMenuCommandBuilder()
    .setName(commandNames.buttonEnabler)
    .setType(ApplicationCommandType.Message)
    .setDMPermission(false);

export const recruitEditor = new ContextMenuCommandBuilder()
    .setName(commandNames.recruitEditor)
    .setType(ApplicationCommandType.Message)
    .setDMPermission(false);

export const utilEarlyCommandDefinitions = [
    friendCode,
    wiki,
    kansen,
    minutesTimer,
    pick,
    buki,
    show,
    help,
];
export const experienceCommandDefinitions = [experience];
export const teamDividerCommandDefinitions = [teamDivider];
