import { Recruit } from '@prisma/client';
import { DiscordAPIError, Guild, RESTJSONErrorCodes } from 'discord.js';

import { getMemberMentions } from '@/features/recruit/common/member_list';
import { getStickyChannelId } from '@/features/recruit/sticky/recruit_sticky_messages';
import { regenerateCanvas, RecruitOpCode } from '@/features/recruit/ui/canvases/regenerate_canvas';
import { ParticipantService } from '@/infra/db/repositories/participant_service';
import { RecruitService } from '@/infra/db/repositories/recruit_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { exists, notExists } from '@/shared/assert';
import { setButtonDisable } from '@/shared/discord_helpers/button_components';
import { searchMessageById } from '@/shared/discord_helpers/message_manager';

const logger = log4js_obj.getLogger('recruit');

/**
 * 募集を〆た後、どのチャンネルの sticky を更新すべきかを表す。
 *
 * - 'thread': プラベ/別ゲーのフォーラムスレッド募集。sticky はスレッドではなく
 *   専用のプラベ/別ゲー募集チャンネル(channelId)に送る(sendRecruitSticky)
 * - 'channel': それ以外。募集自身のチャンネル(channelId)に送る(sendCloseEmbedSticky)
 *
 * 呼び出し側(closeExpiredRecruits)がチャンネル単位で束ねて重複更新を避けられるよう、
 * recruitAutoClose 自身は sticky を送らずこれを返すだけにする。
 */
export type StickyRefreshTarget =
    | { kind: 'thread'; guildId: string; channelId: string }
    | { kind: 'channel'; guildId: string; channelId: string };

/**
 * 期限切れの募集を〆る。
 *
 * sticky の更新は呼び出し側でチャンネルごとにまとめて行うため、ここでは行わない。
 * 更新すべき sticky の宛先を返すので、呼び出し側でそれを使って更新すること。
 */
export async function recruitAutoClose(
    guild: Guild,
    recruit: Recruit,
): Promise<StickyRefreshTarget> {
    const participants = await ParticipantService.getAllParticipants(
        recruit.guildId,
        recruit.messageId,
    );
    const memberList = getMemberMentions(recruit.recruitNum, participants);

    // 募集カードを〆の状態に描き直す(この中で募集・参加者を DB から読むため、削除より先に行う)
    await regenerateCanvas(guild, recruit.channelId, recruit.messageId, RecruitOpCode.close);

    // DBから募集情報削除。
    // 以降で失敗しても再スキャンされないよう、Discord 側の後始末より先に消す。
    await RecruitService.deleteRecruit(recruit.guildId, recruit.messageId);
    await ParticipantService.deleteAllParticipant(recruit.guildId, recruit.messageId);

    await disableRecruitButtons(guild, recruit, memberList);

    return getStickyRefreshTarget(recruit);
}

/**
 * 募集の sticky 更新先を、募集行(recruitType/channelId)から決める。
 * 実際のチャンネル/スレッドが既に削除されていても関係なく決まる
 * (削除されていた場合の実送信スキップは sticky 送信側の責務)。
 */
async function getStickyRefreshTarget(recruit: Recruit): Promise<StickyRefreshTarget> {
    // フォーラムやスレッドの場合は、テキストの募集チャンネルにSticky Messageを送信する
    const stickyChannelId = await getStickyChannelId(recruit);
    if (exists(stickyChannelId)) {
        return { kind: 'thread', guildId: recruit.guildId, channelId: stickyChannelId };
    }
    return { kind: 'channel', guildId: recruit.guildId, channelId: recruit.channelId };
}

async function disableRecruitButtons(guild: Guild, recruit: Recruit, memberList: string) {
    if (notExists(recruit.buttonMessageId)) return;

    const buttonMessage = await searchMessageById(
        guild,
        recruit.channelId,
        recruit.buttonMessageId,
    );
    // 募集者がボタンメッセージを消していることがある
    if (notExists(buttonMessage)) return;

    try {
        await buttonMessage.edit({
            content: '`[自動〆]`\n' + `<@${recruit.authorId}>たんの募集は〆！\n${memberList}`,
            components: setButtonDisable(buttonMessage),
        });
    } catch (error) {
        // フォーラムのスレッドは最大7日でアーカイブされ、アーカイブ済みスレッド内の
        // メッセージ編集は Discord 側に拒否される。TTL 掃除(7日)はこのケースにほぼ確実に当たる。
        // DBの行は既に削除済みで掃除自体は進んでいるため、この3種類に限りエラーログへ
        // 送らず warn に留める。スレッドをアンアーカイブしてまで無効化はしない
        // (死んだ募集スレッドをフォーラムの先頭に戻さないという判断)。
        // それ以外(権限不足など)は握り潰さず投げ直し、呼び出し側の catch で報告させる。
        // DBの行は既に削除済みなので、投げ直しても再スキャンループにはならない。
        const tolerableCodes: number[] = [
            RESTJSONErrorCodes.InvalidActionOnArchivedThread,
            RESTJSONErrorCodes.ThreadLocked,
            RESTJSONErrorCodes.UnknownMessage,
        ];
        if (error instanceof DiscordAPIError && tolerableCodes.includes(Number(error.code))) {
            logger.warn(
                `failed to disable recruit buttons for recruit[${recruit.messageId}]. ${String(error)}`,
            );
            return;
        }
        throw error;
    }
}
