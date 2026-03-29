import { CacheType, ChatInputCommandInteraction } from 'discord.js';

import { commandNames } from '../../constant.js';
import { log4js_obj } from '../../log4js_settings.js';
import { exists } from '../common/others';
import { ErrorTexts } from '../constant/error_texts.js';
import { handleBan } from '../feat-admin/ban/ban';
import { channelManagerHandler } from '../feat-admin/channel_manager/channel_manager_handler.js';
import { channelSettingsHandler } from '../feat-admin/channel_settings/channel_settings_hanlder.js';
import { variablesHandler } from '../feat-admin/environment_variables/variables_handler';
import { festSettingHandler } from '../feat-admin/fest_setting/fest_settings.js';
import { joinedAtFixer } from '../feat-admin/joined_date_fixer/fix_joined_date.js';
import { shutdown } from '../feat-admin/shutdown/shutdown_process';
import { uniqueChannelSettingsHandler } from '../feat-admin/unique_channel_settings/unique_channel_settings_hanlder.js';
import { uniqueRoleSettingsHandler } from '../feat-admin/unique_role_settings/unique_role_settings_hanlder.js';
import { anarchyRecruit } from '../feat-recruit/create_recruit/anarchy_recruit.js';
import { eventRecruit } from '../feat-recruit/create_recruit/event_recruit.js';
import { festRecruit } from '../feat-recruit/create_recruit/fest_recruit.js';
import { regularRecruit } from '../feat-recruit/create_recruit/regular_recruit.js';
import { salmonRecruit } from '../feat-recruit/create_recruit/salmon_recruit.js';
import { buttonRecruit } from '../feat-recruit/interactions/commands/button_recruit.js';
import { closeCommand } from '../feat-recruit/interactions/commands/close.js';
import { otherGameRecruit } from '../feat-recruit/interactions/commands/other_game_recruit';
import { privateRecruit } from '../feat-recruit/interactions/commands/private_recruit';
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
    const { commandName } = interaction;

    try {
        if (commandName === commandNames.shutdown) {
            await shutdown(interaction);
        } else if (
            commandName === commandNames.vclock &&
            !(interaction.replied || interaction.deferred)
        ) {
            await voiceLocker(interaction);
        } else if (commandName === commandNames.close) {
            await closeCommand(interaction);
        } else if (commandName === commandNames.team_divider) {
            await dividerInitialMessage(interaction);
        } else if (commandName === commandNames.regular) {
            await regularRecruit(interaction);
        } else if (commandName === commandNames.anarchy) {
            await anarchyRecruit(interaction);
        } else if (commandName === commandNames.event) {
            await eventRecruit(interaction);
        } else if (commandName === commandNames.salmon) {
            await salmonRecruit(interaction);
        } else if (commandName === commandNames.fesA) {
            await festRecruit(interaction);
        } else if (commandName === commandNames.fesB) {
            await festRecruit(interaction);
        } else if (commandName === commandNames.fesC) {
            await festRecruit(interaction);
        } else if (commandName === commandNames.other_game) {
            await otherGameRecruit(interaction);
        } else if (commandName === commandNames.private) {
            await privateRecruit(interaction);
        } else if (commandName === commandNames.buttonRecruit) {
            await buttonRecruit(interaction);
        } else if (commandName === commandNames.voiceChannelMention) {
            await voiceMention(interaction);
        } else if (commandName === commandNames.channelSetting) {
            await channelSettingsHandler(interaction);
        } else if (commandName === commandNames.uniqueChannelSetting) {
            await uniqueChannelSettingsHandler(interaction);
        } else if (commandName === commandNames.uniqueRoleSetting) {
            await uniqueRoleSettingsHandler(interaction);
        } else if (commandName === commandNames.variablesSettings) {
            await variablesHandler(interaction);
        } else if (commandName == commandNames.voice_pick) {
            await handleVoicePick(interaction);
        } else if (commandName == commandNames.ban) {
            await handleBan(interaction);
        } else if (commandName == commandNames.joinedDateFixer) {
            await joinedAtFixer(interaction);
        } else if (commandName == commandNames.festivalSettings) {
            await festSettingHandler(interaction);
        } else if (commandName === commandNames.experience) {
            await handleIkabuExperience(interaction);
        } else if (commandName === commandNames.voice) {
            await handleTTSCommand(interaction);
        } else if (commandName == commandNames.ch_manager) {
            await channelManagerHandler(interaction);
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
    try {
        const { commandName } = interaction;

        if (commandName === commandNames.friend_code) {
            await handleFriendCode(interaction);
        } else if (commandName == commandNames.wiki) {
            await handleWiki(interaction);
        } else if (commandName == commandNames.kansen) {
            await handleKansen(interaction);
        } else if (commandName == commandNames.timer) {
            await handleTimer(interaction);
        } else if (commandName == commandNames.pick) {
            await handlePick(interaction);
        } else if (commandName == commandNames.buki) {
            await handleBuki(interaction);
        } else if (commandName == commandNames.show) {
            await handleShow(interaction);
        } else if (commandName == commandNames.help) {
            await handleHelp(interaction);
        }
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
