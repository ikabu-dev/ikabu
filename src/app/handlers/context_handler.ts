import { CacheType, MessageContextMenuCommandInteraction } from 'discord.js';

import { commandNames } from '@/constant';
import { log4js_obj } from '@/log4js_settings';

import { buttonEnable } from '../feat-admin/button_enabler/enable_button';
import { createRecruitEditor } from '../feat-recruit/edit_recruit/recruit_editor';
import { sendCommandLog } from '../logs/commands/command_log';
import { sendErrorLogs } from '../logs/error/send_error_logs';
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
