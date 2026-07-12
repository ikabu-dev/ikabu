import { AnyThreadChannel } from 'discord.js';

import { ChannelKeySet } from '@/config/constants/channel_key';
import { editThreadTag } from '@/features/support_tag/edit_tag';
import { sendCloseButton } from '@/features/support_tag/send_support_close_button';
import { UniqueChannelService } from '@/infra/db/repositories/unique_channel_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { exists } from '@/shared/assert';

const logger = log4js_obj.getLogger('threadCreate');

/**
 * サポートセンター配下にスレッドが立ったら、タグを付けて解決ボタンを送る。
 *
 * 呼び出し元(gateway/events.ts)は await せず投げっぱなしにするため、
 * ここで受け止めないと例外がそのまま unhandled rejection になる。
 */
export async function handleThreadCreate(thread: AnyThreadChannel) {
    try {
        const supportChannelId = await UniqueChannelService.getChannelIdByKey(
            thread.guildId,
            ChannelKeySet.SupportCenter.key,
        );
        if (exists(thread.parentId) && thread.parentId === supportChannelId) {
            await editThreadTag(thread);
            await sendCloseButton(thread);
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
