import { Recruit } from '@prisma/client';
import { Guild } from 'discord.js';

import { getMemberMentions } from '@/features/recruit/common/member_list';
import {
    getStickyChannelId,
    sendCloseEmbedSticky,
    sendRecruitSticky,
} from '@/features/recruit/sticky/recruit_sticky_messages';
import { regenerateCanvas, RecruitOpCode } from '@/features/recruit/ui/canvases/regenerate_canvas';
import { ParticipantService } from '@/infra/db/repositories/participant_service';
import { RecruitService } from '@/infra/db/repositories/recruit_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { exists, notExists } from '@/shared/assert';
import { setButtonDisable } from '@/shared/discord_helpers/button_components';
import { searchChannelById } from '@/shared/discord_helpers/channel_manager';
import { searchMessageById } from '@/shared/discord_helpers/message_manager';

const logger = log4js_obj.getLogger('recruit');

/** 期限切れの募集を〆る。 */
export async function recruitAutoClose(guild: Guild, recruit: Recruit) {
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

    const recruitChannel = await searchChannelById(guild, recruit.channelId);
    if (exists(recruitChannel)) {
        if (recruitChannel.isThread()) {
            // フォーラムやスレッドの場合は、テキストの募集チャンネルにSticky Messageを送信する
            const stickyChannelId = await getStickyChannelId(recruit);
            if (exists(stickyChannelId)) {
                await sendRecruitSticky({
                    channelOpt: { guild: guild, channelId: stickyChannelId },
                });
            }
        } else {
            await sendCloseEmbedSticky(guild, recruitChannel);
        }
    }
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
        // DBの行は既に削除済みで掃除自体は進んでいるため、ボタン無効化の失敗はエラーログへ
        // 送らず warn に留める。スレッドをアンアーカイブしてまで無効化はしない
        // (死んだ募集スレッドをフォーラムの先頭に戻さないという判断)。
        logger.warn(
            `failed to disable recruit buttons for recruit[${recruit.messageId}]. ${String(error)}`,
        );
    }
}
