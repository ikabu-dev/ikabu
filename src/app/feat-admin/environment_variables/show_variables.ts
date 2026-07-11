import { AttachmentBuilder, ChatInputCommandInteraction } from 'discord.js';

import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { assertExistCheck } from '@/shared/assert';

const logger = log4js_obj.getLogger('interaction');

export async function showVariables(interaction: ChatInputCommandInteraction<'cached' | 'raw'>) {
    try {
        const env_file = new AttachmentBuilder('./.env', { name: 'env.txt' });

        await interaction.deleteReply();
        assertExistCheck(interaction.channel, 'channel');
        await interaction.channel?.send({
            content: '今の環境変数設定を表示するでし！',
            files: [env_file],
        });
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
