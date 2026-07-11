import {
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
    SlashCommandStringOption,
    SlashCommandRoleOption,
} from 'discord.js';

import { RoleKeySet } from '@/app/constant/role_key';
import { commandNames } from '@/constant';

export const uniqueRoleSettings = new SlashCommandBuilder()
    .setName(commandNames.uniqueRoleSetting)
    .setDescription('固有ロールの設定ができます。')
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand.setName('全設定表示').setDescription('すべての固有ロールの設定を表示します。'),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('登録')
            .setDescription('固有ロールを設定します。')
            .addStringOption((option: SlashCommandStringOption) =>
                addUniqueRoleChoices(option)
                    .setName('設定項目')
                    .setDescription('設定する項目を選択してください。')
                    .setRequired(true),
            )
            .addRoleOption((option: SlashCommandRoleOption) =>
                option
                    .setName('ロール')
                    .setDescription('設定するロールを指定してください。')
                    .setRequired(true),
            ),
    )
    .addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
        subcommand
            .setName('解除')
            .setDescription('固有ロールの設定を解除します。')
            .addStringOption((option: SlashCommandStringOption) =>
                addUniqueRoleChoices(option)
                    .setName('設定項目')
                    .setDescription('設定を解除する項目を選択してください。')
                    .setRequired(true),
            ),
    )
    .setDMPermission(false);

function addUniqueRoleChoices(stringOption: SlashCommandStringOption) {
    for (const { name, key } of Object.values(RoleKeySet)) {
        stringOption.addChoices({ name: name, value: key });
    }
    return stringOption;
}
