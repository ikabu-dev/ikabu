import { ChatInputCommandInteraction, ModalSubmitInteraction } from 'discord.js';

import { assertExistCheck, exists, sleep } from '@/app/common/others';
import { recruitAutoClose } from '@/app/feat-recruit/close_recruit/auto_close';
import { RecruitData } from '@/app/feat-recruit/common/types/recruit_data';
import { sendRecruitSticky } from '@/app/feat-recruit/sticky/recruit_sticky_messages';
import { createRecruitEvent } from '@/app/feat-recruit/vc_reservation/recruit_event';
import { RecruitType } from '@/db/recruit_service';

import { registerRecruitData } from './register_recruit_data';
import { removeDeleteButton } from './remove_delete_button';
import { RecruitImageBuffers, sendRecruitCanvas } from './send_recruit_message';

export type RecruitInteraction =
    ChatInputCommandInteraction<'cached'> | ModalSubmitInteraction<'cached' | 'raw'>;

export type RecruitFlowContext = {
    recruitType: RecruitType;
    recruitRoleId: string | null;
};

export type RecruitEventTiming = {
    title: string;
    startTime: Date;
    endTime?: Date;
};

export type RecruitArrangement<TContext extends RecruitFlowContext> = {
    recruitData: RecruitData;
    context: TContext;
};

/*
 * schedule 連動型募集（regular / anarchy / event / salmon / fest）に共通する骨格。
 * コマンド/モーダル別の分岐・データ整形・エラー処理は各募集固有のため
 * resolveArrangement に委譲し、既存の挙動をそのまま保存する。
 */
export type RecruitFlowConfig<TMatchData, TContext extends RecruitFlowContext> = {
    resolveArrangement: (
        interaction: RecruitInteraction,
    ) => Promise<RecruitArrangement<TContext> | null>;
    getMatchData: (recruitData: RecruitData, context: TContext) => Promise<TMatchData>;
    getImageBuffers: (
        recruitData: RecruitData,
        matchData: TMatchData,
        context: TContext,
    ) => Promise<RecruitImageBuffers>;
    getEventTiming: (
        recruitData: RecruitData,
        matchData: TMatchData,
        context: TContext,
    ) => RecruitEventTiming;
    getRegisterOption: (
        recruitData: RecruitData,
        matchData: TMatchData,
        context: TContext,
    ) => string | null;
    // 2時間後の自動クローズを行うか（サーモンラン系は行わない）
    autoClose: boolean;
};

export async function executeRecruitFlow<TMatchData, TContext extends RecruitFlowContext>(
    interaction: RecruitInteraction,
    config: RecruitFlowConfig<TMatchData, TContext>,
) {
    assertExistCheck(interaction.channel, 'channel');
    // 'インタラクションに失敗'が出ないようにするため
    await interaction.deferReply({});

    const arrangement = await config.resolveArrangement(interaction);
    if (arrangement === null) return;
    const { recruitData, context } = arrangement;

    const matchData = await config.getMatchData(recruitData, context);
    const buffers = await config.getImageBuffers(recruitData, matchData, context);

    const recruitMessageList = await sendRecruitCanvas(
        interaction,
        context.recruitRoleId,
        recruitData,
        buffers,
    );

    let eventId: string | null = null;
    if (exists(recruitData.voiceChannel)) {
        const timing = config.getEventTiming(recruitData, matchData, context);
        eventId = (
            await createRecruitEvent(
                recruitData.guild,
                timing.title,
                recruitData.recruiter.userId,
                recruitData.voiceChannel,
                buffers.ruleBuffer,
                timing.startTime,
                timing.endTime,
            )
        ).id;
    }

    await registerRecruitData(
        recruitMessageList.recruitMessage.id,
        context.recruitType,
        recruitData,
        eventId,
        config.getRegisterOption(recruitData, matchData, context),
    );

    // 募集リスト更新
    await sendRecruitSticky({
        channelOpt: { guild: recruitData.guild, channelId: recruitData.recruitChannel.id },
    });

    // 15秒後に削除ボタンを消す
    await sleep(15);

    await removeDeleteButton(recruitData, recruitMessageList.deleteButtonMessage.id);

    if (config.autoClose) {
        // 2時間後にボタンを無効化する
        await sleep(7200 - 15);

        await recruitAutoClose(
            recruitData,
            recruitMessageList.recruitMessage.id,
            recruitMessageList.buttonMessage,
        );
    }
}
