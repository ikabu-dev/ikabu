import {
    ActionRowBuilder,
    ButtonInteraction,
    ChannelSelectMenuBuilder,
    ChannelType,
    LabelBuilder,
    ModalBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextInputBuilder,
    TextInputStyle,
    UserSelectMenuBuilder,
} from 'discord.js';

export async function createAnarchyModal(interaction: ButtonInteraction<'cached' | 'raw'>) {
    const modalParams = new URLSearchParams();
    modalParams.append('recm', 'anarec');

    const modal = new ModalBuilder()
        .setCustomId(modalParams.toString())
        .setTitle('バンカラ募集を作成');

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

    const scheduleNumLabel = new LabelBuilder()
        .setLabel('スケジュール')
        .setStringSelectMenuComponent(
            new StringSelectMenuBuilder()
                .setCustomId('scheduleNum')
                .setMinValues(1)
                .setMaxValues(1)
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('現在のスケジュール')
                        .setValue('now')
                        .setDefault(true),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('次のスケジュール')
                        .setValue('next'),
                ),
        );

    const attendeesLabel = new LabelBuilder()
        .setLabel('既にに決まっている参加者(最大2人)')
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

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(recruitNumInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(conditionInput);

    modal.addComponents(row1, row2, scheduleNumLabel, attendeesLabel, voiceChannelLabel);

    await interaction.showModal(modal);
}
