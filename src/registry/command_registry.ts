import { banCommand } from '@/features/admin/commands/ban';
import { buttonEnablerCommand } from '@/features/admin/commands/button_enabler';
import { channelManagerCommand } from '@/features/admin/commands/channel_manager';
import { channelSettingsCommand } from '@/features/admin/commands/channel_settings';
import { festivalSettingsCommand } from '@/features/admin/commands/festival_settings';
import { joinedDateFixerCommand } from '@/features/admin/commands/joined_date_fixer';
import { shutdownCommand } from '@/features/admin/commands/shutdown';
import { uniqueChannelSettingsCommand } from '@/features/admin/commands/unique_channel_settings';
import { uniqueRoleSettingsCommand } from '@/features/admin/commands/unique_role_settings';
import { variablesSettingsCommand } from '@/features/admin/commands/variables_settings';
import { anarchyRecruitCommand } from '@/features/recruit/commands/anarchy';
import { buttonRecruitCommand } from '@/features/recruit/commands/button_recruit';
import { closeRecruitCommand } from '@/features/recruit/commands/close';
import { eventRecruitCommand } from '@/features/recruit/commands/event';
import { fesACommand } from '@/features/recruit/commands/fes_a';
import { fesBCommand } from '@/features/recruit/commands/fes_b';
import { fesCCommand } from '@/features/recruit/commands/fes_c';
import { otherGameCommand } from '@/features/recruit/commands/other_game';
import { privateRecruitCommand } from '@/features/recruit/commands/private';
import { raidersRecruitCommand } from '@/features/recruit/commands/raiders';
import { recruitEditorCommand } from '@/features/recruit/commands/recruit_editor';
import { regularRecruitCommand } from '@/features/recruit/commands/regular';
import { salmonRecruitCommand } from '@/features/recruit/commands/salmon';
import { bukiCommand } from '@/features/utils/commands/buki';
import { experienceCommand } from '@/features/utils/commands/experience';
import { friendCodeCommand } from '@/features/utils/commands/friend_code';
import { helpCommand } from '@/features/utils/commands/help';
import { kansenCommand } from '@/features/utils/commands/kansen';
import { pickCommand } from '@/features/utils/commands/pick';
import { showCommand } from '@/features/utils/commands/show';
import { teamDividerCommand } from '@/features/utils/commands/team_divider';
import { timerCommand } from '@/features/utils/commands/timer';
import { vclockCommand } from '@/features/utils/commands/vclock';
import { voiceCommand } from '@/features/utils/commands/voice';
import { voiceMentionCommand } from '@/features/utils/commands/voice_mention';
import { vpickCommand } from '@/features/utils/commands/vpick';
import { wikiCommand } from '@/features/utils/commands/wiki';

import type { ChatInputCommand, CommandModule, MessageContextMenuCommand } from './types';

/**
 * Bot が提供する全コマンド。
 *
 * この配列の順序がそのまま Discord への登録順になる。
 * コマンドを追加するときは、features/<機能>/commands/ にファイルを1つ作り、
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
