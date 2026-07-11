import { AnyThreadChannel } from 'discord.js';

import { exists, notExists } from '@/app/common/others';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { log4js_obj } from '@/log4js_settings';

import { tagIdsEmbed } from './tag_ids_embed';

const logger = log4js_obj.getLogger('default');

export async function editThreadTag(thread: AnyThreadChannel) {
    try {
        if (
            notExists(process.env.TAG_ID_SUPPORT_PROGRESS) ||
            notExists(process.env.TAG_ID_SUPPORT_RESOLVED)
        ) {
            const embed = tagIdsEmbed(thread);
            if (exists(embed)) {
                await thread.send({ embeds: [embed] });
            }
            return;
        }

        const appliedTags = thread.appliedTags;
        appliedTags.push(process.env.TAG_ID_SUPPORT_PROGRESS);
        await thread.setAppliedTags(appliedTags, '質問対応開始');
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
