import { GuildScheduledEventStatus, VoiceState } from 'discord.js';

import { exists, notExists } from '@/app/common/others';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { RecruitService } from '@/db/recruit_service';
import { log4js_obj } from '@/log4js_settings';

const logger = log4js_obj.getLogger('voiceStateUpdate');

export async function endEventOnRecruiterLeave(voiceState: VoiceState) {
    try {
        const guild = voiceState.guild;
        const voiceChannel = voiceState.channel;
        if (notExists(voiceChannel) || !voiceChannel.isVoiceBased()) return;
        const guildEvents = await guild.scheduledEvents.fetch();
        const event = guildEvents.find(
            (event) =>
                exists(event.channel) &&
                event.channel.id === voiceChannel.id &&
                event.status === GuildScheduledEventStatus.Active,
        );

        if (notExists(event)) return;

        const recruitData = await RecruitService.getRecruitByEventId(guild.id, event.id);

        if (notExists(recruitData)) return;

        // 募集主がボイスチャンネルから抜けたときにイベントを終了する
        if (exists(voiceState.member) && voiceState.member.id === recruitData.authorId) {
            if (!voiceChannel.members.has(recruitData.authorId)) {
                await event.setStatus(GuildScheduledEventStatus.Completed);
                logger.info(`Event[${event.id}] set "Completed".`);
            }
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
