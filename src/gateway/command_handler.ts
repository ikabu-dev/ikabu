import { CacheType, ChatInputCommandInteraction } from 'discord.js';

import { ErrorTexts } from '@/config/constants/error_texts';
import { sendCommandLog } from '@/infra/logging/command_log';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { chatInputCommands } from '@/registry/command_registry';
import { exists } from '@/shared/assert';

import type { GlobalChatInputCommand, GuildChatInputCommand } from '@/registry/types';

const logger = log4js_obj.getLogger('interaction');

const guildCommands = new Map<string, GuildChatInputCommand>(
    chatInputCommands
        .filter((command): command is GuildChatInputCommand => command.guildOnly)
        .map((command) => [command.definition.name, command]),
);

const globalCommands = new Map<string, GlobalChatInputCommand>(
    chatInputCommands
        .filter((command): command is GlobalChatInputCommand => !command.guildOnly)
        .map((command) => [command.definition.name, command]),
);

export async function call(interaction: ChatInputCommandInteraction<CacheType>) {
    try {
        sendCommandLog(interaction);
    } catch (error) {
        await sendErrorLogs(logger, error);
    }

    await CommandsHandler(interaction); // DMとGuild両方で動くコマンド

    if (interaction.inCachedGuild()) {
        // Guildのみで動くコマンド
        await cachedGuildCommandsHandler(interaction);
    } else if (exists(interaction.channel) && interaction.channel.isDMBased()) {
        // DMのみで動くコマンド
    }
    return;
}

async function cachedGuildCommandsHandler(interaction: ChatInputCommandInteraction<'cached'>) {
    const command = guildCommands.get(interaction.commandName);
    if (!exists(command)) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        await sendErrorLogs(logger, error);
        const commandChannel = interaction.channel;
        if (exists(commandChannel)) {
            await commandChannel.send(ErrorTexts.UndefinedError);
        }
    }
}

async function CommandsHandler(interaction: ChatInputCommandInteraction<CacheType>) {
    const command = globalCommands.get(interaction.commandName);
    if (!exists(command)) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        await sendErrorLogs(logger, error);
        const commandChannel = interaction.channel;
        if (exists(commandChannel)) {
            if (commandChannel.isSendable()) {
                await commandChannel.send(ErrorTexts.UndefinedError);
            }
        }
    }
}
