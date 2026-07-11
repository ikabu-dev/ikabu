import { Recruit } from '@prisma/client';
import { ButtonInteraction, EmbedBuilder, Guild } from 'discord.js';

import { ParticipantService } from '@/infra/db/repositories/participant_service';
import { RecruitService } from '@/infra/db/repositories/recruit_service';
import { assertExistCheck, exists } from '@/shared/assert';
import { disableThinkingButton } from '@/shared/discord_helpers/button_components';

import {
    getStickyChannelId,
    sendCloseEmbedSticky,
    sendRecruitSticky,
} from '../sticky/recruit_sticky_messages';

export async function cancelRecruitNotify(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    guild: Guild,
    recruitData: Recruit,
    embedMessageId: string,
) {
    const recruiterId = recruitData.authorId;
    const embed = new EmbedBuilder().setDescription(`<@${recruiterId}>たんの募集〆`);
    const buttonMessage = interaction.message;
    assertExistCheck(interaction.channel, 'channel');
    const recruitChannel = interaction.channel;

    await RecruitService.deleteRecruit(guild.id, embedMessageId);
    await ParticipantService.deleteAllParticipant(guild.id, embedMessageId);

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
