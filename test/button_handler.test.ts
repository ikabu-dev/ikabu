import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(
    () =>
        Object.fromEntries(
            [
                'deleteFriendCode',
                'voiceLockCommandUpdate',
                'voiceLockUpdate',
                'joinTTS',
                'killTTS',
                'sendRadioRequest',
                'setResolvedTag',
                'recruitButtonHandler',
                'dividerButtonHandler',
                'questionnaireButtonHandler',
            ].map((name) => [name, vi.fn()]),
        ) as Record<string, ReturnType<typeof vi.fn>>,
);

vi.mock('../src/app/event/rookie/send_questionnaire', () => ({
    questionnaireButtonHandler: mocks.questionnaireButtonHandler,
}));
vi.mock('../src/app/event/support_auto_tag/resolved_support', () => ({
    setResolvedTag: mocks.setResolvedTag,
}));
vi.mock('../src/app/event/vctools_sticky/radio_request', () => ({
    sendRadioRequest: mocks.sendRadioRequest,
}));
vi.mock('../src/app/event/vctools_sticky/voice_lock', () => ({
    voiceLockUpdate: mocks.voiceLockUpdate,
}));
vi.mock('../src/app/feat-recruit/recruit_button_handler', () => ({
    recruitButtonHandler: mocks.recruitButtonHandler,
}));
vi.mock('../src/app/feat-utils/other/friendcode', () => ({
    deleteFriendCode: mocks.deleteFriendCode,
}));
vi.mock('../src/app/feat-utils/team_divider/divider_button_handler', () => ({
    dividerButtonHandler: mocks.dividerButtonHandler,
}));
vi.mock('../src/app/feat-utils/voice/tts/discordjs_voice', () => ({
    joinTTS: mocks.joinTTS,
    killTTS: mocks.killTTS,
}));
vi.mock('../src/app/feat-utils/voice/voice_locker', () => ({
    voiceLockCommandUpdate: mocks.voiceLockCommandUpdate,
}));

import {
    CommandVCLockButton,
    FriendCodeButton,
    SupportCloseButton,
    VCLockButton,
    VCToolsButton,
} from '@/config/constants/button_id';

import { call } from '../src/app/handlers/button_handler';

const cases: [string, string][] = [
    [FriendCodeButton.Hide, 'deleteFriendCode'],
    [CommandVCLockButton.LockSwitch, 'voiceLockCommandUpdate'],
    [VCLockButton.LockSwitch, 'voiceLockUpdate'],
    [VCToolsButton.VoiceJoin, 'joinTTS'],
    [VCToolsButton.VoiceKill, 'killTTS'],
    [VCToolsButton.RequestRadio, 'sendRadioRequest'],
    [SupportCloseButton.Resolved, 'setResolvedTag'],
    ['d=jr', 'recruitButtonHandler'],
    ['t=join', 'dividerButtonHandler'],
    ['q=yes', 'questionnaireButtonHandler'],
];

describe('button_handler dispatch', () => {
    beforeEach(() => vi.clearAllMocks());

    it.each(cases)('%s を正しいハンドラへ1回dispatchする', async (customId, handler) => {
        const interaction = { customId, inGuild: () => true, deferReply: vi.fn() };
        await call(interaction as never);
        expect(mocks[handler]).toHaveBeenCalledTimes(1);
    });

    it('DMではギルド専用の処理を行わない', async () => {
        await call({ customId: VCToolsButton.RequestRadio, inGuild: () => false } as never);
        expect(mocks.sendRadioRequest).not.toHaveBeenCalled();
    });
});
