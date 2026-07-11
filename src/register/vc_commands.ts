import {
    ChannelType,
    SlashCommandBuilder,
    SlashCommandChannelOption,
    SlashCommandIntegerOption,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
} from 'discord.js';

import { commandNames } from '../constant.js';
import { voice, vpick } from './util_commands.js';

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

export const voiceLockCommandDefinitions = [voiceLock];
export const voicePickCommandDefinitions = [vpick];
export const voiceCommandDefinitions = [voice];
export const voiceChannelMentionCommandDefinitions = [voiceChannelMention];
