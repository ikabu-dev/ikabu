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
import { ErrorTexts } from '@/config/constants/error_texts';
import { deleteFriendCode } from '@/features/friend_code/friendcode';
import { questionnaireButtonHandler } from '@/features/onboarding/send_questionnaire';
import { recruitButtonHandler } from '@/features/recruit/interactions/recruit_button_handler';
import { setResolvedTag } from '@/features/support_tag/resolved_support';
import { dividerButtonHandler } from '@/features/team_divider/divider_button_handler';
import { joinTTS, killTTS } from '@/features/voice/tts/discordjs_voice';
import { sendRadioRequest } from '@/features/voice/vc_tools/radio_request';
import { voiceLockUpdate } from '@/features/voice/vc_tools/voice_lock';
import { voiceLockCommandUpdate } from '@/features/voice/voice_locker';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { exists } from '@/shared/assert';

const logger = log4js_obj.getLogger('interaction');

export async function call(interaction: ButtonInteraction<CacheType>) {
    try {
        await dispatch(interaction);
    } catch (error) {
        await sendErrorLogs(logger, error);
        const buttonChannel = interaction.channel;
        if (exists(buttonChannel) && buttonChannel.isSendable()) {
            await buttonChannel.send(ErrorTexts.UndefinedError);
        }
    }
}

async function dispatch(interaction: ButtonInteraction<CacheType>) {
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
