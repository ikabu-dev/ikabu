import { Collection, ComponentType, MessageFlags, ModalSubmitFields } from 'discord.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RecruitParam } from '@/config/constants/button_id';
import { createRecruitEditor } from '@/features/recruit/interactions/edit_recruit/recruit_editor';
import { recruitButtonHandler } from '@/features/recruit/interactions/recruit_button_handler';
import { RecruitAlertTexts } from '@/features/recruit/ui/alert_texts/alert_texts';
import { call as submitModal } from '@/gateway/modal_handler';
import { RecruitType } from '@/infra/db/repositories/recruit_service';

import type {
    ButtonInteraction,
    MessageContextMenuCommandInteraction,
    ModalBuilder,
    ModalSubmitInteraction,
} from 'discord.js';

const mock = vi.hoisted(() => ({
    channelId: vi.fn(),
    roleId: vi.fn(),
    getSchedule: vi.fn(),
    checkFes: vi.fn(),
    getXMatchList: vi.fn(),
    getXMatchData: vi.fn(),
    fallback: false,
    warn: vi.fn(),
    errors: vi.fn(),
    canvas: vi.fn(),
    ruleCanvas: vi.fn(),
    registerRecruit: vi.fn(),
    getRecruit: vi.fn(),
    updateCondition: vi.fn(),
    updateRecruitNum: vi.fn(),
    createEvent: vi.fn(),
    refreshSticky: vi.fn(),
    rawSticky: vi.fn(),
    regenerate: vi.fn(),
    registerPartner: vi.fn(),
    participants: vi.fn(),
    deleteParticipant: vi.fn(),
    notifyJoin: vi.fn(),
    notifyCancel: vi.fn(),
    readMessage: vi.fn(),
}));

vi.mock('@/infra/db/repositories/unique_channel_service', () => ({
    UniqueChannelService: { getChannelIdByKey: mock.channelId },
}));
vi.mock('@/infra/db/repositories/unique_role_service', () => ({
    UniqueRoleService: { getRoleIdByKey: mock.roleId },
}));
vi.mock('@/infra/db/repositories/member_service', () => ({
    MemberService: { createDummyUser: vi.fn() },
}));
vi.mock('@/infra/db/repositories/recruit_service', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    RecruitService: {
        getRecruit: mock.getRecruit,
        updateCondition: mock.updateCondition,
        updateRecruitNum: mock.updateRecruitNum,
    },
}));
vi.mock('@/infra/db/repositories/participant_service', () => ({
    ParticipantService: {
        getAllParticipants: mock.participants,
        getParticipant: vi.fn(async () => (await mock.participants())[1]),
        registerXMatchPartner: mock.registerPartner,
        deleteParticipant: mock.deleteParticipant,
    },
}));
vi.mock('@/infra/external/splatoon3-ink/splatoon3_ink', () => ({
    getSchedule: mock.getSchedule,
    checkFes: mock.checkFes,
    getXMatchList: mock.getXMatchList,
    getXMatchData: mock.getXMatchData,
    get inFallbackMode() {
        return mock.fallback;
    },
}));
vi.mock('@/infra/logging/log4js', () => ({
    log4js_obj: { getLogger: () => ({ warn: mock.warn }) },
}));
vi.mock('@/infra/logging/send_error_logs', () => ({ sendErrorLogs: mock.errors }));
vi.mock('@/infra/logging/recruit_modal_log', () => ({
    sendRecruitModalLog: vi.fn(),
    sendEditRecruitLog: vi.fn(),
}));
vi.mock('@/infra/logging/recruit_button_log', () => ({ sendRecruitButtonLog: vi.fn() }));
vi.mock('@/features/recruit/ui/canvases/anarchy_canvas', () => ({
    recruitAnarchyCanvas: mock.canvas,
    ruleAnarchyCanvas: mock.ruleCanvas,
}));
vi.mock('@/features/recruit/ui/canvases/regenerate_canvas', () => ({
    RecruitOpCode: { open: 0, close: 1, cancel: 2 },
    regenerateCanvas: mock.regenerate,
}));
vi.mock('@/features/recruit/create/common/register_recruit_data', () => ({
    registerRecruitData: mock.registerRecruit,
}));
vi.mock('@/features/recruit/create/common/remove_delete_button', () => ({
    removeDeleteButton: vi.fn(),
}));
vi.mock('@/features/recruit/vc_reservation/recruit_event', () => ({
    createRecruitEvent: mock.createEvent,
}));
vi.mock('@/features/recruit/sticky/recruit_sticky_messages', () => ({
    sendRecruitSticky: mock.refreshSticky,
    availableRecruitString: vi.fn(),
    getStickyChannelId: vi.fn(),
}));
vi.mock('@/features/recruit/common/send_notify_to_host', () => ({
    sendJoinNotifyToHost: mock.notifyJoin,
    sendCancelNotifyToHost: mock.notifyCancel,
}));
vi.mock('@/shared/discord_helpers/sticky_message', () => ({ sendStickyMessage: mock.rawSticky }));
vi.mock('@/shared/discord_helpers/message_manager', () => ({
    searchMessageById: mock.readMessage,
}));
vi.mock('@/shared/discord_helpers/member_manager', () => ({
    searchAPIMemberById: vi.fn(async (_guild, id) => ({ id, voice: { channel: null } })),
    searchDBMemberById: vi.fn(async (_guild, id) => ({
        userId: id,
        mention: `<@${id}>`,
        displayName: id,
        iconUrl: 'https://example.com/avatar.png',
    })),
}));
vi.mock('@/shared/sleep', () => ({ sleep: vi.fn() }));

const guild = { id: 'guild', scheduledEvents: { fetch: vi.fn() }, channels: { fetch: vi.fn() } };
const host = { userId: 'host', userType: 0, member: { mention: '<@host>' } };
const partner = { userId: 'partner', userType: 2, member: { mention: '<@partner>' } };
const recruit = {
    authorId: host.userId,
    channelId: 'x-channel',
    messageId: 'card',
    recruitType: RecruitType.XMatchRecruit,
    recruitNum: 1,
    condition: 'なし',
};
const match = {
    rule: 'ガチアサリ',
    startTime: new Date('2026-12-01T14:00:00Z'),
    endTime: new Date('2026-12-01T16:00:00Z'),
};

function message(id: string, content = '') {
    const value = {
        id,
        content,
        components: [],
        inGuild: () => true,
        edit: vi.fn(),
        reply: vi.fn(),
    };
    value.edit.mockResolvedValue(value);
    return value;
}

function modal({
    channelId = recruit.channelId,
    band = '2000未満',
    voiceChannel,
    customId = 'recm=xrec',
    condition = '',
}: {
    channelId?: string;
    band?: string;
    voiceChannel?: {
        id: string;
        name: string;
        type: number;
        guild: typeof guild;
        members: Collection<string, unknown>;
    };
    customId?: string;
    condition?: string;
} = {}) {
    const messages = [message('rules'), message('actions'), message('delete')];
    const channel = { id: channelId, send: vi.fn(), isSendable: () => true };
    messages.forEach((entry) => channel.send.mockResolvedValueOnce(entry));
    const fields = new (
        ModalSubmitFields as unknown as new (components: unknown[]) => ModalSubmitFields
    )([
        {
            component: {
                customId: 'scheduleNum',
                type: ComponentType.StringSelect,
                values: ['next'],
            },
        },
        { component: { customId: 'xPowerBand', type: ComponentType.StringSelect, values: [band] } },
        {
            components: [
                { customId: 'condition', type: ComponentType.TextInput, value: condition },
            ],
        },
        {
            component: {
                customId: 'voiceChannel',
                type: ComponentType.ChannelSelect,
                channels: voiceChannel && new Collection([[voiceChannel.id, voiceChannel]]),
            },
        },
    ]);
    const input = {
        customId,
        channel,
        channelId,
        inGuild: () => true,
        isChatInputCommand: () => false,
        isModalSubmit: () => true,
        guild,
        guildId: guild.id,
        member: { user: { id: host.userId } },
        deferReply: vi.fn(),
        reply: vi.fn(),
        editReply: vi.fn().mockResolvedValue(message('card')),
        followUp: vi.fn(),
        deleteReply: vi.fn(),
        fields,
    };
    return { input, submit: () => submitModal(input as unknown as ModalSubmitInteraction) };
}

function button(parameter: RecruitParam, userId = partner.userId) {
    const params = new URLSearchParams({ d: parameter, imid1: recruit.messageId });
    const channel = { id: recruit.channelId, send: vi.fn(), isTextBased: () => true };
    const input = {
        customId: params.toString(),
        guild,
        channel,
        member: { user: { id: userId } },
        message: message('actions', '<@&x-role> ボタンを押して参加表明するでし！'),
        update: vi.fn(),
        editReply: vi.fn(),
        followUp: vi.fn(),
        showModal: vi.fn<(modal: ModalBuilder) => void>(),
    };
    return {
        input,
        run: (buttonParams = params) =>
            recruitButtonHandler(
                input as unknown as ButtonInteraction<'cached'>,
                parameter,
                buttonParams,
            ),
    };
}

beforeEach(() => {
    vi.resetAllMocks();
    mock.channelId.mockResolvedValue(recruit.channelId);
    mock.roleId.mockResolvedValue('x-role');
    mock.getSchedule.mockResolvedValue({});
    mock.checkFes.mockReturnValue(false);
    mock.getXMatchList.mockReturnValue([{}, { xMatchSetting: {} }]);
    mock.getXMatchData.mockResolvedValue(match);
    mock.fallback = false;
    mock.canvas.mockResolvedValue(Buffer.from('recruit'));
    mock.ruleCanvas.mockResolvedValue(Buffer.from('rule'));
    mock.getRecruit.mockResolvedValue(recruit);
    mock.participants.mockResolvedValue([host, partner]);
    guild.scheduledEvents.fetch.mockResolvedValue([]);
});

describe('Xマッチ募集のモーダル', () => {
    it('募集ボタンからフォームを開いて、任意項目が空のまま次の枠を募集できる', async () => {
        const create = button(RecruitParam.NewModalRecruit);
        await create.run(new URLSearchParams({ cn: 'Xマッチ募集' }));
        const [form] = create.input.showModal.mock.calls[0];
        expect(form.toJSON().custom_id).toBe('recm=xrec');

        const { input, submit } = modal();
        await submit();
        expect(mock.getXMatchData).toHaveBeenCalledWith({}, 1);
        expect(input.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining('ガチアサリ** ｜ Xパワー 2000未満'),
            }),
        );
        expect(input.channel.send).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ content: expect.stringMatching(/^<@&x-role>/) }),
        );
        expect(mock.registerRecruit).toHaveBeenCalledWith(
            'card',
            RecruitType.XMatchRecruit,
            expect.objectContaining({ count: 2, recruitNum: 1, condition: 'なし' }),
            null,
            '2000未満',
            match.endTime,
            'actions',
        );
        expect(mock.createEvent).not.toHaveBeenCalled();
        expect(mock.errors).not.toHaveBeenCalled();
    });

    it('VC指定時は選んだXマッチの時間帯で予約する', async () => {
        const voice = {
            id: 'voice',
            name: 'alfa',
            type: 2,
            guild,
            members: new Collection<string, unknown>(),
        };
        mock.createEvent.mockResolvedValue({ id: 'event' });
        const { submit } = modal({ band: '2000以上', voiceChannel: voice });
        await submit();
        expect(mock.createEvent).toHaveBeenCalledWith(
            guild,
            'Xマッチ - host',
            host.userId,
            voice,
            Buffer.from('rule'),
            match.startTime,
            match.endTime,
        );
        expect(mock.registerRecruit).toHaveBeenCalledWith(
            'card',
            RecruitType.XMatchRecruit,
            expect.anything(),
            'event',
            '2000以上',
            match.endTime,
            'actions',
        );
    });

    it('ロールが未設定ならメンションなしで投稿し、警告を記録する', async () => {
        mock.roleId.mockResolvedValue(null);
        const { input, submit } = modal();
        await submit();
        expect(input.channel.send).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ content: expect.stringMatching(/^ボタンを押して/) }),
        );
        expect(mock.warn).toHaveBeenCalledWith(
            expect.stringContaining('Xマッチ募集ロールが未設定'),
        );
        expect(mock.registerRecruit).toHaveBeenCalledOnce();
    });

    it('募集チャンネル以外からの送信を受け付けない', async () => {
        const { input, submit } = modal({ channelId: 'other' });
        await submit();
        expect(input.reply).toHaveBeenCalledWith({
            content: expect.stringContaining('<#x-channel>'),
            flags: MessageFlags.Ephemeral,
        });
        expect(input.channel.send).not.toHaveBeenCalled();
    });

    it('募集チャンネルが未設定なら設定漏れを案内する', async () => {
        mock.channelId.mockResolvedValue(null);
        const { input, submit } = modal();
        await submit();
        expect(input.reply).toHaveBeenCalledWith({
            content: expect.stringContaining('募集チャンネルが設定されていない'),
            flags: MessageFlags.Ephemeral,
        });
        expect(mock.registerRecruit).not.toHaveBeenCalled();
    });

    it('選択肢にないXパワー帯を受け付けない', async () => {
        const { input, submit } = modal({ band: '2100' });
        await submit();
        expect(input.editReply).toHaveBeenCalledWith(expect.stringContaining('Xパワー帯を選択'));
        expect(mock.registerRecruit).not.toHaveBeenCalled();
    });

    it.each(['festival', 'fallback', 'empty', 'unavailable', 'vc occupied'])(
        '%s の場合は理由を案内して募集を中断する',
        async (scenario) => {
            let expected = '選んだ時間帯のXマッチのルールを取得できなかった';
            if (scenario === 'festival') {
                mock.checkFes.mockReturnValue(true);
                expected = 'フェス中';
            }
            if (scenario === 'fallback') mock.fallback = true;
            if (scenario === 'empty') mock.getXMatchList.mockReturnValue([]);
            if (scenario === 'unavailable') {
                mock.getSchedule.mockResolvedValue(null);
                expected = `<@&x-role>${RecruitAlertTexts.ScheduleLoadError}`;
            }
            const voiceChannel =
                scenario === 'vc occupied'
                    ? {
                          id: 'voice',
                          name: 'alfa',
                          type: 2,
                          guild,
                          members: new Collection<string, unknown>([['other', {}]]),
                      }
                    : undefined;
            if (voiceChannel) expected = RecruitAlertTexts.ChannelAlreadyUsed;
            const { input, submit } = modal({ voiceChannel });
            await submit();
            expect(input.followUp).toHaveBeenCalledWith({
                content: expect.stringContaining(expected),
                flags: MessageFlags.Ephemeral,
            });
            expect(input.channel.send).not.toHaveBeenCalled();
            expect(mock.registerRecruit).not.toHaveBeenCalled();
        },
    );
});

describe('Xマッチの募集後の操作', () => {
    it('相方が参加すると募集カードと参加一覧を更新し、募集主に通知する', async () => {
        mock.participants.mockResolvedValueOnce([host]).mockResolvedValue([host, partner]);
        mock.registerPartner.mockResolvedValue(true);
        const join = button(RecruitParam.Join);
        await join.run();
        expect(mock.registerPartner).toHaveBeenCalledWith(
            guild.id,
            recruit.messageId,
            partner.userId,
        );
        expect(mock.regenerate).toHaveBeenCalledWith(
            guild,
            recruit.channelId,
            recruit.messageId,
            0,
        );
        expect(mock.notifyJoin).toHaveBeenCalledOnce();
        expect(join.input.editReply).toHaveBeenCalledWith(
            expect.objectContaining({ content: expect.stringContaining('[1/1]') }),
        );
    });

    it.each([
        ['host', '募集メンバーは参加表明できない'],
        ['partner', '既に参加ボタンを押してる'],
    ])('%s の重複参加を受け付けない', async (userId, expected) => {
        const join = button(RecruitParam.Join, userId);
        await join.run();
        expect(join.input.followUp).toHaveBeenCalledWith({
            content: expect.stringContaining(expected),
            flags: MessageFlags.Ephemeral,
        });
        expect(mock.registerPartner).not.toHaveBeenCalled();
    });

    it('満員の募集に参加すると案内が出て、参加ボタンは復帰する', async () => {
        const join = button(RecruitParam.Join, 'another-partner');
        mock.registerPartner.mockResolvedValue(false);
        await join.run();
        expect(mock.registerPartner).toHaveBeenCalledWith(
            guild.id,
            recruit.messageId,
            'another-partner',
        );
        expect(join.input.followUp).toHaveBeenCalledWith({
            content: expect.stringContaining('相方が決まった'),
            flags: MessageFlags.Ephemeral,
        });
        expect(join.input.editReply).toHaveBeenCalledOnce();
        expect(mock.notifyJoin).not.toHaveBeenCalled();
    });

    it('応募者本人のキャンセルで相方枠が空き、募集一覧に作成ボタンを残す', async () => {
        const cancel = button(RecruitParam.Cancel);
        mock.participants.mockResolvedValueOnce([host, partner]).mockResolvedValue([host]);
        await cancel.run();
        expect(mock.deleteParticipant).toHaveBeenCalledWith(
            guild.id,
            recruit.messageId,
            partner.userId,
        );
        expect(cancel.input.editReply).toHaveBeenCalledWith(
            expect.objectContaining({ content: expect.stringContaining('[0/1]') }),
        );
        expect(mock.refreshSticky).toHaveBeenCalledWith({
            channelOpt: { guild, channelId: recruit.channelId },
        });
        expect(mock.rawSticky).not.toHaveBeenCalled();
    });

    it('募集主が応募を拒否しても、参加一覧の元の見出しを保持する', async () => {
        const reject = button(RecruitParam.Reject, host.userId);
        reject.input.message.content = '<@host>';
        const participantList = message(
            'actions',
            '<@&x-role> ボタンを押して参加表明するでし！\n[1/1]',
        );
        mock.readMessage
            .mockResolvedValueOnce(message('card'))
            .mockResolvedValueOnce(participantList);
        mock.participants
            .mockResolvedValueOnce([host, partner])
            .mockResolvedValueOnce([host, partner])
            .mockResolvedValue([host]);
        await reject.run(
            new URLSearchParams({
                d: RecruitParam.Reject,
                rid: recruit.messageId,
                mid: 'actions',
                pid: partner.userId,
            }),
        );
        expect(mock.deleteParticipant).toHaveBeenCalledWith(
            guild.id,
            recruit.messageId,
            partner.userId,
        );
        expect(participantList.edit).toHaveBeenCalledWith({
            content: '<@&x-role> ボタンを押して参加表明するでし！\n**【参加表明一覧】**`[0/1]`',
        });
        expect(mock.refreshSticky).toHaveBeenCalledOnce();
    });

    it('募集編集で条件を更新でき、定員は固定される', async () => {
        const showModal = vi.fn<(modal: ModalBuilder) => void>();
        await createRecruitEditor({
            guild,
            targetMessage: { id: recruit.messageId },
            member: { user: { id: host.userId } },
            showModal,
        } as unknown as MessageContextMenuCommandInteraction<'cached'>);
        const definition = showModal.mock.calls[0][0].toJSON();
        expect(JSON.stringify(definition)).not.toContain('"remaining"');

        const { input, submit } = modal({
            customId: definition.custom_id,
            condition: '通話なしで募集',
        });
        await submit();
        expect(mock.updateCondition).toHaveBeenCalledWith(
            guild.id,
            recruit.messageId,
            '通話なしで募集',
        );
        expect(mock.updateRecruitNum).not.toHaveBeenCalled();
        expect(input.editReply).toHaveBeenCalledWith(expect.stringContaining('参加条件を更新'));
        expect(mock.refreshSticky).toHaveBeenCalledOnce();
    });
});
