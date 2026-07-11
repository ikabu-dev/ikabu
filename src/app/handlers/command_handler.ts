import { CacheType, ChatInputCommandInteraction } from 'discord.js';

import { commandNames } from '@/config/constants/commands';
import { ErrorTexts } from '@/config/constants/error_texts';
import { handleBan } from '@/features/admin/ban/ban';
import { channelManagerHandler } from '@/features/admin/channel_manager/channel_manager_handler';
import { channelSettingsHandler } from '@/features/admin/channel_settings/channel_settings_handler';
import { variablesHandler } from '@/features/admin/environment_variables/variables_handler';
import { festSettingHandler } from '@/features/admin/fest_setting/fest_settings';
import { joinedAtFixer } from '@/features/admin/joined_date_fixer/fix_joined_date';
import { shutdown } from '@/features/admin/shutdown/shutdown_process';
import { uniqueChannelSettingsHandler } from '@/features/admin/unique_channel_settings/unique_channel_settings_handler';
import { uniqueRoleSettingsHandler } from '@/features/admin/unique_role_settings/unique_role_settings_handler';
import { anarchyRecruit } from '@/features/recruit/create/anarchy_recruit';
import { buttonRecruit } from '@/features/recruit/create/button_recruit';
import { eventRecruit } from '@/features/recruit/create/event_recruit';
import { festRecruit } from '@/features/recruit/create/fest_recruit';
import { otherGameRecruit } from '@/features/recruit/create/other_game_recruit';
import { privateRecruit } from '@/features/recruit/create/private_recruit';
import { raidersRecruit } from '@/features/recruit/create/raiders_recruit';
import { regularRecruit } from '@/features/recruit/create/regular_recruit';
import { salmonRecruit } from '@/features/recruit/create/salmon_recruit';
import { closeCommand } from '@/features/recruit/interactions/close_recruit/close_command';
import { handleIkabuExperience } from '@/features/utils/other/experience';
import { handleFriendCode } from '@/features/utils/other/friendcode';
import { handleHelp } from '@/features/utils/other/help';
import { handleKansen } from '@/features/utils/other/kansen';
import { handlePick } from '@/features/utils/other/pick';
import { handleTimer } from '@/features/utils/other/timer';
import { handleWiki } from '@/features/utils/other/wiki';
import { handleBuki } from '@/features/utils/splat3/buki';
import { handleShow } from '@/features/utils/splat3/show';
import { dividerInitialMessage } from '@/features/utils/team_divider/divider';
import { handleTTSCommand } from '@/features/utils/voice/tts/discordjs_voice';
import { voiceLocker } from '@/features/utils/voice/voice_locker';
import { voiceMention } from '@/features/utils/voice/voice_mention';
import { handleVoicePick } from '@/features/utils/voice/vpick';
import { sendCommandLog } from '@/infra/logging/command_log';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { exists } from '@/shared/assert';

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
        } else if (commandName === commandNames.raiders) {
            await raidersRecruit(interaction);
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
