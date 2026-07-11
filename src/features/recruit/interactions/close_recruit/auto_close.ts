import { Message } from 'discord.js';

import { getMemberMentions } from '@/features/recruit/common/member_list';
import { RecruitData } from '@/features/recruit/domain/types/recruit_data';
import { sendCloseEmbedSticky } from '@/features/recruit/sticky/recruit_sticky_messages';
import { regenerateCanvas, RecruitOpCode } from '@/features/recruit/ui/canvases/regenerate_canvas';
import { ParticipantService } from '@/infra/db/repositories/participant_service';
import { RecruitService } from '@/infra/db/repositories/recruit_service';
import { notExists } from '@/shared/assert';
import { setButtonDisable } from '@/shared/discord_helpers/button_components';

export async function recruitAutoClose(
    recruitData: RecruitData,
    recruitId: string,
    buttonMessage: Message<true>,
) {
    const guild = recruitData.guild;
    const recruitChannel = recruitData.recruitChannel;
    const recruiter = recruitData.interactionMember;

    if (notExists(await RecruitService.getRecruit(guild.id, recruitId))) return;

    const participants = await ParticipantService.getAllParticipants(guild.id, recruitId);
    const memberList = getMemberMentions(recruitData.recruitNum, participants);
    const recruiterMention = `<@${recruiter.id}>`;

    await regenerateCanvas(guild, recruitData.recruitChannel.id, recruitId, RecruitOpCode.close);

    // DBから募集情報削除
    await RecruitService.deleteRecruit(guild.id, recruitId);
    await ParticipantService.deleteAllParticipant(guild.id, recruitId);

    await buttonMessage.edit({
        content: '`[自動〆]`\n' + `${recruiterMention}たんの募集は〆！\n${memberList}`,
        components: setButtonDisable(buttonMessage),
    });

    await sendCloseEmbedSticky(guild, recruitChannel);
}
