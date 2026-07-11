import { REST, Routes } from 'discord.js';

import { assertExistCheck } from './app/common/others.js';
import { sendErrorLogs } from './app/logs/error/send_error_logs.js';
import { log4js_obj } from './log4js_settings.js';
import {
    adminEarlyCommandDefinitions,
    adminLateCommandDefinitions,
    shutdownCommandDefinitions,
} from './register/admin_commands.js';
import { recruitCommandDefinitions } from './register/recruit_commands.js';
import {
    experienceCommandDefinitions,
    teamDividerCommandDefinitions,
    utilEarlyCommandDefinitions,
} from './register/util_commands.js';
import {
    voiceChannelMentionCommandDefinitions,
    voiceCommandDefinitions,
    voiceLockCommandDefinitions,
    voicePickCommandDefinitions,
} from './register/vc_commands.js';

export const commandDefinitions = [
    ...shutdownCommandDefinitions,
    ...voiceLockCommandDefinitions,
    ...utilEarlyCommandDefinitions.slice(0, 3),
    ...teamDividerCommandDefinitions,
    ...utilEarlyCommandDefinitions.slice(3, 5),
    ...voicePickCommandDefinitions,
    ...utilEarlyCommandDefinitions.slice(5),
    ...adminEarlyCommandDefinitions,
    ...experienceCommandDefinitions,
    ...voiceCommandDefinitions,
    ...recruitCommandDefinitions,
    ...voiceChannelMentionCommandDefinitions,
    ...adminLateCommandDefinitions,
];

// 登録用関数
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN || '');
export async function registerSlashCommands() {
    const logger = log4js_obj.getLogger();
    const botId = process.env.DISCORD_BOT_ID;
    const serverId = process.env.SERVER_ID;

    assertExistCheck(botId, 'process.env.DISCORD_BOT_ID');
    assertExistCheck(serverId, 'process.env.SERVER_ID');

    const mode = process.env.SLASH_COMMAND_REGISTER_MODE;
    if (mode === 'guild') {
        await rest
            .put(Routes.applicationCommands(botId), { body: [] })
            .then(() => logger.info('Successfully deleted application global commands.'))
            .catch(async (error) => {
                await sendErrorLogs(logger, error);
            });
        await rest
            .put(Routes.applicationGuildCommands(botId, serverId), {
                body: commandDefinitions,
            })
            .then(() => logger.info('Successfully registered application guild commands.'))
            .catch(async (error) => {
                await sendErrorLogs(logger, error);
            });
    } else if (mode === 'global') {
        await rest
            .put(Routes.applicationGuildCommands(botId, serverId), { body: [] })
            .then(() => logger.info('Successfully deleted application guild commands.'))
            .catch(async (error) => {
                await sendErrorLogs(logger, error);
            });
        await rest
            .put(Routes.applicationCommands(botId), {
                body: commandDefinitions,
            })
            .then(() => logger.info('Successfully registered application global commands.'))
            .catch(async (error) => {
                await sendErrorLogs(logger, error);
            });
    }
}
