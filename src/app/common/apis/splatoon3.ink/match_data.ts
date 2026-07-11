import { isDateWithinRange } from '@/app/common/datetime';
import { assertExistCheck, exists, notExists } from '@/app/common/others';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { log4js_obj } from '@/log4js_settings';

import { getLocale, inFallbackMode } from './schedule_fetcher';
import {
    checkFes,
    getAnarchyList,
    getBigRunList,
    getEventList,
    getFesList,
    getRegularList,
    getSalmonList,
    getTeamContestList,
    getXMatchList,
} from './schedule_lists';
import { event2txt, rule2txt, stage2txt } from './text_converters';
import { Sp3Schedule } from './types/schedule';

const logger = log4js_obj.getLogger();

export type MatchInfo = {
    startTime: Date;
    endTime: Date;
    rule?: string;
    stage1?: string;
    stage2?: string;
    stageImage1?: string;
    stageImage2?: string;
};

export type EventMatchInfo = Required<MatchInfo> & {
    title: string;
    description: string;
    regulation: string;
};

export type SalmonInfo = {
    startTime: Date;
    endTime: Date;
    stage: string;
    weapon1: string;
    weapon2: string;
    weapon3: string;
    weapon4: string;
    stageImage: string;
};

type VsSetting = {
    vsRule: { id: string; name: string };
    vsStages: [
        { id: string; name: string; image: { url: string } },
        { id: string; name: string; image: { url: string } },
    ];
};
type TimedNode = { startTime: string; endTime: string };
type CoopSetting = {
    coopStage: { id: string; name: string; thumbnailImage: { url: string } };
    weapons: [
        { image: { url: string } },
        { image: { url: string } },
        { image: { url: string } },
        { image: { url: string } },
    ];
};

async function getMatchData<T extends TimedNode>(
    list: T[],
    num: number,
    getSetting: (node: T) => VsSetting | null,
    canPopulate: () => boolean | undefined,
): Promise<MatchInfo | null> {
    try {
        if (list.length - 1 < num) return null;
        const result: MatchInfo = {
            startTime: new Date(list[num].startTime),
            endTime: new Date(list[num].endTime),
        };
        const setting = getSetting(list[num]);
        const locale = await getLocale();
        if (canPopulate() && exists(setting) && !inFallbackMode) {
            result.rule = exists(locale)
                ? await rule2txt(locale, setting.vsRule.id)
                : setting.vsRule.name;
            result.stage1 = exists(locale)
                ? await stage2txt(locale, setting.vsStages[0].id)
                : setting.vsStages[0].name;
            result.stage2 = exists(locale)
                ? await stage2txt(locale, setting.vsStages[1].id)
                : setting.vsStages[1].name;
            result.stageImage1 = setting.vsStages[0].image.url;
            result.stageImage2 = setting.vsStages[1].image.url;
        }
        return result;
    } catch (error) {
        await sendErrorLogs(logger, error);
        return null;
    }
}

export const getRegularData = (schedule: Sp3Schedule, num: number) =>
    getMatchData(
        getRegularList(schedule),
        num,
        (node) => node.regularMatchSetting,
        () => !checkFes(schedule, num),
    );
export const getAnarchyChallengeData = (schedule: Sp3Schedule, num: number) =>
    getMatchData(
        getAnarchyList(schedule),
        num,
        (node) => node.bankaraMatchSettings?.[0] ?? null,
        () => !checkFes(schedule, num),
    );
export const getAnarchyOpenData = (schedule: Sp3Schedule, num: number) =>
    getMatchData(
        getAnarchyList(schedule),
        num,
        (node) => node.bankaraMatchSettings?.[1] ?? null,
        () => !checkFes(schedule, num),
    );
export const getXMatchData = (schedule: Sp3Schedule, num: number) =>
    getMatchData(
        getXMatchList(schedule),
        num,
        (node) => node.xMatchSetting,
        () => !checkFes(schedule, num),
    );
export const getFesChallengeData = (schedule: Sp3Schedule, num: number) =>
    getMatchData(
        getFesList(schedule),
        num,
        (node) => node.festMatchSettings?.[1] ?? null,
        () => checkFes(schedule, num),
    );
export const getFesRegularData = (schedule: Sp3Schedule, num: number) =>
    getMatchData(
        getFesList(schedule),
        num,
        (node) => node.festMatchSettings?.[1] ?? null,
        () => checkFes(schedule, num),
    );

async function getSalmonDataFromList<T extends TimedNode>(
    list: T[],
    num: number,
    getSetting: (node: T) => CoopSetting,
): Promise<SalmonInfo | null> {
    try {
        const setting = getSetting(list[num]);
        const locale = await getLocale();
        return {
            startTime: new Date(list[num].startTime),
            endTime: new Date(list[num].endTime),
            stage: exists(locale)
                ? await stage2txt(locale, setting.coopStage.id)
                : setting.coopStage.name,
            weapon1: setting.weapons[0].image.url,
            weapon2: setting.weapons[1].image.url,
            weapon3: setting.weapons[2].image.url,
            weapon4: setting.weapons[3].image.url,
            stageImage: setting.coopStage.thumbnailImage.url,
        };
    } catch (error) {
        await sendErrorLogs(logger, error);
        return null;
    }
}

export const getSalmonData = (schedule: Sp3Schedule, num: number) =>
    getSalmonDataFromList(getSalmonList(schedule), num, (node) => node.setting);
export const getBigRunData = (schedule: Sp3Schedule, num: number) =>
    getSalmonDataFromList(getBigRunList(schedule), num, (node) => node.setting);
export const getTeamContestData = (schedule: Sp3Schedule, num: number) =>
    getSalmonDataFromList(getTeamContestList(schedule), num, (node) => node.setting);

export async function getEventData(schedule: Sp3Schedule): Promise<EventMatchInfo | null> {
    try {
        let targetEvent = null;
        let startTime = null;
        let endTime = null;
        for (const event of getEventList(schedule)) {
            for (const timePeriod of event.timePeriods) {
                if (
                    isDateWithinRange(
                        new Date(),
                        new Date(timePeriod.startTime),
                        new Date(timePeriod.endTime),
                    )
                ) {
                    targetEvent = event;
                    startTime = new Date(timePeriod.startTime);
                    endTime = new Date(timePeriod.endTime);
                }
            }
        }
        if (notExists(targetEvent)) return null;
        assertExistCheck(startTime, 'eventMatchStartTime');
        assertExistCheck(endTime, 'eventMatchEndTime');
        const setting = targetEvent.leagueMatchSetting;
        const locale = await getLocale();
        const texts = exists(locale)
            ? await event2txt(locale, setting.leagueMatchEvent.id)
            : {
                  title: setting.leagueMatchEvent.name,
                  description: setting.leagueMatchEvent.desc,
                  regulation: setting.leagueMatchEvent.regulation,
              };
        return {
            ...texts,
            startTime,
            endTime,
            rule: exists(locale) ? await rule2txt(locale, setting.vsRule.id) : setting.vsRule.name,
            stage1: exists(locale)
                ? await stage2txt(locale, setting.vsStages[0].id)
                : setting.vsStages[0].name,
            stage2: exists(locale)
                ? await stage2txt(locale, setting.vsStages[1].id)
                : setting.vsStages[1].name,
            stageImage1: setting.vsStages[0].image.url,
            stageImage2: setting.vsStages[1].image.url,
        };
    } catch (error) {
        await sendErrorLogs(logger, error);
        return null;
    }
}
