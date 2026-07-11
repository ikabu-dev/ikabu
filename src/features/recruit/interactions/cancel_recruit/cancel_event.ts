import { Recruit } from '@prisma/client';
import { ButtonInteraction, EmbedBuilder, Guild } from 'discord.js';

import {
    getStickyChannelId,
    sendCloseEmbedSticky,
    sendRecruitSticky,
} from '@/features/recruit/sticky/recruit_sticky_messages';
import { RecruitOpCode, regenerateCanvas } from '@/features/recruit/ui/canvases/regenerate_canvas';
import { cancelRecruitEvent } from '@/features/recruit/vc_reservation/recruit_event';
import { ParticipantService } from '@/infra/db/repositories/participant_service';
import { RecruitService } from '@/infra/db/repositories/recruit_service';
import { assertExistCheck, exists } from '@/shared/assert';
import { disableThinkingButton } from '@/shared/discord_helpers/button_components';

export async function cancelRecruit(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    guild: Guild,
    recruitData: Recruit,
    image1MsgId: string,
) {
    const recruiterId = recruitData.authorId;
    const embed = new EmbedBuilder().setDescription(`<@${recruiterId}>たんの募集〆`);
    const buttonMessage = interaction.message;
    assertExistCheck(interaction.channel, 'channel');
    const recruitChannel = interaction.channel;

    await regenerateCanvas(guild, recruitChannel.id, image1MsgId, RecruitOpCode.cancel);

    await RecruitService.deleteRecruit(guild.id, image1MsgId);
    await ParticipantService.deleteAllParticipant(guild.id, image1MsgId);

    if (exists(recruitData.eventId)) {
        await cancelRecruitEvent(guild, recruitData.eventId);
    }

    await buttonMessage.edit({
        content: `<@${recruiterId}>たんの募集はキャンセルされたでし！`,
        components: disableThinkingButton(interaction, 'キャンセル'),
    });
    await interaction.followUp({ embeds: [embed] });

    if (recruitChannel.isThread()) {
        const stickyChannelId = await getStickyChannelId(recruitData);
        if (exists(stickyChannelId)) {
            await sendRecruitSticky({
                channelOpt: { guild: guild, channelId: stickyChannelId },
            });
        }
    } else {
        await sendCloseEmbedSticky(guild, recruitChannel);
    }
}
