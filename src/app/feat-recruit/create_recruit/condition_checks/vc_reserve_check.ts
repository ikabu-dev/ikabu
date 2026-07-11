import { VoiceBasedChannel } from 'discord.js';

import { RecruitAlertTexts } from '@/app/feat-recruit/common/alert_texts/alert_texts';
import { exists } from '@/shared/assert';

export async function getVCReserveErrorMessage(
    guildId: string,
    voiceChannel: VoiceBasedChannel,
    recruiterId: string,
) {
    const availableChannel = [
        'alfa',
        'bravo',
        'charlie',
        'delta',
        'echo',
        'fox',
        'golf',
        'hotel',
        'india',
        'juliett',
        'kilo',
        'lima',
        'mike',
    ];

    const guildEvents = await voiceChannel.guild.scheduledEvents.fetch();
    const event = guildEvents.find(
        (event) => exists(event.channel) && event.channel.id === voiceChannel.id,
    );

    if (voiceChannel.members.size !== 0 && !voiceChannel.members.has(recruiterId)) {
        return `${RecruitAlertTexts.ChannelAlreadyUsed}`;
    } else if (!availableChannel.includes(voiceChannel.name)) {
        return `${RecruitAlertTexts.ChannelNotAvailableForReservation}`;
    } else if (exists(event)) {
        return `${RecruitAlertTexts.ChannelAlreadyReserved}`;
    } else {
        return null;
    }
}
