import { Member } from '@prisma/client';
import {
    BaseGuildTextChannel,
    ButtonInteraction,
    CacheType,
    ColorResolvable,
    EmbedBuilder,
} from 'discord.js';

import { assertExistCheck } from '@/app/common/others';
import { sendEmbedsWebhook } from '@/app/common/webhook';
import { ParticipantMember } from '@/db/participant_service';

export async function sendRecruitButtonLog(
    interaction: ButtonInteraction<CacheType>,
    member: Member,
    recruiter: ParticipantMember,
    buttonName: string,
    color: ColorResolvable,
) {
    const embed = new EmbedBuilder();
    if (interaction.channel instanceof BaseGuildTextChannel) {
        embed.setTitle(interaction.channel?.name + 'で' + buttonName + 'ボタンが押されたでし！');
    }
    embed.setAuthor({
        name: `${member.displayName} [${member.userId}]`,
        iconURL: member.iconUrl,
    });
    embed.setDescription(
        '**募集主**: ' + recruiter.member.displayName + ' [' + recruiter.userId + ']',
    );
    embed.setColor(color);
    embed.setTimestamp(interaction.createdAt);
    assertExistCheck(process.env.BUTTON_LOG_WEBHOOK_URL, 'BUTTON_LOG_WEBHOOK_URL');
    void sendEmbedsWebhook(process.env.BUTTON_LOG_WEBHOOK_URL, [embed]);
}
