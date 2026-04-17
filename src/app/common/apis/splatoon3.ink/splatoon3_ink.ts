import NodeCache from 'node-cache';
import fetch from 'node-fetch';

import { shouldNotifyFetchError } from './fetch_error_notification';
import { getBankaraDummyProperties } from './types/bankara_properties';
import { getEventDummyProperties } from './types/event_properties';
import { getFestDummyProperties } from './types/fest_properties';
import { Sp3Locale } from './types/locale';
import { getRegularDummyProperties } from './types/regular_properties';
import { getSalmonRegularDummyProperties } from './types/salmon_properties';
import { Sp3Schedule } from './types/schedule';
import { getXDummyProperties } from './types/x_properties';
import { log4js_obj } from '../../../../log4js_settings';
import { sendErrorLogs } from '../../../logs/error/send_error_logs';
import { isDateWithinRange } from '../../datetime';
import { assertExistCheck, exists, notExists } from '../../others';
const schedule_url = 'https://splatoon3.ink/data/schedules.json';
const locale_url = 'https://splatoon3.ink/data/locale/ja-JP.json';

const logger = log4js_obj.getLogger();

const storageCache = new NodeCache();

export let inFallbackMode = false;

export async function getSchedule() {
    try {
        const schedule = storageCache.get('sp3_schedule') as Sp3Schedule;

        if (notExists(schedule)) {
            logger.warn('schedule data was not found. (fetch)');
            return await getFallbackSchedule();
        }

        if (getRegularList(schedule).length < 3 || inFallbackMode) {
            return getFallbackSchedule();
        } else if (getRegularList(schedule).length < 12) {
            // レギュラーのデータが12個未満ならフェッチする
            return (await updateSchedule()) ?? (await getFallbackSchedule());
        } else {
            return schedule;
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        return getDummySchedule();
    }
}

async function getFallbackSchedule() {
    const schedule = await updateSchedule();
    if (notExists(schedule)) {
        inFallbackMode = true;
        logger.warn('splatoon3.ink is down. (fallback)');
        return getDummySchedule();
    }

    const regularNodes = schedule.regularSchedules.nodes;
    const now = new Date();
    const startTimeFirst = new Date(regularNodes[0].startTime);
    const endTimeFirst = new Date(regularNodes[0].endTime);
    if (startTimeFirst <= now && now <= endTimeFirst && getRegularList(schedule).length >= 2) {
        inFallbackMode = false;
        logger.info('splatoon3.ink is recovered.');
        return schedule;
    } else {
        inFallbackMode = true;
        logger.warn('splatoon3.ink is down. (fallback)');
        return getDummySchedule();
    }
}

export async function getLocale() {
    try {
        const locale = storageCache.get('sp3_locale') as Sp3Locale;

        if (notExists(locale)) {
            logger.warn('locale data was not found. (fetch)');
            return await updateLocale();
        }
        return locale;
    } catch (error) {
        await sendErrorLogs(logger, error);
        return null;
    }
}

export async function updateLocale() {
    const locale = await fetch(locale_url);
    const localeData = (await locale.json()) as Sp3Locale;

    storageCache.set('sp3_locale', localeData);
    logger.info('locale fetched!');
    return localeData;
}

export async function updateSchedule() {
    try {
        const schedule = await fetch(schedule_url); // スケジュール情報のfetch
        const schduleData = (await schedule.json()).data as Sp3Schedule;

        storageCache.set('sp3_schedule', schduleData);
        logger.info('schedule fetched!');
        return schduleData;
    } catch (error) {
        if (shouldNotifyFetchError(error)) {
            await sendErrorLogs(logger, error);
        }
        return null;
    }
}

/**
 * フェス中かチェックする
 * @param schedule スケジュールデータ
 * @param num スケジュール番号
 * @returns フェス中ならtrueを返す
 */
export function checkFes(schedule: Sp3Schedule, num: number) {
    try {
        const festList = getFesList(schedule);
        const festSettings = festList[num].festMatchSettings;
        return exists(festSettings);
    } catch (error) {
        void sendErrorLogs(logger, error);
    }
}

/**
 * ビッグラン中かチェックする
 * @param schedule スケジュールデータ
 * @param num スケジュール番号
 * @returns ビッグラン中ならtrueを返す
 */
export function checkBigRun(schedule: Sp3Schedule, num: number) {
    try {
        const bigRunList = getBigRunList(schedule);

        if (bigRunList.length === 0) {
            return false;
        }

        const bigRunSetting = bigRunList[num].setting;

        if (notExists(bigRunSetting)) {
            return false;
        }

        const startDatetime = new Date(bigRunList[num].startTime);
        const endDatetime = new Date(bigRunList[num].endTime);
        const nowDatetime = new Date();
        return isDateWithinRange(nowDatetime, startDatetime, endDatetime);
    } catch (error) {
        void sendErrorLogs(logger, error);
    }
}

/**
 * チームコンテスト中かチェックする
 * @param schedule スケジュールデータ
 * @param num スケジュール番号
 * @returns チームコンテスト中ならtrueを返す
 */
export function checkTeamContest(schedule: Sp3Schedule, num: number) {
    try {
        const teamContestList = getTeamContestList(schedule);

        if (teamContestList.length === 0) {
            return false;
        }

        const teamContestSetting = teamContestList[num].setting;

        if (notExists(teamContestSetting)) {
            return false;
        }

        const startDatetime = new Date(teamContestList[num].startTime).getTime();
        const endDatetime = new Date(teamContestList[num].endTime).getTime();
        const nowDatetime = new Date().getTime();
        if (nowDatetime - startDatetime < 0) {
            return false;
        } else if (endDatetime - nowDatetime < 0) {
            return false;
        } else {
            return true;
        }
    } catch (error) {
        void sendErrorLogs(logger, error);
    }
}

/**
 * dataからレギュラー用のリストだけ返す
 * @param schedule スケジュールデータ
 */
export function getRegularList(schedule: Sp3Schedule) {
    try {
        const nodes = schedule.regularSchedules.nodes;
        const result = [];
        const nowDatetime = new Date().getTime();
        for (const node of nodes) {
            const endTime = new Date(node.endTime).getTime();
            if (endTime - nowDatetime > 0) {
                result.push(node);
            }
        }
        return result;
    } catch (error) {
        void sendErrorLogs(logger, error);
        return [];
    }
}

/**
 * dataからバンカラ用のリストだけ返す
 * @param schedule スケジュールデータ
 */
export function getAnarchyList(schedule: Sp3Schedule) {
    try {
        const nodes = schedule.bankaraSchedules.nodes;
        const result = [];
        const nowDatetime = new Date().getTime();
        for (const node of nodes) {
            const endTime = new Date(node.endTime).getTime();
            if (endTime - nowDatetime > 0) {
                result.push(node);
            }
        }
        return result;
    } catch (error) {
        void sendErrorLogs(logger, error);
        return [];
    }
}

/**
 * dataからイベントマッチ用のリストだけ返す
 * @param schedule スケジュールデータ
 */
export function getEventList(schedule: Sp3Schedule) {
    try {
        return schedule.eventSchedules.nodes;
    } catch (error) {
        void sendErrorLogs(logger, error);
        return [];
    }
}

/**
 * dataからサーモン用のリストだけ返す
 * @param schedule スケジュールデータ
 */
export function getSalmonList(schedule: Sp3Schedule) {
    try {
        const nodes = schedule.coopGroupingSchedule.regularSchedules.nodes;
        const result = [];
        const nowDatetime = new Date().getTime();
        for (const node of nodes) {
            const endTime = new Date(node.endTime).getTime();
            if (endTime - nowDatetime > 0) {
                result.push(node);
            }
        }
        return result;
    } catch (error) {
        void sendErrorLogs(logger, error);
        return [];
    }
}

/**
 * dataからXマッチ用のリストだけ返す
 * @param schedule スケジュールデータ
 */
export function getXMatchList(schedule: Sp3Schedule) {
    try {
        const nodes = schedule.xSchedules.nodes;
        const result = [];
        const nowDatetime = new Date().getTime();
        for (const node of nodes) {
            const endTime = new Date(node.endTime).getTime();
            if (endTime - nowDatetime > 0) {
                result.push(node);
            }
        }
        return result;
    } catch (error) {
        void sendErrorLogs(logger, error);
        return [];
    }
}

/**
 * dataからフェス用のリストだけ返す
 * @param schedule スケジュールデータ
 */
export function getFesList(schedule: Sp3Schedule) {
    try {
        const nodes = schedule.festSchedules.nodes;
        const result = [];
        const nowDatetime = new Date().getTime();
        for (const node of nodes) {
            const endTime = new Date(node.endTime).getTime();
            if (endTime - nowDatetime > 0) {
                result.push(node);
            }
        }
        return result;
    } catch (error) {
        void sendErrorLogs(logger, error);
        return [];
    }
}

/**
 * dataからビッグラン用のリストだけ返す
 * @param schedule スケジュールデータ
 */
export function getBigRunList(schedule: Sp3Schedule) {
    try {
        return schedule.coopGroupingSchedule.bigRunSchedules.nodes;
    } catch (error) {
        void sendErrorLogs(logger, error);
        return [];
    }
}

/**
 * dataからチームコンテスト用のリストだけ返す
 * @param schedule スケジュールデータ
 */
export function getTeamContestList(schedule: Sp3Schedule) {
    try {
        return schedule.coopGroupingSchedule.teamContestSchedules.nodes;
    } catch (error) {
        void sendErrorLogs(logger, error);
        return [];
    }
}

export type MatchInfo = {
    startTime: Date;
    endTime: Date;
    rule?: string;
    stage1?: string;
    stage2?: string;
    stageImage1?: string;
    stageImage2?: string;
};

/**
 * レギュラー募集用データに整形する
 * @param schedule フェッチしたデータ
 * @param num スケジュール番号
 * @returns 連想配列で返す
 */
export async function getRegularData(schedule: Sp3Schedule, num: number) {
    try {
        const regularList = getRegularList(schedule);

        if (regularList.length - 1 < num) {
            return null;
        }

        const regularSetting = regularList[num].regularMatchSetting;

        const result: MatchInfo = {
            startTime: new Date(regularList[num].startTime),
            endTime: new Date(regularList[num].endTime),
        };

        const locale = await getLocale();
        if (!checkFes(schedule, num) && exists(regularSetting) && !inFallbackMode) {
            if (exists(locale)) {
                result.rule = await rule2txt(locale, regularSetting.vsRule.id);
                result.stage1 = await stage2txt(locale, regularSetting.vsStages[0].id);
                result.stage2 = await stage2txt(locale, regularSetting.vsStages[1].id);
            } else {
                result.rule = regularSetting.vsRule.name;
                result.stage1 = regularSetting.vsStages[0].name;
                result.stage2 = regularSetting.vsStages[1].name;
            }
            result.stageImage1 = regularSetting.vsStages[0].image.url;
            result.stageImage2 = regularSetting.vsStages[1].image.url;
        }
        return result;
    } catch (error) {
        await sendErrorLogs(logger, error);
        return null;
    }
}

/**
 * バンカラマッチ(チャレンジ)用データに整形する
 * @param schedule フェッチしたデータ
 * @param num スケジュール番号
 * @returns 連想配列で返す
 */
export async function getAnarchyChallengeData(schedule: Sp3Schedule, num: number) {
    try {
        const anarchyList = getAnarchyList(schedule);

        if (anarchyList.length - 1 < num) {
            return null;
        }

        const anarchySettings = anarchyList[num].bankaraMatchSettings; // aSettings[0]: Challenge

        const result: MatchInfo = {
            startTime: new Date(anarchyList[num].startTime),
            endTime: new Date(anarchyList[num].endTime),
        };

        const locale = await getLocale();
        if (!checkFes(schedule, num) && exists(anarchySettings) && !inFallbackMode) {
            if (exists(locale)) {
                result.rule = await rule2txt(locale, anarchySettings[0].vsRule.id);
                result.stage1 = await stage2txt(locale, anarchySettings[0].vsStages[0].id);
                result.stage2 = await stage2txt(locale, anarchySettings[0].vsStages[1].id);
            } else {
                result.rule = anarchySettings[0].vsRule.name;
                result.stage1 = anarchySettings[0].vsStages[0].name;
                result.stage2 = anarchySettings[0].vsStages[1].name;
            }
            result.stageImage1 = anarchySettings[0].vsStages[0].image.url;
            result.stageImage2 = anarchySettings[0].vsStages[1].image.url;
        }
        return result;
    } catch (error) {
        await sendErrorLogs(logger, error);
        return null;
    }
}

/**
 * バンカラマッチ(オープン)用データに整形する
 * @param schedule フェッチしたデータ
 * @param num スケジュール番号
 * @returns 連想配列で返す
 */
export async function getAnarchyOpenData(schedule: Sp3Schedule, num: number) {
    try {
        const anarchyList = getAnarchyList(schedule);

        if (anarchyList.length - 1 < num) {
            return null;
        }

        const anarchySettings = anarchyList[num].bankaraMatchSettings; // aSettings[1]: Open

        const result: MatchInfo = {
            startTime: new Date(anarchyList[num].startTime),
            endTime: new Date(anarchyList[num].endTime),
        };

        const locale = await getLocale();
        if (!checkFes(schedule, num) && exists(anarchySettings) && !inFallbackMode) {
            if (exists(locale)) {
                result.rule = await rule2txt(locale, anarchySettings[1].vsRule.id);
                result.stage1 = await stage2txt(locale, anarchySettings[1].vsStages[0].id);
                result.stage2 = await stage2txt(locale, anarchySettings[1].vsStages[1].id);
            } else {
                result.rule = anarchySettings[1].vsRule.name;
                result.stage1 = anarchySettings[1].vsStages[0].name;
                result.stage2 = anarchySettings[1].vsStages[1].name;
            }
            result.stageImage1 = anarchySettings[1].vsStages[0].image.url;
            result.stageImage2 = anarchySettings[1].vsStages[1].image.url;
        }
        return result;
    } catch (error) {
        await sendErrorLogs(logger, error);
        return null;
    }
}

export type EventMatchInfo = {
    title: string;
    description: string;
    regulation: string;
    startTime: Date;
    endTime: Date;
    rule: string;
    stage1: string;
    stage2: string;
    stageImage1: string;
    stageImage2: string;
};

/**
 * イベントマッチ募集用データに整形する
 * @param schedule フェッチしたデータ
 * @param num スケジュール番号
 * @returns 連想配列で返す
 */
export async function getEventData(schedule: Sp3Schedule) {
    try {
        const eventList = getEventList(schedule);

        let targetEvent = null;
        let startTime = null;
        let endTime = null;

        for (const event of eventList) {
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

        if (notExists(targetEvent)) {
            return null;
        }

        assertExistCheck(startTime, 'eventMatchStartTime');
        assertExistCheck(endTime, 'eventMatchEndTime');

        const eventSetting = targetEvent.leagueMatchSetting;

        const locale = await getLocale();

        let eventTexts = {
            title: eventSetting.leagueMatchEvent.name,
            description: eventSetting.leagueMatchEvent.desc,
            regulation: eventSetting.leagueMatchEvent.regulation,
        };
        if (exists(locale)) {
            eventTexts = await event2txt(locale, eventSetting.leagueMatchEvent.id);
        }
        assertExistCheck(eventTexts);

        const result: EventMatchInfo = {
            title: eventTexts.title,
            description: eventTexts.description,
            regulation: eventTexts.regulation,
            startTime: startTime,
            endTime: endTime,
            rule: exists(locale)
                ? await rule2txt(locale, eventSetting.vsRule.id)
                : eventSetting.vsRule.name,
            stage1: exists(locale)
                ? await stage2txt(locale, eventSetting.vsStages[0].id)
                : eventSetting.vsStages[0].name,
            stage2: exists(locale)
                ? await stage2txt(locale, eventSetting.vsStages[1].id)
                : eventSetting.vsStages[1].name,
            stageImage1: eventSetting.vsStages[0].image.url,
            stageImage2: eventSetting.vsStages[1].image.url,
        };

        return result;
    } catch (error) {
        await sendErrorLogs(logger, error);
        return null;
    }
}

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

/**
 * サーモン募集用データに整形する
 * @param schedule フェッチしたデータ
 * @param num スケジュール番号
 * @returns 連想配列で返す
 */
export async function getSalmonData(schedule: Sp3Schedule, num: number) {
    try {
        const salmonList = getSalmonList(schedule);

        if (salmonList.length - 1 < num) {
            return null;
        }

        const salmonSetting = salmonList[num].setting;

        const locale = await getLocale();
        const result: SalmonInfo = {
            startTime: new Date(salmonList[num].startTime),
            endTime: new Date(salmonList[num].endTime),
            stage: exists(locale)
                ? await stage2txt(locale, salmonSetting.coopStage.id)
                : salmonSetting.coopStage.name,
            weapon1: salmonSetting.weapons[0].image.url,
            weapon2: salmonSetting.weapons[1].image.url,
            weapon3: salmonSetting.weapons[2].image.url,
            weapon4: salmonSetting.weapons[3].image.url,
            stageImage: salmonSetting.coopStage.thumbnailImage.url,
        };

        return result;
    } catch (error) {
        await sendErrorLogs(logger, error);
        return null;
    }
}

/**
 * Xマッチ用データに整形する
 * @param schedule フェッチしたデータ
 * @param num スケジュール番号
 * @returns 連想配列で返す
 */
export async function getXMatchData(schedule: Sp3Schedule, num: number) {
    try {
        const xMatchList = getXMatchList(schedule);

        if (xMatchList.length - 1 < num) {
            return null;
        }

        const xMatchSettings = xMatchList[num].xMatchSetting;

        const result: MatchInfo = {
            startTime: new Date(xMatchList[num].startTime),
            endTime: new Date(xMatchList[num].endTime),
        };

        const locale = await getLocale();
        if (!checkFes(schedule, num) && exists(xMatchSettings) && !inFallbackMode) {
            if (exists(locale)) {
                result.rule = await rule2txt(locale, xMatchSettings.vsRule.id);
                result.stage1 = await stage2txt(locale, xMatchSettings.vsStages[0].id);
                result.stage2 = await stage2txt(locale, xMatchSettings.vsStages[1].id);
            } else {
                result.rule = xMatchSettings.vsRule.name;
                result.stage1 = xMatchSettings.vsStages[0].name;
                result.stage2 = xMatchSettings.vsStages[1].name;
            }
            result.stageImage1 = xMatchSettings.vsStages[0].image.url;
            result.stageImage2 = xMatchSettings.vsStages[1].image.url;
        }
        return result;
    } catch (error) {
        await sendErrorLogs(logger, error);
        return null;
    }
}
/**
 * フェスマッチ(チャレンジ)用データに整形する
 * @param schedule フェッチしたデータ
 * @param num スケジュール番号
 * @returns 連想配列で返す
 */
export async function getFesChallengeData(schedule: Sp3Schedule, num: number) {
    try {
        const festList = getFesList(schedule);

        if (festList.length - 1 < num) {
            return null;
        }

        const festSettings = festList[num].festMatchSettings;

        const result: MatchInfo = {
            startTime: new Date(festList[num].startTime),
            endTime: new Date(festList[num].endTime),
        };

        const locale = await getLocale();
        if (checkFes(schedule, num) && exists(festSettings) && !inFallbackMode) {
            if (exists(locale)) {
                result.rule = await rule2txt(locale, festSettings[1].vsRule.id);
                result.stage1 = await stage2txt(locale, festSettings[1].vsStages[0].id);
                result.stage2 = await stage2txt(locale, festSettings[1].vsStages[1].id);
            } else {
                result.rule = festSettings[1].vsRule.name;
                result.stage1 = festSettings[1].vsStages[0].name;
                result.stage2 = festSettings[1].vsStages[1].name;
            }
            result.stageImage1 = festSettings[1].vsStages[0].image.url;
            result.stageImage2 = festSettings[1].vsStages[1].image.url;
        }
        return result;
    } catch (error) {
        await sendErrorLogs(logger, error);
        return null;
    }
}

/**
 * フェス(オープン)用データに整形する
 * @param schedule フェッチしたデータ
 * @param num スケジュール番号
 * @returns 連想配列で返す
 */
export async function getFesRegularData(schedule: Sp3Schedule, num: number) {
    try {
        const festList = getFesList(schedule);

        if (festList.length - 1 < num) {
            return null;
        }

        const festSettings = festList[num].festMatchSettings;

        const result: MatchInfo = {
            startTime: new Date(festList[num].startTime),
            endTime: new Date(festList[num].endTime),
        };

        const locale = await getLocale();
        if (checkFes(schedule, num) && exists(festSettings) && !inFallbackMode) {
            if (exists(locale)) {
                result.rule = await rule2txt(locale, festSettings[1].vsRule.id);
                result.stage1 = await stage2txt(locale, festSettings[1].vsStages[0].id);
                result.stage2 = await stage2txt(locale, festSettings[1].vsStages[1].id);
            } else {
                result.rule = festSettings[1].vsRule.name;
                result.stage1 = festSettings[1].vsStages[0].name;
                result.stage2 = festSettings[1].vsStages[1].name;
            }
            result.stageImage1 = festSettings[1].vsStages[0].image.url;
            result.stageImage2 = festSettings[1].vsStages[1].image.url;
        }
        return result;
    } catch (error) {
        await sendErrorLogs(logger, error);
        return null;
    }
}

/**
 * ビッグラン募集用データに整形する
 * @param schedule フェッチしたデータ
 * @param num スケジュール番号
 * @returns 連想配列で返す
 */
export async function getBigRunData(schedule: Sp3Schedule, num: number) {
    try {
        const bigRunList = getBigRunList(schedule);
        const bigRunSetting = bigRunList[num].setting;

        const locale = await getLocale();
        const result: SalmonInfo = {
            startTime: new Date(bigRunList[num].startTime),
            endTime: new Date(bigRunList[num].endTime),
            stage: exists(locale)
                ? await stage2txt(locale, bigRunSetting.coopStage.id)
                : bigRunSetting.coopStage.name,
            weapon1: bigRunSetting.weapons[0].image.url,
            weapon2: bigRunSetting.weapons[1].image.url,
            weapon3: bigRunSetting.weapons[2].image.url,
            weapon4: bigRunSetting.weapons[3].image.url,
            stageImage: bigRunSetting.coopStage.thumbnailImage.url,
        };
        return result;
    } catch (error) {
        await sendErrorLogs(logger, error);
        return null;
    }
}

/**
 * チームコンテスト募集用データに整形する
 * @param schedule フェッチしたデータ
 * @param num スケジュール番号
 * @returns 連想配列で返す
 */
export async function getTeamContestData(schedule: Sp3Schedule, num: number) {
    try {
        const teamContestList = getTeamContestList(schedule);
        const teamContestSetting = teamContestList[num].setting;

        const locale = await getLocale();
        const result: SalmonInfo = {
            startTime: new Date(teamContestList[num].startTime),
            endTime: new Date(teamContestList[num].endTime),
            stage: exists(locale)
                ? await stage2txt(locale, teamContestSetting.coopStage.id)
                : teamContestSetting.coopStage.name,
            weapon1: teamContestSetting.weapons[0].image.url,
            weapon2: teamContestSetting.weapons[1].image.url,
            weapon3: teamContestSetting.weapons[2].image.url,
            weapon4: teamContestSetting.weapons[3].image.url,
            stageImage: teamContestSetting.coopStage.thumbnailImage.url,
        };
        return result;
    } catch (error) {
        await sendErrorLogs(logger, error);
        return null;
    }
}

/**
 * localeをもとにIDをステージ名に変換
 * @param locale ロケールデータ
 * @param id 変換するID
 * @returns ステージ名
 */
export async function stage2txt(locale: Sp3Locale, id: string, fetch = true): Promise<string> {
    try {
        const stages = locale.stages;
        if (notExists(stages[id])) {
            if (fetch) {
                const fetchedLocale = await updateLocale();
                return await stage2txt(fetchedLocale, id, false);
            } else {
                return 'そーりー・あんでふぁいんど';
            }
        } else {
            return stages[id].name;
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        return 'そーりー・あんでふぁいんど';
    }
}

/**
 * localeをもとにIDをルール名に変換
 * @param locale ロケールデータ
 * @param id 変換するID
 * @returns ルール名
 */
export async function rule2txt(locale: Sp3Locale, id: string, fetch = true): Promise<string> {
    try {
        const rules = locale.rules;
        if (notExists(rules[id])) {
            if (fetch) {
                const fetchedLocale = await updateLocale();
                return await rule2txt(fetchedLocale, id, false);
            } else {
                return 'そーりー・あんでふぁいんど';
            }
        } else {
            return rules[id].name;
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        return 'そーりー・あんでふぁいんど';
    }
}

export async function event2txt(
    locale: Sp3Locale,
    id: string,
    fetch = true,
): Promise<{ title: string; description: string; regulation: string }> {
    try {
        const result = {
            title: 'そーりー・あんでふぁいんど',
            description: 'そーりー・あんでふぁいんど',
            regulation: 'そーりー・あんでふぁいんど',
        };

        const events = locale.events;

        if (notExists(events[id])) {
            if (fetch) {
                const fetchedLocale = await updateLocale();
                return await event2txt(fetchedLocale, id, false);
            } else {
                return result;
            }
        } else {
            result.title = events[id].name;
            result.description = events[id].desc;
            result.regulation = events[id].regulation;
            return result;
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        return {
            title: 'そーりー・あんでふぁいんど',
            description: 'そーりー・あんでふぁいんど',
            regulation: 'そーりー・あんでふぁいんど',
        };
    }
}

const getDummySchedule = (): Sp3Schedule => {
    const now = new Date();
    const startTime1 = new Date();
    const currentHour = now.getHours();

    if (currentHour === 0) {
        // 0 時台の場合 -> 日付を前日にして 23 時にする
        startTime1.setDate(now.getDate() - 1);
        startTime1.setHours(23, 0, 0, 0);
    } else if (currentHour % 2 === 0) {
        // 偶数時の場合 -> 1 時間引いて奇数にする
        startTime1.setHours(currentHour - 1, 0, 0, 0);
    } else {
        // 分・秒を 0 に設定
        startTime1.setHours(currentHour, 0, 0, 0);
    }

    // 2時間 - 1ms後の時間を取得
    const endTime1 = new Date(startTime1.getTime() + 2 * 60 * 60 * 1000);
    const startTime2 = new Date(startTime1.getTime() + 2 * 60 * 60 * 1000);
    const endTime2 = new Date(startTime2.getTime() + 2 * 60 * 60 * 1000);

    return {
        regularSchedules: {
            nodes: [
                getRegularDummyProperties(startTime1, endTime1),
                getRegularDummyProperties(startTime2, endTime2),
            ],
        },
        bankaraSchedules: {
            nodes: [
                getBankaraDummyProperties(startTime1, endTime1),
                getBankaraDummyProperties(startTime2, endTime2),
            ],
        },
        xSchedules: {
            nodes: [
                getXDummyProperties(startTime1, endTime1),
                getXDummyProperties(startTime2, endTime2),
            ],
        },
        festSchedules: {
            nodes: [
                getFestDummyProperties(startTime1, endTime1),
                getFestDummyProperties(startTime2, endTime2),
            ],
        },
        coopGroupingSchedule: {
            bannerImage: { url: '' },
            regularSchedules: { nodes: [getSalmonRegularDummyProperties(startTime1, endTime1)] },
            bigRunSchedules: { nodes: [] },
            teamContestSchedules: { nodes: [] },
        },
        eventSchedules: { nodes: [getEventDummyProperties(startTime1, endTime1)] },
    };
};
