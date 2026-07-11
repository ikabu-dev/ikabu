import { VoiceBasedChannel } from 'discord.js';

import { exists } from '@/app/common/others';
import { RecruitConditionError } from '@/app/feat-recruit/common/types/recruit_condition_error';

import { getVCReserveErrorMessage } from '../condition_checks/vc_reserve_check';

export async function validateVoiceChannel(
    guildId: string,
    voiceChannel: VoiceBasedChannel | null,
    recruiterId: string,
): Promise<void> {
    if (!exists(voiceChannel)) return;

    const errorMessage = await getVCReserveErrorMessage(guildId, voiceChannel, recruiterId);
    if (exists(errorMessage)) {
        throw new RecruitConditionError(errorMessage);
    }
}
