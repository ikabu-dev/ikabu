import { ButtonInteraction } from 'discord.js';

import { ParticipantMember, ParticipantService } from '@/infra/db/repositories/participant_service';
import { RecruitService } from '@/infra/db/repositories/recruit_service';
import { notExists } from '@/shared/assert';
import { getGuildByInteraction } from '@/shared/discord_helpers/guild_manager';

export function getMemberMentions(recruitNum: number, participants: ParticipantMember[]) {
    const applicantMentionList = []; // 参加希望者リスト
    for (const participant of participants) {
        if (participant.userType === 2) {
            applicantMentionList.push(participant.member.mention);
        }
    }
    let counter = `\`[${applicantMentionList.length}]\``;
    if (recruitNum !== -1) {
        counter = `\`[${applicantMentionList.length}/${recruitNum}]\``;
    }
    let mentionString = '**【参加表明一覧】**' + counter;
    for (const applicantMention of applicantMentionList) {
        mentionString += '\n' + applicantMention;
    }
    return mentionString;
}

export async function memberListText(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    messageId: string,
) {
    const guild = await getGuildByInteraction(interaction);
    const recruit = await RecruitService.getRecruit(guild.id, messageId);
    if (notExists(recruit)) return;
    const participants = await ParticipantService.getAllParticipants(guild.id, messageId);
    const memberList = getMemberMentions(recruit.recruitNum, participants);
    const msgFirstRow = interaction.message.content.split('\n')[0];
    return msgFirstRow + '\n' + memberList;
}
