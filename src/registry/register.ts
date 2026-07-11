import { REST, Routes } from 'discord.js';

import { env } from '@/config/env';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { assertExistCheck } from '@/shared/assert';

import { commands } from './command_registry';

/** Discord に登録する定義一覧。順序は command_registry.ts の並びをそのまま使う。 */
export const commandDefinitions = commands.map((command) => command.definition);

// 登録用関数
const rest = new REST({ version: '10' }).setToken(env.discordBotToken || '');
export async function registerSlashCommands() {
    const logger = log4js_obj.getLogger();
    const botId = env.discordBotId;
    const serverId = env.serverId;

    assertExistCheck(botId, 'DISCORD_BOT_ID');
    assertExistCheck(serverId, 'SERVER_ID');

    const mode = env.slashCommandRegisterMode;
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
