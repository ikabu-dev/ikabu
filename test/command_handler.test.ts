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

vi.mock('../src/app/feat-admin/shutdown/shutdown_process', () => ({ shutdown: mocks.shutdown }));
vi.mock('../src/app/feat-admin/channel_manager/channel_manager_handler.js', () => ({
    channelManagerHandler: mocks.channelManagerHandler,
}));
vi.mock('../src/app/feat-admin/channel_settings/channel_settings_handler.js', () => ({
    channelSettingsHandler: mocks.channelSettingsHandler,
}));
vi.mock('../src/app/feat-admin/environment_variables/variables_handler', () => ({
    variablesHandler: mocks.variablesHandler,
}));
vi.mock('../src/app/feat-admin/fest_setting/fest_settings.js', () => ({
    festSettingHandler: mocks.festSettingHandler,
}));
vi.mock('../src/app/feat-admin/joined_date_fixer/fix_joined_date.js', () => ({
    joinedAtFixer: mocks.joinedAtFixer,
}));
vi.mock('../src/app/feat-admin/unique_channel_settings/unique_channel_settings_handler.js', () => ({
    uniqueChannelSettingsHandler: mocks.uniqueChannelSettingsHandler,
}));
vi.mock('../src/app/feat-admin/unique_role_settings/unique_role_settings_handler.js', () => ({
    uniqueRoleSettingsHandler: mocks.uniqueRoleSettingsHandler,
}));
vi.mock('../src/app/feat-recruit/close_recruit/close_command.js', () => ({
    closeCommand: mocks.closeCommand,
}));
vi.mock('../src/app/feat-recruit/create_recruit/anarchy_recruit.js', () => ({
    anarchyRecruit: mocks.anarchyRecruit,
}));
vi.mock('../src/app/feat-recruit/create_recruit/button_recruit.js', () => ({
    buttonRecruit: mocks.buttonRecruit,
}));
vi.mock('../src/app/feat-recruit/create_recruit/event_recruit.js', () => ({
    eventRecruit: mocks.eventRecruit,
}));
vi.mock('../src/app/feat-recruit/create_recruit/fest_recruit.js', () => ({
    festRecruit: mocks.festRecruit,
}));
vi.mock('../src/app/feat-recruit/create_recruit/other_game_recruit', () => ({
    otherGameRecruit: mocks.otherGameRecruit,
}));
vi.mock('../src/app/feat-recruit/create_recruit/private_recruit', () => ({
    privateRecruit: mocks.privateRecruit,
}));
vi.mock('../src/app/feat-recruit/create_recruit/raiders_recruit.js', () => ({
    raidersRecruit: mocks.raidersRecruit,
}));
vi.mock('../src/app/feat-recruit/create_recruit/regular_recruit.js', () => ({
    regularRecruit: mocks.regularRecruit,
}));
vi.mock('../src/app/feat-recruit/create_recruit/salmon_recruit.js', () => ({
    salmonRecruit: mocks.salmonRecruit,
}));
vi.mock('../src/app/feat-utils/other/experience.js', () => ({
    handleIkabuExperience: mocks.handleIkabuExperience,
}));
vi.mock('../src/app/feat-utils/other/friendcode', () => ({
    handleFriendCode: mocks.handleFriendCode,
}));
vi.mock('../src/app/feat-utils/other/help.js', () => ({ handleHelp: mocks.handleHelp }));
vi.mock('../src/app/feat-utils/other/kansen.js', () => ({ handleKansen: mocks.handleKansen }));
vi.mock('../src/app/feat-utils/other/pick.js', () => ({ handlePick: mocks.handlePick }));
vi.mock('../src/app/feat-utils/other/timer.js', () => ({ handleTimer: mocks.handleTimer }));
vi.mock('../src/app/feat-utils/other/wiki.js', () => ({ handleWiki: mocks.handleWiki }));
vi.mock('../src/app/feat-utils/splat3/buki', () => ({ handleBuki: mocks.handleBuki }));
vi.mock('../src/app/feat-utils/splat3/show', () => ({ handleShow: mocks.handleShow }));
vi.mock('../src/app/feat-utils/team_divider/divider', () => ({
    dividerInitialMessage: mocks.dividerInitialMessage,
}));
vi.mock('../src/app/feat-utils/voice/tts/discordjs_voice', () => ({
    handleTTSCommand: mocks.handleTTSCommand,
}));
vi.mock('../src/app/feat-utils/voice/voice_locker', () => ({ voiceLocker: mocks.voiceLocker }));
vi.mock('../src/app/feat-utils/voice/voice_mention.js', () => ({
    voiceMention: mocks.voiceMention,
}));
vi.mock('../src/app/feat-utils/voice/vpick.js', () => ({ handleVoicePick: mocks.handleVoicePick }));
vi.mock('../src/app/feat-admin/ban/ban', () => ({ handleBan: mocks.handleBan }));
vi.mock('../src/app/logs/commands/command_log', () => ({ sendCommandLog: mocks.sendCommandLog }));
vi.mock('../src/app/logs/error/send_error_logs.js', () => ({ sendErrorLogs: mocks.sendErrorLogs }));

import { call } from '../src/app/handlers/command_handler';
import { commandNames } from '../src/constant';

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
