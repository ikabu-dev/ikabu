import { ChatInputCommandInteraction, ModalSubmitInteraction } from 'discord.js';

import { arrangeCommandRecruitData } from '@/features/recruit/create/common/arrange_command_data';
import { arrangeModalRecruitData } from '@/features/recruit/create/common/arrange_modal_data';
import { registerRecruitData } from '@/features/recruit/create/common/register_recruit_data';
import { removeDeleteButton } from '@/features/recruit/create/common/remove_delete_button';
import {
    sendRecruitCanvas,
    RecruitImageBuffers,
    RecruitImageBuffersWithoutRule,
} from '@/features/recruit/create/common/send_recruit_message';
import { RecruitData } from '@/features/recruit/domain/types/recruit_data';
import { sendRecruitSticky } from '@/features/recruit/sticky/recruit_sticky_messages';
import { createRecruitEvent } from '@/features/recruit/vc_reservation/recruit_event';
import { RecruitType } from '@/infra/db/repositories/recruit_service';
import { assertExistCheck, exists, notExists } from '@/shared/assert';
import { sleep } from '@/shared/sleep';

/** 募集を開始してから自動で〆るまでの時間 */
const AUTO_CLOSE_AFTER_SEC = 7200;

/** 募集を開始できるインタラクション（スラッシュコマンド、または募集ボタンから開くモーダル） */
export type RecruitCreateInteraction =
    ChatInputCommandInteraction<'cached'> | ModalSubmitInteraction<'cached' | 'raw'>;

/** 募集種別ごとの前処理の結果 */
export type RecruitPreparation<TContext> = {
    recruitType: RecruitType;
    /** 参加者を募るメンションの宛先。ロールが未設定の場合は null */
    recruitRoleId: string | null;
    /** 後続の工程に引き継ぐ募集種別固有の値（ウデマエ・フェスのチームロールなど） */
    context: TContext;
};

/** 募集カード生成の結果 */
export type RecruitBuild = {
    imageBuffers: RecruitImageBuffers | RecruitImageBuffersWithoutRule;
    /** VC予約イベントのサムネイルに使う画像 */
    eventImage: Buffer;
    eventStartTime: Date;
    /** 終了時刻が定まらない募集（バイト・レイダース）では省略する */
    eventEndTime?: Date;
    /** Recruit テーブルの option 列に保存する値（ウデマエ・チーム名・イベント名など） */
    option: string | null;
};

/**
 * 募集種別ごとの差分。
 * これ以外の工程（整形 → 送信 → イベント作成 → DB登録 → sticky更新 → 自動締切）は
 * すべて createRecruit() が持つ。
 */
export type RecruitSpec<TContext> = {
    /** 募集文に表示する募集名（例: 'ナワバリ募集'） */
    recruitName: string;
    /** VC予約イベント名の接頭辞（例: 'レギュラーマッチ'） */
    eventName: string;
    /** 2時間後に参加ボタンを自動で無効化するか */
    autoClose: boolean;
    /**
     * メンション先ロールと募集種別を決める前処理。
     * null を返すと募集を中断する（ユーザーへの通知は実装側で行う）。
     */
    prepare: (
        interaction: RecruitCreateInteraction,
    ) => Promise<RecruitPreparation<TContext> | null>;
    /** RecruitData への整形。省略時はコマンド／モーダル共通の整形処理を使う */
    arrange?: (
        interaction: RecruitCreateInteraction,
        recruitName: string,
        recruitType: RecruitType,
    ) => Promise<RecruitData>;
    /** 募集カードとルール画像の生成 */
    build: (
        recruitData: RecruitData,
        preparation: RecruitPreparation<TContext>,
    ) => Promise<RecruitBuild>;
};

export async function createRecruit<TContext>(
    interaction: RecruitCreateInteraction,
    spec: RecruitSpec<TContext>,
): Promise<void> {
    assertExistCheck(interaction.channel, 'channel');
    // 'インタラクションに失敗'が出ないようにするため
    await interaction.deferReply({});

    const preparation = await spec.prepare(interaction);
    if (notExists(preparation)) return;

    const arrange = spec.arrange ?? arrangeRecruitData;

    let recruitData: RecruitData;
    if (interaction.isChatInputCommand() || interaction.isModalSubmit()) {
        try {
            recruitData = await arrange(interaction, spec.recruitName, preparation.recruitType);
        } catch (error) {
            // ユーザーへの通知は整形処理側で行っているため、ここでは中断するだけ
            return;
        }
    } else {
        throw new Error('interaction type is invalid');
    }

    const build = await spec.build(recruitData, preparation);

    const recruitMessageList = await sendRecruitCanvas(
        interaction,
        preparation.recruitRoleId,
        recruitData,
        build.imageBuffers,
    );

    let eventId: string | null = null;
    if (exists(recruitData.voiceChannel)) {
        eventId = (
            await createRecruitEvent(
                recruitData.guild,
                `${spec.eventName} - ${recruitData.recruiter.displayName}`,
                recruitData.recruiter.userId,
                recruitData.voiceChannel,
                build.eventImage,
                build.eventStartTime,
                build.eventEndTime,
            )
        ).id;
    }

    await registerRecruitData(
        recruitMessageList.recruitMessage.id,
        preparation.recruitType,
        recruitData,
        eventId,
        build.option,
        // 自動締切の期限を DB に持たせる。以前はここから2時間 sleep して〆ていたため、
        // デプロイや再起動のたびに進行中の募集の締切が消滅していた。
        // 実際に〆るのは recruit_close_job の定期スキャン。
        spec.autoClose ? new Date(Date.now() + AUTO_CLOSE_AFTER_SEC * 1000) : null,
        recruitMessageList.buttonMessage.id,
    );

    // 募集リスト更新
    await sendRecruitSticky({
        channelOpt: { guild: recruitData.guild, channelId: recruitData.recruitChannel.id },
    });

    // 15秒後に削除ボタンを消す
    await sleep(15);

    await removeDeleteButton(recruitData, recruitMessageList.deleteButtonMessage.id);
}

async function arrangeRecruitData(
    interaction: RecruitCreateInteraction,
    recruitName: string,
    recruitType: RecruitType,
): Promise<RecruitData> {
    if (interaction.isChatInputCommand()) {
        return await arrangeCommandRecruitData(interaction, recruitName, recruitType);
    }
    return await arrangeModalRecruitData(interaction, recruitName, recruitType);
}

/** RecruitData から Canvas に渡す VC 名を取り出す */
export function voiceChannelName(recruitData: RecruitData): string | null {
    return recruitData.voiceChannel ? recruitData.voiceChannel.name : null;
}
