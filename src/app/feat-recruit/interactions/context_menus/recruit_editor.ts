import {
    ActionRowBuilder,
    MessageContextMenuCommandInteraction,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';

import { RecruitService } from '../../../../db/recruit_service';
import { log4js_obj } from '../../../../log4js_settings';
import { getGuildByInteraction } from '../../../common/manager/guild_manager';
import { notExists } from '../../../common/others';
import { sendErrorLogs } from '../../../logs/error/send_error_logs';

const logger = log4js_obj.getLogger('interaction');

export async function createRecruitEditor(
    interaction: MessageContextMenuCommandInteraction<'cached' | 'raw'>,
) {
    try {
        const guild = await getGuildByInteraction(interaction);
        const message = interaction.targetMessage;
        const messageId = message.id;
        const userId = interaction.member.user.id;

        const recruitData = await RecruitService.getRecruit(guild.id, messageId);

        if (notExists(recruitData)) {
            await interaction.reply({
                content:
                    '該当の募集が見つからなかったでし！\n参加条件が表示されている画像のメッセージに対して使用するでし！',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (recruitData.authorId !== userId) {
            await interaction.reply({ content: '他人の募集は編集できないでし！', flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.showModal(createRecruitEditorModal(messageId));
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}

function createRecruitEditorModal(messageId: string) {
    const modalParams = new URLSearchParams();
    modalParams.append('recm', 'recedit');
    modalParams.append('mid', messageId);

    const modal = new ModalBuilder().setCustomId(modalParams.toString()).setTitle('募集を編集');

    const remainingNumInput = new TextInputBuilder()
        .setCustomId('remaining')
        .setLabel('募集人数(あと何人？)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('例: 2')
        .setMaxLength(2)
        .setRequired(false);

    const conditionInput = new TextInputBuilder()
        .setCustomId('condition')
        .setLabel('参加条件')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('例: 21時まで えんじょい！')
        .setMaxLength(120)
        .setRequired(false);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(remainingNumInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(conditionInput);
    modal.addComponents(row1, row2);
    return modal;
}
