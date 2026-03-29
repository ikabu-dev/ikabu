import { ButtonInteraction } from 'discord.js';

import { cancel } from './cancel_event';
import { cancelNotify } from './cancel_notify_event';
import { confirmJoinRequest } from './confirm_join_request';
import { del } from './delete_event';
import { join } from './join_event';
import { joinNotify } from './join_notify_event';
import { log4js_obj } from '../../../../log4js_settings';
import { setButtonDisable } from '../../../common/button_components';
import { exists } from '../../../common/others';
import { RecruitParam } from '../../../constant/button_id';
import { sendErrorLogs } from '../../../logs/error/send_error_logs';
import { close } from '../../close_recruit/close_event';
import { closeNotify } from '../../close_recruit/close_notify_event';
import { handleCreateModal } from '../../create_recruit/modals/create_recruit_modals';
import { endRecruitEventButton } from '../../vc_reservation/recruit_event';

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
            await cancel(interaction, params);
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
            await cancelNotify(interaction);
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
