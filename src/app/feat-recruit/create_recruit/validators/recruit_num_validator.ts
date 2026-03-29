import { Member } from '@prisma/client';

import { RecruitType } from '../../../../db/recruit_service';
import { exists } from '../../../common/others';
import { RecruitAlertTexts } from '../../common/alert_texts/alert_texts';
import { RecruitConditionError } from '../../common/types/recruit_condition_error';
import { checkRecruitNum, checkRegularRecruitNum } from '../condition_checks/recruit_num_check';

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
