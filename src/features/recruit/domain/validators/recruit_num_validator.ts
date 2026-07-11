import { Member } from '@prisma/client';

import {
    checkRecruitNum,
    checkRegularRecruitNum,
} from '@/features/recruit/domain/condition_checks/recruit_num_check';
import { RecruitConditionError } from '@/features/recruit/domain/types/recruit_condition_error';
import { RecruitAlertTexts } from '@/features/recruit/ui/alert_texts/alert_texts';
import { RecruitType } from '@/infra/db/repositories/recruit_service';
import { exists } from '@/shared/assert';

export function validateRecruitNum(
    recruitNum: number,
    recruitType: RecruitType,
    attendee1: Member | null,
    attendee2: Member | null,
    attendee3: Member | null,
): number {
    if (Number.isNaN(recruitNum)) {
        throw new RecruitConditionError(RecruitAlertTexts.RecruitNumIsNaN);
    }

    const checkResponse =
        recruitType === RecruitType.RegularRecruit
            ? checkRegularRecruitNum(recruitNum, attendee1, attendee2, attendee3)
            : checkRecruitNum(recruitNum, attendee1, attendee2);

    if (exists(checkResponse.recruitNumErrorMessage)) {
        throw new RecruitConditionError(checkResponse.recruitNumErrorMessage);
    }

    return checkResponse.memberCount;
}
