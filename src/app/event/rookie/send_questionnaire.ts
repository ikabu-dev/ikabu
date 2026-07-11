import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    DiscordAPIError,
    Message,
    MessageFlags,
} from 'discord.js';
import log4js from 'log4js';

import {
    disableThinkingButton,
    recoveryThinkingButton,
    setButtonDisable,
} from '@/app/common/button_components';
import { searchMessageById } from '@/app/common/manager/message_manager';
import { assertExistCheck, exists, notExists, sleep } from '@/app/common/others';
import { QuestionnaireParam } from '@/app/constant/button_id';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';

export async function questionnaireButtonHandler(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    questionnaireParam: QuestionnaireParam,
    params: URLSearchParams,
) {
    switch (questionnaireParam) {
        case QuestionnaireParam.Yes:
            await sendQuestionnaireFollowUp(interaction, params);
            break;
        case QuestionnaireParam.No:
            await disableQuestionnaireButtons(interaction, params);
            break;
        default:
            break;
    }
}

/**
 * アンケートに答えるか選択してもらうためのリプライを送信
 * @param {Message<true>} message リプライ元
 * @param {string} userId アンケートに答えるユーザーのID
 * @param {string} urlKey アンケートURLを格納している環境変数のキー名
 */
export async function sendIntentionConfirmReply(
    message: Message<true>,
    userId: string,
    urlKey: string,
) {
    const logger = log4js.getLogger('message');
    try {
        const buttons = questionnaireButton(userId, urlKey);
        assertExistCheck(buttons, 'questionnaire buttons');
        const sentReply = await message.reply({
            content:
                'よりよい環境づくりのために良ければアンケート調査に協力してほしいでし！\n' +
                '一度`答えない`を押すと再度回答することはできないので注意するでし！\n' +
                'このメッセージは通常2時間で削除されるでし！',
            components: [buttons],
        });
        await sleep(60 * 60 * 2);
        // リプライが残っているか確認 (手動以外で消えることはないはずだけど一応)
        const buttonCheck = await searchMessageById(
            message.guild,
            sentReply.channel.id,
            sentReply.id,
        );
        if (exists(buttonCheck)) {
            await buttonCheck.delete();
        } else {
            return;
        }
    } catch (error) {
        if (error instanceof DiscordAPIError && error.code === 50035) {
            // チャットがすぐに消されて処理が間に合わなかった時にエラーでると面倒なので警告のみ
            logger.warn('questionnaire was not sent. [ message missing! ]');
        } else {
            await sendErrorLogs(logger, error);
        }
    }
}

function questionnaireButton(userId: string, urlKey: string) {
    const logger = log4js.getLogger();
    try {
        const yesParams = new URLSearchParams();
        yesParams.append('q', QuestionnaireParam.Yes);
        yesParams.append('uid', userId);
        yesParams.append('type', urlKey); // 直接URLだと文字数が多すぎる可能性があるため

        const noParams = new URLSearchParams();
        noParams.append('q', QuestionnaireParam.No);
        noParams.append('uid', userId);

        const buttons = new ActionRowBuilder<ButtonBuilder>();
        buttons.addComponents([
            new ButtonBuilder()
                .setCustomId(yesParams.toString())
                .setLabel('答える')
                .setStyle(ButtonStyle.Danger),
        ]);
        buttons.addComponents([
            new ButtonBuilder()
                .setCustomId(noParams.toString())
                .setLabel('答えない')
                .setStyle(ButtonStyle.Primary),
        ]);
        return buttons;
    } catch (error) {
        void sendErrorLogs(logger, error);
    }
}

export async function sendQuestionnaireFollowUp(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    const logger = log4js.getLogger('interaction');
    if (!interaction.message.inGuild()) return;
    try {
        await interaction.update({
            components: setButtonDisable(interaction.message, interaction),
        });

        if (interaction.member.user.id !== params.get('uid')) {
            await interaction.followUp({
                content: '他人のアンケートに答えることはできないでし！',
                flags: MessageFlags.Ephemeral,
            });
            await interaction.message.edit({
                components: recoveryThinkingButton(interaction, '答える'),
            });
            return;
        }

        const urlKey = params.get('type') ?? '';

        const url = process.env[urlKey];
        if (notExists(url)) {
            throw new Error('アンケートURLが設定されていません');
        }

        const urlButton = new ActionRowBuilder<ButtonBuilder>();
        urlButton.addComponents([
            new ButtonBuilder().setURL(url).setLabel('回答画面へ行く').setStyle(ButtonStyle.Link),
        ]);

        await interaction.followUp({
            content:
                '協力ありがとうでし！\n' +
                'このメッセージはDiscordの再起動や画面遷移等によって消える場合があるでし！\n' +
                'すぐに答えない場合は先に回答画面に飛んでおくことをおすすめするでし！',
            components: [urlButton],
            flags: MessageFlags.Ephemeral,
        });

        await interaction.message.edit({
            components: disableThinkingButton(interaction, '答える'),
        });
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}

export async function disableQuestionnaireButtons(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    const logger = log4js.getLogger('interaction');
    if (!interaction.message.inGuild()) return;
    try {
        await interaction.update({
            components: setButtonDisable(interaction.message, interaction),
        });

        if (interaction.member.user.id !== params.get('uid')) {
            await interaction.followUp({
                content: 'あなたにこのボタンを押す権限はないでし！',
                flags: MessageFlags.Ephemeral,
            });
            await interaction.message.edit({
                components: recoveryThinkingButton(interaction, '答えない'),
            });
            return;
        }
        await interaction.message.edit({
            components: disableThinkingButton(interaction, '答えない'),
        });
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
