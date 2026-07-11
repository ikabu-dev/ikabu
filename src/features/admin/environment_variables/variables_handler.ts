import { ChatInputCommandInteraction, MessageFlags, PermissionsBitField } from 'discord.js';

import { deleteVariables } from '@/features/admin/environment_variables/delete_variables';
import { setVariables } from '@/features/admin/environment_variables/set_variables';
import { showVariables } from '@/features/admin/environment_variables/show_variables';
import { ChannelService } from '@/infra/db/repositories/channel_service';
import { notExists } from '@/shared/assert';

export async function variablesHandler(interaction: ChatInputCommandInteraction<'cached'>) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const guild = interaction.guild;
    const member = interaction.member;

    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return await interaction.editReply({
            content: 'チャンネルを管理する権限がないでし！',
        });
    }

    const storedChannel = await ChannelService.getChannel(guild.id, interaction.channelId);

    if (notExists(storedChannel)) {
        return await interaction.editReply({
            content: 'このチャンネルの情報を取得できないでし！',
        });
    }

    if (!storedChannel.isAdminChannel) {
        return await interaction.editReply({
            content: 'このチャンネルでは使えないでし！',
        });
    }

    switch (interaction.options.getSubcommand()) {
        case '表示':
            void showVariables(interaction);
            break;
        case '登録更新':
            void setVariables(interaction);
            break;
        case '削除':
            void deleteVariables(interaction);
            break;
    }
}
