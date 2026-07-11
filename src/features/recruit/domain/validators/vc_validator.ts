import { VoiceBasedChannel } from 'discord.js';

import { getVCReserveErrorMessage } from '@/features/recruit/domain/condition_checks/vc_reserve_check';
import { RecruitConditionError } from '@/features/recruit/domain/types/recruit_condition_error';
import { exists } from '@/shared/assert';

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
