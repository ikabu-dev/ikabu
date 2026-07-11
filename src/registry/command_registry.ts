import { banCommand } from '@/features/ban/ban_command';
import { buttonRecruitCommand } from '@/features/recruit/create/button_recruit_command';
import { closeRecruitCommand } from '@/features/recruit/interactions/close_recruit/close_command';
import { eventRecruitCommand } from '@/features/recruit/create/event_recruit_command';
import { fesACommand } from '@/features/recruit/create/fes_a_command';
import { fesBCommand } from '@/features/recruit/create/fes_b_command';
import { fesCCommand } from '@/features/recruit/create/fes_c_command';
import { otherGameCommand } from '@/features/recruit/create/other_game_recruit_command';
import { privateRecruitCommand } from '@/features/recruit/create/private_recruit_command';
import { raidersRecruitCommand } from '@/features/recruit/create/raiders_recruit_command';
import { recruitEditorCommand } from '@/features/recruit/interactions/edit_recruit/recruit_editor_command';
import { regularRecruitCommand } from '@/features/recruit/create/regular_recruit_command';
import { salmonRecruitCommand } from '@/features/recruit/create/salmon_recruit_command';
import { bukiCommand } from '@/features/buki/buki_command';
import { buttonEnablerCommand } from '@/features/button_enabler/button_enabler_command';
import { channelManagerCommand } from '@/features/channel_manager/channel_manager_command';
import { channelSettingsCommand } from '@/features/channel_settings/channel_settings_command';
import { variablesSettingsCommand } from '@/features/environment_variables/variables_settings_command';
import { experienceCommand } from '@/features/experience/experience_command';
import { festivalSettingsCommand } from '@/features/fest_setting/festival_settings_command';
import { friendCodeCommand } from '@/features/friend_code/friend_code_command';
import { helpCommand } from '@/features/help/help_command';
import { joinedDateFixerCommand } from '@/features/joined_date_fixer/joined_date_fixer_command';
import { kansenCommand } from '@/features/kansen/kansen_command';
import { pickCommand } from '@/features/pick/pick_command';
import { anarchyRecruitCommand } from '@/features/recruit/create/anarchy_recruit_command';
import { shutdownCommand } from '@/features/shutdown/shutdown_command';
import { showCommand } from '@/features/stage_info/show_command';
import { teamDividerCommand } from '@/features/team_divider/team_divider_command';
import { timerCommand } from '@/features/timer/timer_command';
import { uniqueChannelSettingsCommand } from '@/features/unique_channel_settings/unique_channel_settings_command';
import { uniqueRoleSettingsCommand } from '@/features/unique_role_settings/unique_role_settings_command';
import { voiceCommand } from '@/features/voice/tts/voice_command';
import { vclockCommand } from '@/features/voice/vclock_command';
import { voiceMentionCommand } from '@/features/voice/voice_mention_command';
import { vpickCommand } from '@/features/voice/vpick_command';
import { wikiCommand } from '@/features/wiki/wiki_command';

import type { ChatInputCommand, CommandModule, MessageContextMenuCommand } from './types';

/**
 * Bot が提供する全コマンド。
 *
 * この配列の順序がそのまま Discord への登録順になる。
 * コマンドを追加するときは、その機能のフォルダに <コマンド名>_command.ts を作り、
 * この配列に1行足すだけでよい(登録もディスパッチも自動で追従する)。
 */
export const commands: CommandModule[] = [
    shutdownCommand,
    vclockCommand,
    friendCodeCommand,
    wikiCommand,
    kansenCommand,
    teamDividerCommand,
    timerCommand,
    pickCommand,
    vpickCommand,
    bukiCommand,
    showCommand,
    helpCommand,
    banCommand,
    channelManagerCommand,
    experienceCommand,
    voiceCommand,
    closeRecruitCommand,
    otherGameCommand,
    buttonRecruitCommand,
    privateRecruitCommand,
    regularRecruitCommand,
    eventRecruitCommand,
    anarchyRecruitCommand,
    salmonRecruitCommand,
    raidersRecruitCommand,
    fesACommand,
    fesBCommand,
    fesCCommand,
    buttonEnablerCommand,
    recruitEditorCommand,
    voiceMentionCommand,
    channelSettingsCommand,
    uniqueChannelSettingsCommand,
    uniqueRoleSettingsCommand,
    variablesSettingsCommand,
    joinedDateFixerCommand,
    festivalSettingsCommand,
];

export const chatInputCommands: ChatInputCommand[] = commands.filter(
    (command): command is ChatInputCommand => command.kind === 'chatInput',
);

export const messageContextMenuCommands: MessageContextMenuCommand[] = commands.filter(
    (command): command is MessageContextMenuCommand => command.kind === 'contextMenu',
);
