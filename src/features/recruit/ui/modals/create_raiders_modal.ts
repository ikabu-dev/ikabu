import {
    ActionRowBuilder,
    ButtonInteraction,
    ChannelSelectMenuBuilder,
    ChannelType,
    LabelBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    UserSelectMenuBuilder,
} from 'discord.js';

export async function createRaidersModal(interaction: ButtonInteraction<'cached' | 'raw'>) {
    const modalParams = new URLSearchParams();
    modalParams.append('recm', 'rairec');

    const modal = new ModalBuilder()
        .setCustomId(modalParams.toString())
        .setTitle('レイダース募集を作成');

    const recruitNumInput = new TextInputBuilder()
        .setCustomId('rNum')
        .setLabel('募集人数')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('例: 2')
        .setMaxLength(1)
        .setRequired(true);

    const conditionInput = new TextInputBuilder()
        .setCustomId('condition')
        .setLabel('参加条件')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('例: 21時まで えんじょい！')
        .setMaxLength(120)
        .setRequired(true);

    const attendeesLabel = new LabelBuilder()
        .setLabel('既に決まっている参加者(最大2人)')
        .setUserSelectMenuComponent(
            new UserSelectMenuBuilder()
                .setCustomId('attendees')
                .setMinValues(0)
                .setMaxValues(2)
                .setRequired(false),
        );

    const voiceChannelLabel = new LabelBuilder()
        .setLabel('使用するボイスチャンネル')
        .setChannelSelectMenuComponent(
            new ChannelSelectMenuBuilder()
                .setCustomId('voiceChannel')
                .setChannelTypes(ChannelType.GuildVoice)
                .setMinValues(0)
                .setMaxValues(1)
                .setRequired(false),
        );

    const actionRow1 = new ActionRowBuilder<TextInputBuilder>().addComponents(recruitNumInput);
    const actionRow2 = new ActionRowBuilder<TextInputBuilder>().addComponents(conditionInput);

    modal.addComponents(actionRow1, actionRow2, attendeesLabel, voiceChannelLabel);

    await interaction.showModal(modal);
}
