import { CacheType, MessageContextMenuCommandInteraction } from 'discord.js';

import { commandNames } from '@/config/constants/commands';
import { buttonEnable } from '@/features/admin/button_enabler/enable_button';
import { createRecruitEditor } from '@/features/recruit/interactions/edit_recruit/recruit_editor';
import { sendCommandLog } from '@/infra/logging/command_log';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';

const logger = log4js_obj.getLogger('interaction');

export async function call(interaction: MessageContextMenuCommandInteraction<CacheType>) {
    try {
        sendCommandLog(interaction);
    } catch (error) {
        await sendErrorLogs(logger, error);
    }

    if (interaction.inGuild()) {
        if (interaction.commandName === commandNames.buttonEnabler) {
            await buttonEnable(interaction);
        } else if (interaction.commandName === commandNames.recruitEditor) {
            await createRecruitEditor(interaction);
        }
    }
    return;
}
