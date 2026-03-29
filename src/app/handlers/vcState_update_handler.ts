import { VoiceState } from 'discord.js';

import { log4js_obj } from '../../log4js_settings';
import { exists, notExists } from '../common/others';
import { vcToolsStickyFromVoiceState } from '../event/vctools_sticky/vc_tools_message';
import { disableLimit } from '../event/vctools_sticky/voice_lock';
import { endCall, startCall } from '../event/voice_count/voice_count';
import { endEventOnRecruiterLeave } from '../feat-recruit/vc_reservation/event_auto_end';
import { autokill } from '../feat-utils/voice/tts/discordjs_voice';
import { sendErrorLogs } from '../logs/error/send_error_logs';

const logger = log4js_obj.getLogger('voiceStateUpdate');

export async function call(oldState: VoiceState, newState: VoiceState) {
    try {
        if (oldState.channelId === newState.channelId) {
            // ここはミュートなどの動作を行ったときに発火する場所
        } else if (notExists(oldState.channelId) && exists(newState.channelId)) {
            // ここはconnectしたときに発火する場所
            if (newState.guild.id === process.env.SERVER_ID) {
                await startCall(newState.id);
            }
            await vcToolsStickyFromVoiceState(newState, true);
        } else if (exists(oldState.channelId) && notExists(newState.channelId)) {
            if (oldState.guild.id === process.env.SERVER_ID) {
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
