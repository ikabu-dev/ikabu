import {
    ActionRowBuilder,
    ButtonInteraction,
    ChannelSelectMenuBuilder,
    ChannelType,
    LabelBuilder,
    ModalBuilder,
    StringSelectMenuBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';

import { X_POWER_BANDS } from '@/config/constants/recruit';

export async function createXMatchModal(interaction: ButtonInteraction<'cached' | 'raw'>) {
    const modal = new ModalBuilder()
        .setCustomId('recm=xrec')
        .setTitle('Xマッチ募集を作成')
        .addComponents(
            new LabelBuilder()
                .setLabel('スケジュール')
                .setStringSelectMenuComponent(
                    new StringSelectMenuBuilder()
                        .setCustomId('scheduleNum')
                        .addOptions(
                            { label: '現在のスケジュール', value: 'now', default: true },
                            { label: '次のスケジュール', value: 'next' },
                        ),
                ),
            new LabelBuilder().setLabel('遊ぶルールでのXパワー帯').setStringSelectMenuComponent(
                new StringSelectMenuBuilder()
                    .setCustomId('xPowerBand')
                    .setRequired(true)
                    .addOptions(...X_POWER_BANDS.map((band) => ({ label: band, value: band }))),
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('condition')
                    .setLabel('参加条件')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(120)
                    .setRequired(false),
            ),
            new LabelBuilder()
                .setLabel('使用するボイスチャンネル')
                .setChannelSelectMenuComponent(
                    new ChannelSelectMenuBuilder()
                        .setCustomId('voiceChannel')
                        .setChannelTypes(ChannelType.GuildVoice)
                        .setMinValues(0)
                        .setMaxValues(1)
                        .setRequired(false),
                ),
        );

    await interaction.showModal(modal);
}
