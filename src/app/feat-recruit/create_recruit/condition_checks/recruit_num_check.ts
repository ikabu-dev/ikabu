import { Member } from '@prisma/client';

import { exists } from '../../../common/others';
import { RecruitAlertTexts } from '../../alert_texts/alert_texts';

// 募集人数が問題ない場合の返答用のオブジェクト
type recruitNumCheckResponse = {
    recruitNumErrorMessage: string | null;
    memberCount: number;
};

export function checkRecruitNum(
    recruitNum: number,
    attendee1: Member | null,
    attendee2: Member | null,
): recruitNumCheckResponse {
    let memberCounter = recruitNum;

    if (recruitNum < 1 || recruitNum > 3) {
        return {
            recruitNumErrorMessage: RecruitAlertTexts.RecruitNumOutOfRange,
            memberCount: -1,
        };
    } else {
        memberCounter++;
    }

    // プレイヤー指定があればカウンターを増やす
    if (exists(attendee1)) memberCounter++;
    if (exists(attendee2)) memberCounter++;

    if (memberCounter > 4) {
        return {
            recruitNumErrorMessage: RecruitAlertTexts.InvalidRecruitNum,
            memberCount: -1,
        };
    }

    return {
        recruitNumErrorMessage: null,
        memberCount: memberCounter,
    };
}

export function checkRegularRecruitNum(
    recruitNum: number,
    attendee1: Member | null,
    attendee2: Member | null,
    attendee3: Member | null,
): recruitNumCheckResponse {
    let memberCounter = recruitNum;

    if (recruitNum < 1 || recruitNum > 7) {
        return {
            recruitNumErrorMessage: RecruitAlertTexts.RegularRecruitNumOutOfRange,
            memberCount: -1,
        };
    } else {
        memberCounter++;
    }

    // プレイヤー指定があればカウンターを増やす
    if (exists(attendee1)) memberCounter++;
    if (exists(attendee2)) memberCounter++;
    if (exists(attendee3)) memberCounter++;

    if (memberCounter > 8) {
        return {
            recruitNumErrorMessage: RecruitAlertTexts.InvalidRecruitNum,
            memberCount: -1,
        };
    }

    return {
        recruitNumErrorMessage: null,
        memberCount: memberCounter,
    };
}
