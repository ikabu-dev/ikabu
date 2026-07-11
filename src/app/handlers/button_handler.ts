import { URLSearchParams } from 'url';

import { ButtonInteraction, CacheType, MessageFlags } from 'discord.js';

import {
    FriendCodeButton,
    SupportCloseButton,
    VCToolsButton,
    isCommandVCLockButton,
    isQuestionnaireParam,
    isRecruitParam,
    isTeamDividerParam,
    isVCLockButton,
} from '@/config/constants/button_id';
import { exists } from '@/shared/assert';

import { questionnaireButtonHandler } from '../event/rookie/send_questionnaire';
import { setResolvedTag } from '../event/support_auto_tag/resolved_support';
import { sendRadioRequest } from '../event/vctools_sticky/radio_request';
import { voiceLockUpdate } from '../event/vctools_sticky/voice_lock';
import { recruitButtonHandler } from '../feat-recruit/recruit_button_handler';
import { deleteFriendCode } from '../feat-utils/other/friendcode';
import { dividerButtonHandler } from '../feat-utils/team_divider/divider_button_handler';
import { joinTTS, killTTS } from '../feat-utils/voice/tts/discordjs_voice';
import { voiceLockCommandUpdate } from '../feat-utils/voice/voice_locker';

export async function call(interaction: ButtonInteraction<CacheType>) {
    const customId = interaction.customId;

    // サーバとDM両方で動くボタン
    if (customId === FriendCodeButton.Hide) {
        await deleteFriendCode(interaction);
    }

    if (interaction.inGuild()) {
        // サーバ内のみで動くボタン
        const params = new URLSearchParams(customId);
        const param_q = params.get('q');
        const param_d = params.get('d');
        const param_t = params.get('t');
        if (isCommandVCLockButton(customId)) {
            await voiceLockCommandUpdate(interaction, customId);
        } else if (isVCLockButton(customId)) {
            await voiceLockUpdate(interaction, customId);
        } else if (customId === VCToolsButton.VoiceJoin) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            await joinTTS(interaction);
        } else if (customId === VCToolsButton.VoiceKill) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            await killTTS(interaction);
        } else if (customId === VCToolsButton.RequestRadio) {
            await sendRadioRequest(interaction);
        } else if (customId === SupportCloseButton.Resolved) {
            await setResolvedTag(interaction);
        } else if (exists(param_d) && isRecruitParam(param_d)) {
            await recruitButtonHandler(interaction, param_d, params);
        } else if (exists(param_t) && isTeamDividerParam(param_t)) {
            await dividerButtonHandler(interaction, param_t, params);
        } else if (exists(param_q) && isQuestionnaireParam(param_q)) {
            await questionnaireButtonHandler(interaction, param_q, params);
        }
    } else {
        // DMのみで動くボタン
    }

    return;
}
