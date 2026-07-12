import { ApplicationCommandType, ContextMenuCommandBuilder } from 'discord.js';

import { createRecruitEditor } from '@/features/recruit/interactions/edit_recruit/recruit_editor';

import type { MessageContextMenuCommand } from '@/shared/command_types';

const recruitEditor = new ContextMenuCommandBuilder()
    .setName('募集を編集')
    .setType(ApplicationCommandType.Message)
    .setDMPermission(false);

export const recruitEditorCommand: MessageContextMenuCommand = {
    kind: 'contextMenu',
    definition: recruitEditor,
    execute: createRecruitEditor,
};
