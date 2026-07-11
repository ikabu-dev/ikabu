import {
    ActionRow,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonComponent,
    ButtonInteraction,
    CacheType,
    ComponentType,
    Message,
    MessageActionRowComponent,
} from 'discord.js';

import { env } from '@/config/env';
import { assertExistCheck, exists } from '@/shared/assert';

/**
 * 考え中ボタンのラベルを更新してボタンを有効化する
 * @param {*} interaction ボタンを押したときのinteraction
 * @param {*} label 押されたボタンに割り当て直すラベル
 * @returns 新しいActionRowオブジェクト
 */
export function recoveryThinkingButton(interaction: ButtonInteraction<CacheType>, label: string) {
    const message = interaction.message;
    const newActionRow = (message.components as ActionRow<MessageActionRowComponent>[]).map(
        (oldActionRow: ActionRow<MessageActionRowComponent>) => {
            const updatedActionRow = new ActionRowBuilder<ButtonBuilder>();

            updatedActionRow.addComponents(
                oldActionRow.components
                    .filter(
                        (component): component is ButtonComponent =>
                            component.type === ComponentType.Button,
                    )
                    .map((buttonComponent: ButtonComponent) => {
                        if (interaction.customId === buttonComponent.customId) {
                            const newButton = new ButtonBuilder();
                            newButton.setLabel(label);
                            newButton.setCustomId(buttonComponent.customId);
                            newButton.setStyle(buttonComponent.style);
                            newButton.setDisabled(false);
                            return newButton;
                        } else {
                            const newButton = ButtonBuilder.from(buttonComponent);
                            newButton.setDisabled(false);
                            return newButton;
                        }
                    }),
            );
            return updatedActionRow;
        },
    );
    return newActionRow;
}

/**
 * 考え中ボタンのラベルを更新してボタンを無効化する
 * @param {*} interaction ボタンを押したときのinteraction
 * @param {*} label 押されたボタンに割り当て直すラベル
 * @returns 新しいActionRowオブジェクト
 */
export function disableThinkingButton(interaction: ButtonInteraction<CacheType>, label: string) {
    const message = interaction.message;
    const newActionRow = (message.components as ActionRow<MessageActionRowComponent>[]).map(
        (oldActionRow: ActionRow<MessageActionRowComponent>) => {
            const updatedActionRow = new ActionRowBuilder<ButtonBuilder>();

            updatedActionRow.addComponents(
                oldActionRow.components
                    .filter(
                        (component): component is ButtonComponent =>
                            component.type === ComponentType.Button,
                    )
                    .map((buttonComponent: ButtonComponent) => {
                        if (interaction.customId === buttonComponent.customId) {
                            const newButton = new ButtonBuilder();
                            newButton.setLabel(label);
                            if (buttonComponent.customId)
                                newButton.setCustomId(buttonComponent.customId);
                            if (buttonComponent.style) newButton.setStyle(buttonComponent.style);
                            newButton.setDisabled(true);
                            return newButton;
                        } else {
                            const newButton = ButtonBuilder.from(buttonComponent);
                            newButton.setDisabled(true);
                            return newButton;
                        }
                    }),
            );
            return updatedActionRow;
        },
    );
    return newActionRow;
}

/**
 * メッセージに含まれる全てのButtonComponentsを有効化する
 * @param {*} message ボタンが含まれるmessageオブジェクト
 * @returns 新しいActionRowオブジェクト
 */
export function setButtonEnable(message: Message<boolean>) {
    const newActionRow = (message.components as ActionRow<MessageActionRowComponent>[]).map(
        (oldActionRow: ActionRow<MessageActionRowComponent>) => {
            const updatedActionRow = new ActionRowBuilder<ButtonBuilder>();

            updatedActionRow.addComponents(
                oldActionRow.components
                    .filter(
                        (component): component is ButtonComponent =>
                            component.type === ComponentType.Button,
                    )
                    .map((buttonComponent: ButtonComponent) => {
                        const newButton = ButtonBuilder.from(buttonComponent);
                        newButton.setDisabled(false);
                        return newButton;
                    }),
            );
            return updatedActionRow;
        },
    );
    return newActionRow;
}

/**
 * ButtonComponentsを無効化する
 * @param {*} message ボタンが含まれるmessageオブジェクト
 * @param {*} interaction 考え中にする場合押されたボタンのインタラクション
 * @returns 新しいActionRowオブジェクト
 */
export function setButtonDisable(
    message: Message<boolean>,
    interaction?: ButtonInteraction<CacheType>,
) {
    const newActionRow = (message.components as ActionRow<MessageActionRowComponent>[]).map(
        (oldActionRow: ActionRow<MessageActionRowComponent>) => {
            const updatedActionRow = new ActionRowBuilder<ButtonBuilder>();

            updatedActionRow.addComponents(
                oldActionRow.components
                    .filter(
                        (component): component is ButtonComponent =>
                            component.type === ComponentType.Button,
                    )
                    .map((buttonComponent: ButtonComponent) => {
                        let newButton;
                        if (
                            exists(interaction) &&
                            interaction.customId === buttonComponent.customId
                        ) {
                            assertExistCheck(env.recruitLoadingEmojiId);
                            newButton = new ButtonBuilder();
                            if (buttonComponent.style) newButton.setStyle(buttonComponent.style);
                            if (buttonComponent.customId)
                                newButton.setCustomId(buttonComponent.customId);
                            newButton.setEmoji(env.recruitLoadingEmojiId);
                            newButton.setDisabled(true);
                        } else {
                            newButton = ButtonBuilder.from(buttonComponent);
                            newButton.setDisabled(true);
                        }
                        return newButton;
                    }),
            );
            return updatedActionRow;
        },
    );
    return newActionRow;
}
