import { Member } from '@prisma/client';
import { ButtonInteraction, Guild, Message, MessageFlags } from 'discord.js';

import { ParticipantMember, ParticipantService } from '../../../db/participant_service';
import { recoveryThinkingButton } from '../../common/button_components';
import { assertExistCheck } from '../../common/others';
import { sendStickyMessage } from '../../common/sticky_message';
import { StickyKey } from '../../constant/sticky_key';
import { memberListText } from '../interactions/buttons/other_events';
import { sendCancelNotifyToHost } from '../interactions/buttons/send_notify_to_host';
import { availableRecruitString } from '../sticky/recruit_sticky_messages';

export async function cancelRequestNotify(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    guild: Guild,
    member: Member,
    recruiter: ParticipantMember,
    attendeeList: ParticipantMember[],
    embedMessageId: string,
) {
    assertExistCheck(interaction.channel, 'channel');
    const recruitChannel = interaction.channel;

    await ParticipantService.deleteParticipant(guild.id, embedMessageId, member.userId);

    sendCancelNotifyToHost(
        interaction.message as Message<true>,
        guild,
        recruitChannel,
        member,
        recruiter,
        attendeeList,
    );

    await interaction.editReply({
        content: await memberListText(interaction, embedMessageId),
        components: recoveryThinkingButton(interaction, 'キャンセル'),
    });

    if (recruitChannel.isTextBased()) {
        await sendStickyMessage(guild, recruitChannel.id, StickyKey.AvailableRecruit, {
            content: await availableRecruitString(guild, recruitChannel.id),
            flags: MessageFlags.SuppressNotifications,
        });
    }
}
