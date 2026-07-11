import NodeCache from 'node-cache';
import fetch from 'node-fetch';

import { withTemporaryFetchRetry } from '@/app/common/fetch_retry';
import { notExists } from '@/app/common/others';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { log4js_obj } from '@/log4js_settings';

import { getRegularList } from './schedule_lists';
import { getBankaraDummyProperties } from './types/bankara_properties';
import { getEventDummyProperties } from './types/event_properties';
import { getFestDummyProperties } from './types/fest_properties';
import { Sp3Locale } from './types/locale';
import { getRegularDummyProperties } from './types/regular_properties';
import { getSalmonRegularDummyProperties } from './types/salmon_properties';
import { Sp3Schedule } from './types/schedule';
import { getXDummyProperties } from './types/x_properties';

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
        if (getRegularList(schedule).length < 3 || inFallbackMode) return getFallbackSchedule();
        if (getRegularList(schedule).length < 12)
            return (await updateSchedule()) ?? (await getFallbackSchedule());
        return schedule;
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
    const [first] = schedule.regularSchedules.nodes;
    const now = new Date();
    if (
        new Date(first.startTime) <= now &&
        now <= new Date(first.endTime) &&
        getRegularList(schedule).length >= 2
    ) {
        inFallbackMode = false;
        logger.info('splatoon3.ink is recovered.');
        return schedule;
    }
    inFallbackMode = true;
    logger.warn('splatoon3.ink is down. (fallback)');
    return getDummySchedule();
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
        return await withTemporaryFetchRetry(fetchScheduleAndCache);
    } catch (error) {
        await sendErrorLogs(logger, error);
        return null;
    }
}

async function fetchScheduleAndCache() {
    const schedule = await fetch(schedule_url);
    const scheduleData = (await schedule.json()).data as Sp3Schedule;
    storageCache.set('sp3_schedule', scheduleData);
    logger.info('schedule fetched!');
    return scheduleData;
}

const getDummySchedule = (): Sp3Schedule => {
    const now = new Date();
    const startTime1 = new Date();
    const currentHour = now.getHours();
    if (currentHour === 0) {
        startTime1.setDate(now.getDate() - 1);
        startTime1.setHours(23, 0, 0, 0);
    } else if (currentHour % 2 === 0) {
        startTime1.setHours(currentHour - 1, 0, 0, 0);
    } else {
        startTime1.setHours(currentHour, 0, 0, 0);
    }
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
