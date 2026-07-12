import { describe, expect, it } from 'vitest';

import * as buttonId from '@/config/constants/button_id';
import { RecruitType, isRecruitType } from '@/infra/db/repositories/recruit_service';

describe('button_id 型ガード', () => {
    it.each([
        [
            'isCommandVCLockButton',
            buttonId.isCommandVCLockButton,
            buttonId.CommandVCLockButton.LockSwitch,
        ],
        ['isVCLockButton', buttonId.isVCLockButton, buttonId.VCLockButton.Increase10],
        ['isVCToolsButton', buttonId.isVCToolsButton, buttonId.VCToolsButton.VoiceJoin],
        ['isRecruitParam', buttonId.isRecruitParam, buttonId.RecruitParam.Approve],
        ['isTeamDividerParam', buttonId.isTeamDividerParam, buttonId.TeamDividerParam.Spectate],
        ['isFriendCodeButton', buttonId.isFriendCodeButton, buttonId.FriendCodeButton.Hide],
        ['isQuestionnaireParam', buttonId.isQuestionnaireParam, buttonId.QuestionnaireParam.Yes],
        [
            'isSupportCloseButton',
            buttonId.isSupportCloseButton,
            buttonId.SupportCloseButton.Resolved,
        ],
    ])('%s は定義値だけを受け入れる', (_name, guard, value) => {
        expect(guard(value)).toBe(true);
        expect(guard('unknown')).toBe(false);
    });
});

describe('isRecruitType', () => {
    it('募集種別の定義値だけを受け入れる', () => {
        expect(isRecruitType(RecruitType.RaidersRecruit)).toBe(true);
        expect(isRecruitType(9)).toBe(false);
    });
});
