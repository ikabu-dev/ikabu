import { CronJob } from 'cron';
import {
    ActionRowBuilder,
    Base64Resolvable,
    BufferResolvable,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    Guild,
    GuildScheduledEvent,
    GuildScheduledEventCreateOptions,
    GuildScheduledEventEntityType,
    GuildScheduledEventPrivacyLevel,
    GuildScheduledEventStatus,
    Message,
    MessageFlags,
    TimestampStyles,
    VoiceBasedChannel,
    time,
} from 'discord.js';

import { RecruitParam } from '@/config/constants/button_id';
import { ErrorTexts } from '@/config/constants/error_texts';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { exists, notExists } from '@/shared/assert';
import { recoveryThinkingButton } from '@/shared/discord_helpers/button_components';
import { sleep } from '@/shared/sleep';
const logger = log4js_obj.getLogger();

const activeJobs: Map<string, CronJob> = new Map();

export async function createRecruitEvent(
    guild: Guild,
    title: string,
    recruiterId: string,
    voiceChannel: VoiceBasedChannel,
    imageBuffer: BufferResolvable | Base64Resolvable,
    startTime: Date,
    endTime?: Date,
) {
    const tenSecondsLater = new Date(new Date().getTime() + 10 * 1000);
    const fiveMinutesBeforeStart = new Date(startTime.getTime() - 5 * 60 * 1000);
    const scheduledStartTime =
        tenSecondsLater < fiveMinutesBeforeStart ? fiveMinutesBeforeStart : tenSecondsLater;

    const options: GuildScheduledEventCreateOptions = {
        name: title,
        channel: voiceChannel,
        entityType: GuildScheduledEventEntityType.Voice,
        image: imageBuffer,
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        scheduledStartTime: scheduledStartTime,
        scheduledEndTime: endTime,
    };
    const event = await guild.scheduledEvents.create(options);

    const embed = new EmbedBuilder();
    embed.setTitle(title);
    embed.setDescription(
        `このボイスチャンネルを${time(
            startTime,
            TimestampStyles.RelativeTime,
        )}から上記利用のために予約したでし！`,
    );

    const reserveMessage = await voiceChannel.send({
        content: `[★イベント内容★](${event.url})`,
        embeds: [embed],
        components: [unlockChannelButton(recruiterId, event.id)],
    });

    const eventJob = new CronJob(
        scheduledStartTime,
        async () => {
            await event.setStatus(GuildScheduledEventStatus.Active);
            logger.info(`Event[${event.id}] set "Active".`);

            if (exists(endTime)) {
                // 終了時刻が指定されているばあい秒数差分を計算してイベント終了処理を行う
                const secDiff = Math.floor((endTime.getTime() - new Date().getTime()) / 1000);
                await sleep(secDiff);

                try {
                    await endRecruitEvent(reserveMessage, event.id);
                } catch (error) {
                    if (!(error instanceof RecruitEventError)) {
                        throw error;
                    }
                }
            }
        },
        null,
        true,
        'Asia/Tokyo',
    );

    eventJob.start();
    activeJobs.set(event.id, eventJob);
    return event;
}

export async function cancelRecruitEvent(guild: Guild, eventId: string) {
    const eventJob = activeJobs.get(eventId);
    if (exists(eventJob)) {
        eventJob.stop();
        activeJobs.delete(eventId);
    } else {
        logger.info(`Event[${eventId}] not found.`);
        return;
    }

    const event = await guild.scheduledEvents.fetch(eventId);

    if (exists(event)) {
        await event.delete();
        logger.info(`Event[${event.id}] has been deleted.`);

        const embed = new EmbedBuilder();
        embed.setTitle(event.name);
        embed.setDescription(`このボイスチャンネルの上記予定はキャンセルされたでし！`);
        await event.channel?.send({ embeds: [embed] });
    }
}

export class RecruitEventError extends Error {
    private errorMessage: string | undefined;
    constructor(errorMessage?: string) {
        super();
        this.errorMessage = errorMessage;
    }

    public getErrorMessage() {
        return this.errorMessage ?? ErrorTexts.UndefinedError;
    }
}

async function endRecruitEvent(reserveMessage: Message<true>, eventId: string, userId?: string) {
    const reserveEmbed = reserveMessage.embeds[0];
    const embed = new EmbedBuilder();
    embed.setTitle(reserveEmbed.title);
    embed.setDescription(`このボイスチャンネルの予定は終了したでし！`);
    let event: GuildScheduledEvent;
    try {
        event = await reserveMessage.guild.scheduledEvents.fetch(eventId);
    } catch {
        logger.warn(`Event[${eventId}] is not found.`);

        await reserveMessage.edit({
            content: '',
            embeds: [embed],
            components: [],
        });
        throw new RecruitEventError('イベントが見つからないでし！');
    }

    if (event.status === GuildScheduledEventStatus.Active) {
        await event.setStatus(GuildScheduledEventStatus.Completed);
        if (exists(userId)) {
            logger.info(`Event[${event.id}] has been completed by ${userId}.`);
        } else {
            logger.info(`Event[${event.id}] set "Completed".`);
        }
        await reserveMessage.edit({
            embeds: [],
            components: [],
        });
    } else {
        await event.delete();
        if (exists(userId)) {
            logger.info(`Event[${event.id}] has been deleted by ${userId}.`);
        } else {
            logger.info(`Event[${event.id}] has been deleted.`);
        }
        await reserveMessage.edit({
            content: '',
            embeds: [embed],
            components: [],
        });
    }

    const eventJob = activeJobs.get(eventId);
    if (exists(eventJob)) {
        eventJob.stop();
        activeJobs.delete(eventId);
    }
}

export async function endRecruitEventButton(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    if (!interaction.message.inGuild()) return;
    try {
        const eventId = params.get('eid');
        const recruiterId = params.get('uid');
        const userId = interaction.member.user.id;

        if (userId !== recruiterId) {
            await interaction.followUp({
                content: '募集者以外はイベントを終了できないでし！',
                flags: MessageFlags.Ephemeral,
            });
            return await interaction.editReply({
                components: recoveryThinkingButton(interaction, 'イベント終了'),
            });
        }

        if (notExists(eventId)) {
            await interaction.followUp({
                content: 'イベントが見つからないでし！',
                flags: MessageFlags.Ephemeral,
            });

            return await interaction.message.delete();
        }

        try {
            await endRecruitEvent(interaction.message, eventId);
        } catch (error) {
            if (error instanceof RecruitEventError) {
                await interaction.followUp({
                    content: error.getErrorMessage(),
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                throw error;
            }
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}

function unlockChannelButton(recruiterId: string, eventId: string) {
    const buttonParams = new URLSearchParams();
    buttonParams.append('d', RecruitParam.EndEvent);
    buttonParams.append('uid', recruiterId);
    buttonParams.append('eid', eventId);

    const button = new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
            .setCustomId(buttonParams.toString())
            .setLabel('イベント終了')
            .setStyle(ButtonStyle.Danger),
    ]);
    return button;
}
