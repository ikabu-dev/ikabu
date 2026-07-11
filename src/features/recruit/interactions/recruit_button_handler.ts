import { ButtonInteraction } from 'discord.js';

import { RecruitParam } from '@/config/constants/button_id';
import {
    cancelButtonHandler,
    cancelNotifyButtonHandler,
} from '@/features/recruit/interactions/cancel_button_handler';
import { close } from '@/features/recruit/interactions/close_recruit/close_event';
import { closeNotify } from '@/features/recruit/interactions/close_recruit/close_notify_event';
import { del } from '@/features/recruit/interactions/delete_recruit/delete_event';
import { confirmJoinRequest } from '@/features/recruit/interactions/join_request/confirm_join_request';
import { join } from '@/features/recruit/interactions/join_request/join_event';
import { joinNotify } from '@/features/recruit/interactions/join_request/join_notify_event';
import { handleCreateModal } from '@/features/recruit/ui/modals/create_recruit_modals';
import { endRecruitEventButton } from '@/features/recruit/vc_reservation/recruit_event';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { exists } from '@/shared/assert';
import { setButtonDisable } from '@/shared/discord_helpers/button_components';

const logger = log4js_obj.getLogger('recruitButton');

export async function recruitButtonHandler(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    recruitParam: RecruitParam,
    params: URLSearchParams,
) {
    // modalはinteraction.replied === true だとエラーになるので、ここで処理する
    if (recruitParam === RecruitParam.NewModalRecruit) {
        await handleCreateModal(interaction, params);
        return;
    }

    // ボタンを考え中にする。各機能の最後に interaction.editReplyでボタン(components)を上書きすること。
    // recoveryThinkingButton(interaction, 'ボタン名'): ボタン名のラベルで考え中ボタンを復帰する
    // disableThinkingButton(interaction, 'ボタン名'): ボタン名のラベルで考え中ボタンを無効化する
    try {
        await interaction.update({
            components: setButtonDisable(interaction.message, interaction),
        });
    } catch (error) {
        await sendErrorLogs(logger, error);
        if (exists(interaction.channel)) {
            await interaction.channel.send(
                'タイムアウトしたでし！\n数秒待ってからもう一度ボタンを押してみるでし！',
            );
        }
        return;
    }

    switch (recruitParam) {
        case RecruitParam.Join:
            await join(interaction, params);
            break;
        case RecruitParam.Cancel:
            await cancelButtonHandler(interaction, params);
            break;
        case RecruitParam.Delete:
            await del(interaction, params);
            break;
        case RecruitParam.Close:
            await close(interaction, params);
            break;
        case RecruitParam.EndEvent:
            await endRecruitEventButton(interaction, params);
            break;
        case RecruitParam.JoinNotify:
            await joinNotify(interaction);
            break;
        case RecruitParam.CancelNotify:
            await cancelNotifyButtonHandler(interaction);
            break;
        case RecruitParam.CloseNotify:
            await closeNotify(interaction);
            break;
        case RecruitParam.Approve:
        case RecruitParam.Reject:
            await confirmJoinRequest(interaction, params);
            break;
        default:
            break;
    }
}
