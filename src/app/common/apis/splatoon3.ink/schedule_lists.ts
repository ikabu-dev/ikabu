import { isDateWithinRange } from '@/app/common/datetime';
import { exists, notExists } from '@/app/common/others';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { log4js_obj } from '@/log4js_settings';

import { Sp3Schedule } from './types/schedule';

const logger = log4js_obj.getLogger();

type ScheduleNode = { endTime: string };

function getNodes<T>(
    schedule: Sp3Schedule,
    getNodes: (schedule: Sp3Schedule) => T[],
    filterExpired = true,
): T[] {
    try {
        const nodes = getNodes(schedule);
        if (!filterExpired) return nodes;
        const now = new Date().getTime();
        return (nodes as (T & ScheduleNode)[]).filter(
            (node) => new Date(node.endTime).getTime() - now > 0,
        );
    } catch (error) {
        void sendErrorLogs(logger, error);
        return [];
    }
}

export const getRegularList = (schedule: Sp3Schedule) =>
    getNodes(schedule, (data) => data.regularSchedules.nodes);
export const getAnarchyList = (schedule: Sp3Schedule) =>
    getNodes(schedule, (data) => data.bankaraSchedules.nodes);
export const getEventList = (schedule: Sp3Schedule) =>
    getNodes(schedule, (data) => data.eventSchedules.nodes, false);
export const getSalmonList = (schedule: Sp3Schedule) =>
    getNodes(schedule, (data) => data.coopGroupingSchedule.regularSchedules.nodes);
export const getXMatchList = (schedule: Sp3Schedule) =>
    getNodes(schedule, (data) => data.xSchedules.nodes);
export const getFesList = (schedule: Sp3Schedule) =>
    getNodes(schedule, (data) => data.festSchedules.nodes);
export const getBigRunList = (schedule: Sp3Schedule) =>
    getNodes(schedule, (data) => data.coopGroupingSchedule.bigRunSchedules.nodes, false);
export const getTeamContestList = (schedule: Sp3Schedule) =>
    getNodes(schedule, (data) => data.coopGroupingSchedule.teamContestSchedules.nodes, false);

export function checkFes(schedule: Sp3Schedule, num: number) {
    try {
        return exists(getFesList(schedule)[num].festMatchSettings);
    } catch (error) {
        void sendErrorLogs(logger, error);
    }
}

function checkCoopEvent<T extends { setting: unknown; startTime: string; endTime: string }>(
    list: T[],
    num: number,
) {
    if (list.length === 0 || notExists(list[num].setting)) return false;
    return isDateWithinRange(
        new Date(),
        new Date(list[num].startTime),
        new Date(list[num].endTime),
    );
}

export function checkBigRun(schedule: Sp3Schedule, num: number) {
    try {
        return checkCoopEvent(getBigRunList(schedule), num);
    } catch (error) {
        void sendErrorLogs(logger, error);
    }
}

export function checkTeamContest(schedule: Sp3Schedule, num: number) {
    try {
        return checkCoopEvent(getTeamContestList(schedule), num);
    } catch (error) {
        void sendErrorLogs(logger, error);
    }
}
