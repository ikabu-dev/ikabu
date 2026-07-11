import { AnyThreadChannel } from 'discord.js';

import { env } from '@/config/env';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { exists, notExists } from '@/shared/assert';

import { tagIdsEmbed } from './tag_ids_embed';

const logger = log4js_obj.getLogger('default');

export async function editThreadTag(thread: AnyThreadChannel) {
    try {
        if (notExists(env.tagIdSupportProgress) || notExists(env.tagIdSupportResolved)) {
            const embed = tagIdsEmbed(thread);
            if (exists(embed)) {
                await thread.send({ embeds: [embed] });
            }
            return;
        }

        const appliedTags = thread.appliedTags;
        appliedTags.push(env.tagIdSupportProgress);
        await thread.setAppliedTags(appliedTags, '質問対応開始');
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
