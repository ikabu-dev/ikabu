import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

import { RecruitParam } from '../../constant/button_id';

export function joinRequestConfirmButtons(
    recruitId: string,
    memberListMessageId: string,
    participantId: string,
) {
    const approvalParams = new URLSearchParams();
    approvalParams.append('d', RecruitParam.Approve);
    approvalParams.append('rid', recruitId);
    approvalParams.append('mid', memberListMessageId);
    approvalParams.append('pid', participantId);

    const rejectParams = new URLSearchParams();
    rejectParams.append('d', RecruitParam.Reject);
    rejectParams.append('rid', recruitId);
    rejectParams.append('mid', memberListMessageId);
    rejectParams.append('pid', participantId);

    const button = new ActionRowBuilder<ButtonBuilder>();
    button.addComponents([
        new ButtonBuilder()
            .setCustomId(approvalParams.toString())
            .setLabel('承認')
            .setStyle(ButtonStyle.Success),
    ]);
    button.addComponents([
        new ButtonBuilder()
            .setCustomId(rejectParams.toString())
            .setLabel('拒否')
            .setStyle(ButtonStyle.Danger),
    ]);
    return button;
}
