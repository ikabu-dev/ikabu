import { ObjectValueList } from './constant_common';

export const CommandVCLockButton = {
    LockSwitch: 'vc_lock_command_lock_switch',
    Increase: 'vc_lock_command_increase',
    Decrease: 'vc_lock_command_decrease',
} as const;
export type CommandVCLockButton = ObjectValueList<typeof CommandVCLockButton>;
export function isCommandVCLockButton(value: string): value is CommandVCLockButton {
    return Object.values(CommandVCLockButton).some((v) => v === value);
}

export const VCLockButton = {
    LockSwitch: 'vc_lock_lock_switch',
    Increase1: 'vc_lock_increase_1',
    Increase10: 'vc_lock_increase_10',
    Decrease1: 'vc_lock_decrease_1',
    Decrease10: 'vc_lock_decrease_10',
} as const;
export type VCLockButton = ObjectValueList<typeof VCLockButton>;
export function isVCLockButton(value: string): value is VCLockButton {
    return Object.values(VCLockButton).some((v) => v === value);
}

export const VCToolsButton = {
    VoiceJoin: 'vc_tools_voice_join',
    VoiceKill: 'vc_tools_voice_kill',
    RequestRadio: 'vc_tools_request_radio',
} as const;
export type VCToolsButton = ObjectValueList<typeof VCToolsButton>;
export function isVCToolsButton(value: string): value is VCToolsButton {
    return Object.values(VCToolsButton).some((v) => v === value);
}

export const RecruitParam = {
    Join: 'jr',
    Cancel: 'cr',
    Delete: 'del',
    Close: 'close',
    EndEvent: 'enev',
    JoinNotify: 'njr',
    CancelNotify: 'ncr',
    CloseNotify: 'nclose',
    NewModalRecruit: 'newr',
    Approve: 'apr',
    Reject: 'rej',
} as const;
export type RecruitParam = ObjectValueList<typeof RecruitParam>;
export function isRecruitParam(value: string): value is RecruitParam {
    return Object.values(RecruitParam).some((v) => v === value);
}

export const TeamDividerParam = {
    Join: 'join',
    Register: 'register',
    Cancel: 'cancel',
    Alfa: 'alfa',
    Bravo: 'bravo',
    Spectate: 'spectate',
    End: 'end',
    Correct: 'correct',
    Hide: 'hide',
} as const;
export type TeamDividerParam = ObjectValueList<typeof TeamDividerParam>;
export function isTeamDividerParam(value: string): value is TeamDividerParam {
    return Object.values(TeamDividerParam).some((v) => v === value);
}

export const FriendCodeButton = {
    Hide: 'friendcode_hide',
};
export type FriendCodeButton = ObjectValueList<typeof FriendCodeButton>;
export function isFriendCodeButton(value: string): value is FriendCodeButton {
    return Object.values(FriendCodeButton).some((v) => v === value);
}

export const QuestionnaireParam = {
    Yes: 'yes',
    No: 'no',
} as const;
export type QuestionnaireParam = ObjectValueList<typeof QuestionnaireParam>;
export function isQuestionnaireParam(value: string): value is QuestionnaireParam {
    return Object.values(QuestionnaireParam).some((v) => v === value);
}

export const SupportCloseButton = {
    Resolved: 'support_resolved',
} as const;
export type SupportCloseButton = ObjectValueList<typeof SupportCloseButton>;
export function isSupportCloseButton(value: string): value is SupportCloseButton {
    return Object.values(SupportCloseButton).some((v) => v === value);
}
