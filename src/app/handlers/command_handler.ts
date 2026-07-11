import { CacheType, ChatInputCommandInteraction } from 'discord.js';

import { commandNames } from '@/constant.js';
import { log4js_obj } from '@/log4js_settings.js';

import { exists } from '../common/others';
import { ErrorTexts } from '../constant/error_texts.js';
import { handleBan } from '../feat-admin/ban/ban';
import { channelManagerHandler } from '../feat-admin/channel_manager/channel_manager_handler.js';
import { channelSettingsHandler } from '../feat-admin/channel_settings/channel_settings_handler.js';
import { variablesHandler } from '../feat-admin/environment_variables/variables_handler';
import { festSettingHandler } from '../feat-admin/fest_setting/fest_settings.js';
import { joinedAtFixer } from '../feat-admin/joined_date_fixer/fix_joined_date.js';
import { shutdown } from '../feat-admin/shutdown/shutdown_process';
import { uniqueChannelSettingsHandler } from '../feat-admin/unique_channel_settings/unique_channel_settings_handler.js';
import { uniqueRoleSettingsHandler } from '../feat-admin/unique_role_settings/unique_role_settings_handler.js';
import { closeCommand } from '../feat-recruit/close_recruit/close_command.js';
import { anarchyRecruit } from '../feat-recruit/create_recruit/anarchy_recruit.js';
import { buttonRecruit } from '../feat-recruit/create_recruit/button_recruit.js';
import { eventRecruit } from '../feat-recruit/create_recruit/event_recruit.js';
import { festRecruit } from '../feat-recruit/create_recruit/fest_recruit.js';
import { otherGameRecruit } from '../feat-recruit/create_recruit/other_game_recruit';
import { privateRecruit } from '../feat-recruit/create_recruit/private_recruit';
import { raidersRecruit } from '../feat-recruit/create_recruit/raiders_recruit.js';
import { regularRecruit } from '../feat-recruit/create_recruit/regular_recruit.js';
import { salmonRecruit } from '../feat-recruit/create_recruit/salmon_recruit.js';
import { handleIkabuExperience } from '../feat-utils/other/experience.js';
import { handleFriendCode } from '../feat-utils/other/friendcode';
import { handleHelp } from '../feat-utils/other/help.js';
import { handleKansen } from '../feat-utils/other/kansen.js';
import { handlePick } from '../feat-utils/other/pick.js';
import { handleTimer } from '../feat-utils/other/timer.js';
import { handleWiki } from '../feat-utils/other/wiki.js';
import { handleBuki } from '../feat-utils/splat3/buki';
import { handleShow } from '../feat-utils/splat3/show';
import { dividerInitialMessage } from '../feat-utils/team_divider/divider';
import { handleTTSCommand } from '../feat-utils/voice/tts/discordjs_voice';
import { voiceLocker } from '../feat-utils/voice/voice_locker';
import { voiceMention } from '../feat-utils/voice/voice_mention.js';
import { handleVoicePick } from '../feat-utils/voice/vpick.js';
import { sendCommandLog } from '../logs/commands/command_log';
import { sendErrorLogs } from '../logs/error/send_error_logs.js';

const logger = log4js_obj.getLogger('interaction');

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
    const cachedGuildCommandHandlers: Record<
        string,
        (interaction: ChatInputCommandInteraction<'cached'>) => Promise<unknown>
    > = {
        [commandNames.shutdown]: shutdown,
        [commandNames.close]: closeCommand,
        [commandNames.team_divider]: dividerInitialMessage,
        [commandNames.regular]: regularRecruit,
        [commandNames.anarchy]: anarchyRecruit,
        [commandNames.event]: eventRecruit,
        [commandNames.salmon]: salmonRecruit,
        [commandNames.raiders]: raidersRecruit,
        [commandNames.fesA]: festRecruit,
        [commandNames.fesB]: festRecruit,
        [commandNames.fesC]: festRecruit,
        [commandNames.other_game]: otherGameRecruit,
        [commandNames.private]: privateRecruit,
        [commandNames.buttonRecruit]: buttonRecruit,
        [commandNames.voiceChannelMention]: voiceMention,
        [commandNames.channelSetting]: channelSettingsHandler,
        [commandNames.uniqueChannelSetting]: uniqueChannelSettingsHandler,
        [commandNames.uniqueRoleSetting]: uniqueRoleSettingsHandler,
        [commandNames.variablesSettings]: variablesHandler,
        [commandNames.voice_pick]: handleVoicePick,
        [commandNames.ban]: handleBan,
        [commandNames.joinedDateFixer]: joinedAtFixer,
        [commandNames.festivalSettings]: festSettingHandler,
        [commandNames.experience]: handleIkabuExperience,
        [commandNames.voice]: handleTTSCommand,
        [commandNames.ch_manager]: channelManagerHandler,
    };

    try {
        if (
            interaction.commandName === commandNames.vclock &&
            !(interaction.replied || interaction.deferred)
        ) {
            await voiceLocker(interaction);
        } else {
            await cachedGuildCommandHandlers[interaction.commandName]?.(interaction);
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        const commandChannel = interaction.channel;
        if (exists(commandChannel)) {
            await commandChannel.send(ErrorTexts.UndefinedError);
        }
    }
}

async function CommandsHandler(interaction: ChatInputCommandInteraction<CacheType>) {
    const commandHandlers: Record<
        string,
        (interaction: ChatInputCommandInteraction<CacheType>) => Promise<unknown>
    > = {
        [commandNames.friend_code]: handleFriendCode,
        [commandNames.wiki]: handleWiki,
        [commandNames.kansen]: handleKansen,
        [commandNames.timer]: handleTimer,
        [commandNames.pick]: handlePick,
        [commandNames.buki]: handleBuki,
        [commandNames.show]: handleShow,
        [commandNames.help]: handleHelp,
    };

    try {
        await commandHandlers[interaction.commandName]?.(interaction);
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
