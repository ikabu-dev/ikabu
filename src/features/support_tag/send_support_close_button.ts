import {
    ActionRowBuilder,
    AnyThreadChannel,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} from 'discord.js';

import { SupportCloseButton } from '@/config/constants/button_id';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';

const logger = log4js_obj.getLogger('default');

export async function sendCloseButton(thread: AnyThreadChannel) {
    try {
        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents([
            new ButtonBuilder()
                .setCustomId(SupportCloseButton.Resolved)
                .setLabel('回答終了(クローズ)')
                .setStyle(ButtonStyle.Success),
        ]);

        const embed = new EmbedBuilder();
        embed.setTitle('サポートの開始');
        embed.setDescription(
            '回答がつくまで待つでし！\n管理者は質問の回答や問題の解決が終わったら回答終了ボタンを押すでし！',
        );
        await thread.send({ embeds: [embed], components: [buttons] });
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
