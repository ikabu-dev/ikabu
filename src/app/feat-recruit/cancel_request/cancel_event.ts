import { Member } from '@prisma/client';
import { ButtonInteraction, Guild, Message, MessageFlags } from 'discord.js';

import { StickyKey } from '@/config/constants/sticky_key';
import { ParticipantMember, ParticipantService } from '@/infra/db/repositories/participant_service';
import { assertExistCheck } from '@/shared/assert';
import { recoveryThinkingButton } from '@/shared/discord_helpers/button_components';
import { sendStickyMessage } from '@/shared/discord_helpers/sticky_message';

import { RecruitOpCode, regenerateCanvas } from '../common/canvases/regenerate_canvas';
import { memberListText } from '../common/member_list';
import { sendCancelNotifyToHost } from '../common/send_notify_to_host';
import { availableRecruitString } from '../sticky/recruit_sticky_messages';

export async function cancelRequest(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    guild: Guild,
    member: Member,
    recruiter: ParticipantMember,
    attendeeList: ParticipantMember[],
    image1MsgId: string,
) {
    assertExistCheck(interaction.channel, 'channel');
    const recruitChannel = interaction.channel;

    await ParticipantService.deleteParticipant(guild.id, image1MsgId, member.userId);
    await regenerateCanvas(guild, recruitChannel.id, image1MsgId, RecruitOpCode.open);

    sendCancelNotifyToHost(
        interaction.message as Message<true>,
        guild,
        recruitChannel,
        member,
        recruiter,
        attendeeList,
    );

    await interaction.editReply({
        content: await memberListText(interaction, image1MsgId),
        components: recoveryThinkingButton(interaction, 'キャンセル'),
    });

    if (recruitChannel.isTextBased()) {
        await sendStickyMessage(guild, recruitChannel.id, StickyKey.AvailableRecruit, {
            content: await availableRecruitString(guild, recruitChannel.id),
            flags: MessageFlags.SuppressNotifications,
        });
    }
}
