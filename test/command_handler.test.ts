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

vi.mock('@/features/shutdown/shutdown_process', () => ({ shutdown: mocks.shutdown }));
vi.mock('@/features/channel_manager/channel_manager_handler', () => ({
    channelManagerHandler: mocks.channelManagerHandler,
}));
vi.mock('@/features/channel_settings/channel_settings_handler', () => ({
    channelSettingsHandler: mocks.channelSettingsHandler,
}));
vi.mock('@/features/environment_variables/variables_handler', () => ({
    variablesHandler: mocks.variablesHandler,
}));
vi.mock('@/features/fest_setting/fest_settings', () => ({
    festSettingHandler: mocks.festSettingHandler,
}));
vi.mock('@/features/joined_date_fixer/fix_joined_date', () => ({
    joinedAtFixer: mocks.joinedAtFixer,
}));
vi.mock('@/features/unique_channel_settings/unique_channel_settings_handler', () => ({
    uniqueChannelSettingsHandler: mocks.uniqueChannelSettingsHandler,
}));
vi.mock('@/features/unique_role_settings/unique_role_settings_handler', () => ({
    uniqueRoleSettingsHandler: mocks.uniqueRoleSettingsHandler,
}));
vi.mock('@/features/recruit/interactions/close_recruit/close_by_command', () => ({
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
vi.mock('@/features/experience/experience', () => ({
    handleIkabuExperience: mocks.handleIkabuExperience,
}));
vi.mock('@/features/friend_code/friendcode', () => ({
    handleFriendCode: mocks.handleFriendCode,
}));
vi.mock('@/features/help/help', () => ({ handleHelp: mocks.handleHelp }));
vi.mock('@/features/kansen/kansen', () => ({ handleKansen: mocks.handleKansen }));
vi.mock('@/features/pick/pick', () => ({ handlePick: mocks.handlePick }));
vi.mock('@/features/timer/timer', () => ({ handleTimer: mocks.handleTimer }));
vi.mock('@/features/wiki/wiki', () => ({ handleWiki: mocks.handleWiki }));
vi.mock('@/features/buki/buki', () => ({ handleBuki: mocks.handleBuki }));
vi.mock('@/features/stage_info/show', () => ({ handleShow: mocks.handleShow }));
vi.mock('@/features/team_divider/divider', () => ({
    dividerInitialMessage: mocks.dividerInitialMessage,
}));
vi.mock('@/features/voice/tts/discordjs_voice', () => ({
    handleTTSCommand: mocks.handleTTSCommand,
}));
vi.mock('@/features/voice/voice_locker', () => ({ voiceLocker: mocks.voiceLocker }));
vi.mock('@/features/voice/voice_mention', () => ({
    voiceMention: mocks.voiceMention,
}));
vi.mock('@/features/voice/vpick', () => ({ handleVoicePick: mocks.handleVoicePick }));
vi.mock('@/features/ban/ban', () => ({ handleBan: mocks.handleBan }));
vi.mock('@/infra/logging/command_log', () => ({ sendCommandLog: mocks.sendCommandLog }));
vi.mock('@/infra/logging/send_error_logs', () => ({ sendErrorLogs: mocks.sendErrorLogs }));

import { call } from '@/gateway/command_handler';

// [Discord に登録されるコマンド名, dispatch されるべきハンドラ]
const cases: [string, string][] = [
    ['shutdown', 'shutdown'],
    ['ボイスロック', 'voiceLocker'],
    ['close', 'closeCommand'],
    ['チーム分け', 'dividerInitialMessage'],
    ['ナワバリ募集', 'regularRecruit'],
    ['バンカラ募集', 'anarchyRecruit'],
    ['イベマ募集', 'eventRecruit'],
    ['サーモンラン募集', 'salmonRecruit'],
    ['レイダース募集', 'raidersRecruit'],
    ['フウカ陣営', 'festRecruit'],
    ['マンタロー陣営', 'festRecruit'],
    ['ウツホ陣営', 'festRecruit'],
    ['別ゲー募集', 'otherGameRecruit'],
    ['プラベ募集', 'privateRecruit'],
    ['募集ボタン', 'buttonRecruit'],
    ['ボイスメンション', 'voiceMention'],
    ['チャンネル設定', 'channelSettingsHandler'],
    ['固有チャンネル設定', 'uniqueChannelSettingsHandler'],
    ['固有ロール設定', 'uniqueRoleSettingsHandler'],
    ['環境変数設定', 'variablesHandler'],
    ['vpick', 'handleVoicePick'],
    ['ban', 'handleBan'],
    ['入部日修正', 'joinedAtFixer'],
    ['フェスカテゴリ設定', 'festSettingHandler'],
    ['イカ部歴', 'handleIkabuExperience'],
    ['voice', 'handleTTSCommand'],
    ['ch_management', 'channelManagerHandler'],
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

    it.each(cases)('%s を正しいハンドラへ1回dispatchする', async (commandName, handler) => {
        const interaction = {
            commandName,
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
            commandName: 'ボイスロック',
            replied: true,
            deferred: false,
            inCachedGuild: () => true,
            channel: null,
        } as never);
        expect(mocks.voiceLocker).not.toHaveBeenCalled();
    });
});
