import { CacheType, MessageContextMenuCommandInteraction } from 'discord.js';

import { ErrorTexts } from '@/config/constants/error_texts';
import { sendCommandLog } from '@/infra/logging/command_log';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { messageContextMenuCommands } from '@/registry/command_registry';
import { exists } from '@/shared/assert';

import type { MessageContextMenuCommand } from '@/shared/command_types';

const logger = log4js_obj.getLogger('interaction');

const contextMenuCommands = new Map<string, MessageContextMenuCommand>(
    messageContextMenuCommands.map((command) => [command.definition.name, command]),
);

export async function call(interaction: MessageContextMenuCommandInteraction<CacheType>) {
    try {
        sendCommandLog(interaction);
    } catch (error) {
        await sendErrorLogs(logger, error);
    }

    if (interaction.inGuild()) {
        const command = contextMenuCommands.get(interaction.commandName);
        if (exists(command)) {
            try {
                await command.execute(interaction);
            } catch (error) {
                await sendErrorLogs(logger, error);
                const commandChannel = interaction.channel;
                if (exists(commandChannel) && commandChannel.isSendable()) {
                    await commandChannel.send(ErrorTexts.UndefinedError);
                }
            }
        }
    }
    return;
}
