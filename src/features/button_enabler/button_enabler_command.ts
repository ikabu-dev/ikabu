import { ApplicationCommandType, ContextMenuCommandBuilder } from 'discord.js';

import { buttonEnable } from '@/features/button_enabler/enable_button';

import type { MessageContextMenuCommand } from '@/registry/types';

const buttonEnabler = new ContextMenuCommandBuilder()
    .setName('ボタンを有効化する')
    .setType(ApplicationCommandType.Message)
    .setDMPermission(false);

export const buttonEnablerCommand: MessageContextMenuCommand = {
    kind: 'contextMenu',
    definition: buttonEnabler,
    execute: buttonEnable,
};
