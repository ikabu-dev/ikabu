import { Guild } from 'discord.js';

import {
    getSchedule,
    getEventList,
    getLocale,
    event2txt,
} from '@/infra/external/splatoon3-ink/splatoon3_ink';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { exists, notExists } from '@/shared/assert';
import { formatDatetime, dateformat } from '@/shared/datetime/convert_datetime';
import {
    createGuildScheduledEvent,
    existsGuildScheduledEvent,
} from '@/shared/discord_helpers/guild_scheduled_event_manager';

const logger = log4js_obj.getLogger('recruit');

export async function subscribeSplatEventMatch(guild: Guild) {
    // splatoon3.inkからイベントを取得して現在登録中のギルドイベントになければイベントを作成する
    const schedule = await getSchedule();

    if (notExists(schedule)) {
        await sendErrorLogs(logger, 'schedule is not exists!');
        return;
    }
    const eventList = getEventList(schedule);
    const locale = await getLocale();

    eventList.forEach(async (event) => {
        let eventTexts = {
            title: event.leagueMatchSetting.leagueMatchEvent.name,
            description: event.leagueMatchSetting.leagueMatchEvent.desc,
            regulation: event.leagueMatchSetting.leagueMatchEvent.regulation,
        };
        if (exists(locale)) {
            eventTexts = await event2txt(locale, event.leagueMatchSetting.leagueMatchEvent.id);
        }

        const name = eventTexts.title;
        const description = eventTexts.regulation.replaceAll('<br />', '\n');
        const timePeriods = event.timePeriods;
        // スケジュールごとにイベントを作成する
        timePeriods.forEach(async (timePeriod) => {
            const startTime = new Date(timePeriod.startTime);
            const endTime = new Date(timePeriod.endTime);
            // startTimeが過去のものは作成しない
            if (startTime < new Date()) {
                return;
            }
            const eventNameWithTime = `${name} ${formatDatetime(startTime, dateformat.ymdwhm)}`;
            if (!existsGuildScheduledEvent(guild, eventNameWithTime)) {
                await createGuildScheduledEvent(
                    guild,
                    startTime,
                    endTime,
                    eventNameWithTime,
                    description,
                );
            }
        });
    });
}
