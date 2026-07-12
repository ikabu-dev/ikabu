import { Recruit } from '@prisma/client';
import { Guild } from 'discord.js';

import { getMemberMentions } from '@/features/recruit/common/member_list';
import { sendCloseEmbedSticky } from '@/features/recruit/sticky/recruit_sticky_messages';
import { regenerateCanvas, RecruitOpCode } from '@/features/recruit/ui/canvases/regenerate_canvas';
import { ParticipantService } from '@/infra/db/repositories/participant_service';
import { RecruitService } from '@/infra/db/repositories/recruit_service';
import { exists, notExists } from '@/shared/assert';
import { setButtonDisable } from '@/shared/discord_helpers/button_components';
import { searchChannelById } from '@/shared/discord_helpers/channel_manager';
import { searchMessageById } from '@/shared/discord_helpers/message_manager';

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
        await sendCloseEmbedSticky(guild, recruitChannel);
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

    await buttonMessage.edit({
        content: '`[自動〆]`\n' + `<@${recruit.authorId}>たんの募集は〆！\n${memberList}`,
        components: setButtonDisable(buttonMessage),
    });
}
