import {
    ChannelType,
    SlashCommandBuilder,
    SlashCommandChannelOption,
    SlashCommandIntegerOption,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
    SlashCommandUserOption,
} from 'discord.js';

import { RoleKeySet } from '../app/constant/role_key.js';
import { commandNames } from '../constant.js';
import { buttonEnabler, recruitEditor } from './util_commands.js';

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

export const recruitCommandDefinitions = [
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
];
