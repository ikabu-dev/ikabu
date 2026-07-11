import { beforeEach, describe, expect, it, vi } from 'vitest';

const names = [
    'shutdown',
    'voiceLocker',
    'closeCommand',
    'dividerInitialMessage',
    'regularRecruit',
    'anarchyRecruit',
    'eventRecruit',
    'salmonRecruit',
    'raidersRecruit',
    'festRecruit',
    'otherGameRecruit',
    'privateRecruit',
    'buttonRecruit',
    'voiceMention',
    'channelSettingsHandler',
    'uniqueChannelSettingsHandler',
    'uniqueRoleSettingsHandler',
    'variablesHandler',
    'handleVoicePick',
    'handleBan',
    'joinedAtFixer',
    'festSettingHandler',
    'handleIkabuExperience',
    'handleTTSCommand',
    'channelManagerHandler',
    'handleFriendCode',
    'handleWiki',
    'handleKansen',
    'handleTimer',
    'handlePick',
    'handleBuki',
    'handleShow',
    'handleHelp',
] as const;
const mocks = vi.hoisted(
    () =>
        Object.fromEntries(
            [
                'shutdown',
                'voiceLocker',
                'closeCommand',
                'dividerInitialMessage',
                'regularRecruit',
                'anarchyRecruit',
                'eventRecruit',
                'salmonRecruit',
                'raidersRecruit',
                'festRecruit',
                'otherGameRecruit',
                'privateRecruit',
                'buttonRecruit',
                'voiceMention',
                'channelSettingsHandler',
                'uniqueChannelSettingsHandler',
                'uniqueRoleSettingsHandler',
                'variablesHandler',
                'handleVoicePick',
                'handleBan',
                'joinedAtFixer',
                'festSettingHandler',
                'handleIkabuExperience',
                'handleTTSCommand',
                'channelManagerHandler',
                'handleFriendCode',
                'handleWiki',
                'handleKansen',
                'handleTimer',
                'handlePick',
                'handleBuki',
                'handleShow',
                'handleHelp',
                'sendCommandLog',
                'sendErrorLogs',
            ].map((name) => [name, vi.fn()]),
        ) as Record<string, ReturnType<typeof vi.fn>>,
);

vi.mock('@/features/admin/shutdown/shutdown_process', () => ({ shutdown: mocks.shutdown }));
vi.mock('@/features/admin/channel_manager/channel_manager_handler', () => ({
    channelManagerHandler: mocks.channelManagerHandler,
}));
vi.mock('@/features/admin/channel_settings/channel_settings_handler', () => ({
    channelSettingsHandler: mocks.channelSettingsHandler,
}));
vi.mock('@/features/admin/environment_variables/variables_handler', () => ({
    variablesHandler: mocks.variablesHandler,
}));
vi.mock('@/features/admin/fest_setting/fest_settings', () => ({
    festSettingHandler: mocks.festSettingHandler,
}));
vi.mock('@/features/admin/joined_date_fixer/fix_joined_date', () => ({
    joinedAtFixer: mocks.joinedAtFixer,
}));
vi.mock('@/features/admin/unique_channel_settings/unique_channel_settings_handler', () => ({
    uniqueChannelSettingsHandler: mocks.uniqueChannelSettingsHandler,
}));
vi.mock('@/features/admin/unique_role_settings/unique_role_settings_handler', () => ({
    uniqueRoleSettingsHandler: mocks.uniqueRoleSettingsHandler,
}));
vi.mock('@/features/recruit/interactions/close_recruit/close_command', () => ({
    closeCommand: mocks.closeCommand,
}));
vi.mock('@/features/recruit/create/anarchy_recruit', () => ({
    anarchyRecruit: mocks.anarchyRecruit,
}));
vi.mock('@/features/recruit/create/button_recruit', () => ({
    buttonRecruit: mocks.buttonRecruit,
}));
vi.mock('@/features/recruit/create/event_recruit', () => ({
    eventRecruit: mocks.eventRecruit,
}));
vi.mock('@/features/recruit/create/fest_recruit', () => ({
    festRecruit: mocks.festRecruit,
}));
vi.mock('@/features/recruit/create/other_game_recruit', () => ({
    otherGameRecruit: mocks.otherGameRecruit,
}));
vi.mock('@/features/recruit/create/private_recruit', () => ({
    privateRecruit: mocks.privateRecruit,
}));
vi.mock('@/features/recruit/create/raiders_recruit', () => ({
    raidersRecruit: mocks.raidersRecruit,
}));
vi.mock('@/features/recruit/create/regular_recruit', () => ({
    regularRecruit: mocks.regularRecruit,
}));
vi.mock('@/features/recruit/create/salmon_recruit', () => ({
    salmonRecruit: mocks.salmonRecruit,
}));
vi.mock('@/features/utils/other/experience', () => ({
    handleIkabuExperience: mocks.handleIkabuExperience,
}));
vi.mock('@/features/utils/other/friendcode', () => ({
    handleFriendCode: mocks.handleFriendCode,
}));
vi.mock('@/features/utils/other/help', () => ({ handleHelp: mocks.handleHelp }));
vi.mock('@/features/utils/other/kansen', () => ({ handleKansen: mocks.handleKansen }));
vi.mock('@/features/utils/other/pick', () => ({ handlePick: mocks.handlePick }));
vi.mock('@/features/utils/other/timer', () => ({ handleTimer: mocks.handleTimer }));
vi.mock('@/features/utils/other/wiki', () => ({ handleWiki: mocks.handleWiki }));
vi.mock('@/features/utils/splat3/buki', () => ({ handleBuki: mocks.handleBuki }));
vi.mock('@/features/utils/splat3/show', () => ({ handleShow: mocks.handleShow }));
vi.mock('@/features/utils/team_divider/divider', () => ({
    dividerInitialMessage: mocks.dividerInitialMessage,
}));
vi.mock('@/features/utils/voice/tts/discordjs_voice', () => ({
    handleTTSCommand: mocks.handleTTSCommand,
}));
vi.mock('@/features/utils/voice/voice_locker', () => ({ voiceLocker: mocks.voiceLocker }));
vi.mock('@/features/utils/voice/voice_mention', () => ({
    voiceMention: mocks.voiceMention,
}));
vi.mock('@/features/utils/voice/vpick', () => ({ handleVoicePick: mocks.handleVoicePick }));
vi.mock('@/features/admin/ban/ban', () => ({ handleBan: mocks.handleBan }));
vi.mock('@/infra/logging/command_log', () => ({ sendCommandLog: mocks.sendCommandLog }));
vi.mock('@/infra/logging/send_error_logs', () => ({ sendErrorLogs: mocks.sendErrorLogs }));

import { commandNames } from '@/config/constants/commands';

import { call } from '../src/app/handlers/command_handler';

const cases: [string, string][] = [
    ['shutdown', 'shutdown'],
    ['vclock', 'voiceLocker'],
    ['close', 'closeCommand'],
    ['team_divider', 'dividerInitialMessage'],
    ['regular', 'regularRecruit'],
    ['anarchy', 'anarchyRecruit'],
    ['event', 'eventRecruit'],
    ['salmon', 'salmonRecruit'],
    ['raiders', 'raidersRecruit'],
    ['fesA', 'festRecruit'],
    ['fesB', 'festRecruit'],
    ['fesC', 'festRecruit'],
    ['other_game', 'otherGameRecruit'],
    ['private', 'privateRecruit'],
    ['buttonRecruit', 'buttonRecruit'],
    ['voiceChannelMention', 'voiceMention'],
    ['channelSetting', 'channelSettingsHandler'],
    ['uniqueChannelSetting', 'uniqueChannelSettingsHandler'],
    ['uniqueRoleSetting', 'uniqueRoleSettingsHandler'],
    ['variablesSettings', 'variablesHandler'],
    ['voice_pick', 'handleVoicePick'],
    ['ban', 'handleBan'],
    ['joinedDateFixer', 'joinedAtFixer'],
    ['festivalSettings', 'festSettingHandler'],
    ['experience', 'handleIkabuExperience'],
    ['voice', 'handleTTSCommand'],
    ['ch_manager', 'channelManagerHandler'],
    ['friend_code', 'handleFriendCode'],
    ['wiki', 'handleWiki'],
    ['kansen', 'handleKansen'],
    ['timer', 'handleTimer'],
    ['pick', 'handlePick'],
    ['buki', 'handleBuki'],
    ['show', 'handleShow'],
    ['help', 'handleHelp'],
];

describe('command_handler dispatch', () => {
    beforeEach(() => vi.clearAllMocks());

    it.each(cases)('%s を正しいハンドラへ1回dispatchする', async (commandKey, handler) => {
        const interaction = {
            commandName: commandNames[commandKey as keyof typeof commandNames],
            replied: false,
            deferred: false,
            channel: { isDMBased: () => false },
            inCachedGuild: () => true,
        };
        await call(interaction as never);
        expect(mocks[handler]).toHaveBeenCalledTimes(1);
        expect(
            names
                .filter((name) => name !== handler)
                .every((name) => mocks[name].mock.calls.length === 0),
        ).toBe(true);
    });

    it('返信済みのボイスロックは再dispatchしない', async () => {
        await call({
            commandName: commandNames.vclock,
            replied: true,
            deferred: false,
            inCachedGuild: () => true,
            channel: null,
        } as never);
        expect(mocks.voiceLocker).not.toHaveBeenCalled();
    });
});
