import { VoiceState } from 'discord.js';

import { env } from '@/config/env';
import { endEventOnRecruiterLeave } from '@/features/recruit/vc_reservation/event_auto_end';
import { endCall, startCall } from '@/features/stats/voice_count';
import { autokill } from '@/features/voice/tts/discordjs_voice';
import { vcToolsStickyFromVoiceState } from '@/features/voice/vc_tools/vc_tools_message';
import { disableLimit } from '@/features/voice/vc_tools/voice_lock';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { exists, notExists } from '@/shared/assert';

const logger = log4js_obj.getLogger('voiceStateUpdate');

export async function call(oldState: VoiceState, newState: VoiceState) {
    try {
        if (oldState.channelId === newState.channelId) {
            // ここはミュートなどの動作を行ったときに発火する場所
        } else if (notExists(oldState.channelId) && exists(newState.channelId)) {
            // ここはconnectしたときに発火する場所
            if (newState.guild.id === env.serverId) {
                await startCall(newState.id);
            }
            await vcToolsStickyFromVoiceState(newState, true);
        } else if (exists(oldState.channelId) && notExists(newState.channelId)) {
            if (oldState.guild.id === env.serverId) {
                await endCall(oldState.id);
            }
            // ここはdisconnectしたときに発火する場所
            await disableLimit(oldState); // vcToolsStickyよりも先に実行しないと人数が反映されない
            await vcToolsStickyFromVoiceState(oldState, false);
            await endEventOnRecruiterLeave(oldState);
            await autokill(oldState);
        } else {
            // ここはチャンネル移動を行ったときに発火する場所
            await disableLimit(oldState); // vcToolsStickyよりも先に実行しないと人数が反映されない
            await vcToolsStickyFromVoiceState(newState, true);
            await vcToolsStickyFromVoiceState(oldState, false);
            await endEventOnRecruiterLeave(oldState);
            await autokill(oldState);
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
