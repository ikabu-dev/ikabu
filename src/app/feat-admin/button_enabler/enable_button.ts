import {
    MessageContextMenuCommandInteraction,
    MessageFlags,
    PermissionsBitField,
} from 'discord.js';

import { setButtonEnable } from '@/app/common/button_components';
import { getGuildByInteraction } from '@/app/common/manager/guild_manager';
import { searchAPIMemberById } from '@/app/common/manager/member_manager';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { ErrorTexts } from '@/config/constants/error_texts';
import { log4js_obj } from '@/log4js_settings';
import { assertExistCheck, exists, notExists } from '@/shared/assert';

const logger = log4js_obj.getLogger('interaction');

export async function buttonEnable(
    interaction: MessageContextMenuCommandInteraction<'cached' | 'raw'>,
) {
    const guild = await getGuildByInteraction(interaction);
    const member = await searchAPIMemberById(guild, interaction.member.user.id);
    assertExistCheck(member, 'member');
    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return await interaction.reply({
            content: '操作を実行する権限がないでし！',
            flags: MessageFlags.Ephemeral,
        });
    }

    try {
        await interaction.deferReply({});

        const message = interaction.targetMessage;

        if (notExists(message)) {
            await interaction.editReply({
                content: '該当メッセージが見つからなかったでし！',
            });
            return;
        }

        await message.edit({ components: setButtonEnable(message) });

        await interaction.editReply({
            content:
                'ボタンを有効化したでし！\n最後に押されたボタンが考え中になっていても通常の処理は行われるはずでし！',
        });
    } catch (error) {
        await sendErrorLogs(logger, error);
        if (exists(interaction.channel)) {
            await interaction.channel.send(ErrorTexts.UndefinedError);
        }
    }
}
