import { Message } from 'discord.js';

import { ParticipantService } from '../../../db/participant_service';
import { RecruitService } from '../../../db/recruit_service';
import { setButtonDisable } from '../../common/button_components';
import { notExists } from '../../common/others';
import { regenerateCanvas, RecruitOpCode } from '../canvases/regenerate_canvas';
import { getMemberMentions } from '../interactions/buttons/other_events';
import { sendCloseEmbedSticky } from '../sticky/recruit_sticky_messages';
import { RecruitData } from '../types/recruit_data';

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
