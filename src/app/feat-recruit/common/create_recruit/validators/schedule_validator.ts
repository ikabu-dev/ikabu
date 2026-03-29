import { Guild } from 'discord.js';

import { checkRecruitSchedule } from '../condition_checks/schedule_check';
import { RecruitType } from '../../../../../db/recruit_service';
import { getSchedule } from '../../../../common/apis/splatoon3.ink/splatoon3_ink';
import { Sp3Schedule } from '../../../../common/apis/splatoon3.ink/types/schedule';
import { getDeveloperMention, notExists } from '../../../../common/others';
import { RecruitAlertTexts } from '../../../alert_texts/alert_texts';
import { RecruitConditionError } from '../../../types/recruit_condition_error';

export function getScheduleNumFromString(scheduleString: string | undefined): number {
    if (notExists(scheduleString)) {
        return 0;
    }

    switch (scheduleString) {
        case 'now':
            return 0;
        case 'next':
            return 1;
        default:
            return 0;
    }
}

export async function validateSchedule(
    guild: Guild,
    scheduleNum: number,
    recruitType: RecruitType,
): Promise<Sp3Schedule> {
    const schedule = await getSchedule();
    if (notExists(schedule)) {
        throw new RecruitConditionError(
            getDeveloperMention(guild.id) + RecruitAlertTexts.ScheduleLoadError,
        );
    }

    const checkScheduleResponse = await checkRecruitSchedule(
        guild.id,
        schedule,
        scheduleNum,
        recruitType,
    );
    if (!checkScheduleResponse.canRecruit) {
        throw new RecruitConditionError(checkScheduleResponse.recruitDateErrorMessage);
    }

    return schedule;
}
