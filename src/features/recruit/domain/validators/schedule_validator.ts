import { Guild } from 'discord.js';

import { checkRecruitSchedule } from '@/features/recruit/domain/condition_checks/schedule_check';
import { RecruitConditionError } from '@/features/recruit/domain/types/recruit_condition_error';
import { RecruitAlertTexts } from '@/features/recruit/ui/alert_texts/alert_texts';
import { RecruitType } from '@/infra/db/repositories/recruit_service';
import { getSchedule } from '@/infra/external/splatoon3-ink/splatoon3_ink';
import { Sp3Schedule } from '@/infra/external/splatoon3-ink/types/schedule';
import { notExists } from '@/shared/assert';
import { getDeveloperMention } from '@/shared/discord_helpers/developer_mention';

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
