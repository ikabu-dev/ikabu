import {
    joinVoiceChannel,
    entersState,
    createAudioResource,
    StreamType,
    createAudioPlayer,
    AudioPlayerStatus,
    generateDependencyReport,
    AudioResource,
    AudioPlayer,
    VoiceConnection,
} from '@discordjs/voice';
import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    Message,
    MessageFlags,
    VoiceState,
} from 'discord.js';

import { searchAPIMemberById } from '@/app/common/manager/member_manager';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { log4js_obj } from '@/log4js_settings';
import { exists, notExists } from '@/shared/assert';
import { getDeveloperMention } from '@/shared/discord_helpers/developer_mention';
import { isEmpty } from '@/shared/string';

import { modeApi, bufferToStream, setting } from './voice_bot_node';

const infoLogger = log4js_obj.getLogger('info');
const interactionLogger = log4js_obj.getLogger('interaction');
const logger = log4js_obj.getLogger('voice');

infoLogger.info(generateDependencyReport());

// ボイスチャットセッション保存用のMapです。
const subscriptions = new Map<string, Subscription>();

type Subscription = {
    connection: VoiceConnection;
    player: AudioPlayer;
};

// 読み上げ対象のDicordチャンネル保存用のMapです。
const channels = new Map();

export const joinTTS = async (
    interaction: ChatInputCommandInteraction<'cached'> | ButtonInteraction<'cached' | 'raw'>,
) => {
    try {
        if (!interaction.inCachedGuild()) return;
        const guildId = interaction.guildId;
        const channelId = interaction.channelId;
        const member = await searchAPIMemberById(interaction.guild, interaction.member.user.id);

        if (notExists(interaction.channel) || !interaction.channel.isVoiceBased()) return;

        let subscription = subscriptions.get(guildId);
        if (!subscription) {
            if (notExists(member)) {
                return await interaction.channel.send(
                    (await getDeveloperMention(guildId)) + 'メンバー情報が取得できなかったでし！',
                );
            }
            if (!member.voice.channelId) {
                // メンバーがVCにいるかチェック
                return await interaction.editReply('ボイチャに参加してからコマンドを使うでし！');
            }
            const connection = joinVoiceChannel({
                selfMute: false,
                channelId: member.voice.channelId, // メンバーが居るVCのチャンネル
                guildId: guildId,
                adapterCreator: member.voice.guild.voiceAdapterCreator,
            });
            messageQueue.length = 0; // キューリセット
            isPlaying = false; // 再生中フラグをリセット
            subscription = connection.subscribe(createAudioPlayer());
            connection.on('error', (error) => {
                logger.warn(error);
            });
            if (notExists(subscription)) return;
            subscriptions.set(guildId, subscription);
            channels.set(guildId, channelId);
            await interaction.channel.send(
                'ボイスチャンネルに接続したでし！`/help voice`で使い方を説明するでし！',
            );
            await interaction.deleteReply();
        } else if (channels.get(guildId) === channelId) {
            await interaction.editReply('既に接続済みでし！');
        } else {
            await interaction.editReply('他の部屋で営業中でし！');
        }
    } catch (error) {
        await killTTS(interaction);
        await sendErrorLogs(interactionLogger, error);
    }
};

export const killTTS = async (
    interaction: ChatInputCommandInteraction<'cached'> | ButtonInteraction<'cached' | 'raw'>,
) => {
    try {
        const guildId = interaction.guildId;
        const channelId = interaction.channelId;
        const subscription = subscriptions.get(guildId);

        if (notExists(interaction.channel) || !interaction.channel.isVoiceBased()) return;

        if (subscription && channels.get(guildId) === channelId) {
            subscription.player.stop(); // 読み上げを停止
            subscriptions.delete(guildId);
            channels.delete(guildId);
            messageQueue.length = 0; // キューリセット
            // 状態遷移が完了するまで待つ
            await entersState(
                subscription.player,
                AudioPlayerStatus.Idle,
                new AbortController().signal,
            );
            subscription.connection.destroy();

            isPlaying = false; // 再生中フラグをリセット
            await interaction.channel.send(':dash:');
            await interaction.deleteReply();
        } else if (channels.get(guildId) != channelId) {
            await interaction.editReply('他の部屋で営業中でし！');
        }
    } catch (error) {
        await sendErrorLogs(interactionLogger, error);
    }
};

export async function autokill(oldState: VoiceState) {
    if (notExists(oldState.channel)) return;
    const guildId = oldState.guild.id;
    const channelId = oldState.channel.id;
    const oldChannel = await oldState.guild.channels.fetch(oldState.channel.id);
    const subscription = subscriptions.get(guildId);
    if (exists(subscription) && channels.get(guildId) === channelId && exists(oldChannel)) {
        if (oldChannel.isVoiceBased() && oldChannel.members.size != 1) {
            return;
        }
        subscription.player.stop(); // 読み上げを停止
        subscriptions.delete(guildId);
        channels.delete(guildId);
        messageQueue.length = 0; // キューリセット
        // 状態遷移が完了するまで待つ
        await entersState(
            subscription.player,
            AudioPlayerStatus.Idle,
            new AbortController().signal,
        );
        subscription.connection.destroy();

        isPlaying = false; // 再生中フラグをリセット

        await oldState.channel.send(':dash:');
    }
}

export async function handleTTSCommand(interaction: ChatInputCommandInteraction<'cached'>) {
    try {
        // 'インタラクションに失敗'が出ないようにするため
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const subCommand = interaction.options.getSubcommand();

        switch (subCommand) {
            case 'join':
                await joinTTS(interaction);
                break;
            case 'kill':
                await killTTS(interaction);
                break;
            case 'type':
                await setting(interaction);
                break;
        }
    } catch (error) {
        await sendErrorLogs(interactionLogger, error);
    }
}

const messageQueue: Message<true>[] = []; // メッセージキュー
let isPlaying = false; // 現在再生中かどうかを示すフラグ

export async function play(msg: Message<true>) {
    const { guildId, channelId, content } = msg;

    if (content.startsWith('!') || content.startsWith('！') || isEmpty(content)) return;

    const subscription = subscriptions.get(guildId);
    if (exists(subscription) && channels.get(guildId) === channelId) {
        // 「でし！」で読み上げリセット
        if (content === 'でし！') {
            const author = await searchAPIMemberById(msg.guild, msg.author.id);
            if (notExists(author) || author.voice.channelId !== channelId) return;

            // キューをクリア
            messageQueue.length = 0;

            // 読み上げを停止
            subscription.player.stop();

            // 再生中フラグをリセット
            isPlaying = false;
        }

        messageQueue.push(msg); // メッセージをキューに追加
        await playNextMessage(); // 次のメッセージを再生
    }
}

async function playNextMessage() {
    if (messageQueue.length === 0 || isPlaying) {
        return;
    }

    // 再生中フラグをセット
    isPlaying = true;

    const nextMsg = messageQueue.shift(); // キューから次のメッセージを取得
    if (!nextMsg) {
        isPlaying = false;
        return;
    }

    const subscription = subscriptions.get(nextMsg.guildId);
    if (notExists(subscription) || channels.get(nextMsg.guildId) !== nextMsg.channelId) {
        return;
    }

    const buffer = await modeApi(nextMsg);
    if (notExists(buffer)) return;
    const stream = bufferToStream(buffer);

    const resource: AudioResource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
    });
    subscription.player.play(resource);

    // 再生が完了するまで待つ
    await entersState(subscription.player, AudioPlayerStatus.Idle, 1000 * 60);

    // 再生が終わったのでフラグをリセット
    isPlaying = false;

    // 次のメッセージを再生
    await playNextMessage();
}
