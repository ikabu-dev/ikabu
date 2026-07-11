import { AnyThreadChannel } from 'discord.js';

import { ChannelKeySet } from '@/config/constants/channel_key';
import { editThreadTag } from '@/features/support_tag/edit_tag';
import { sendCloseButton } from '@/features/support_tag/send_support_close_button';
import { UniqueChannelService } from '@/infra/db/repositories/unique_channel_service';
import { exists } from '@/shared/assert';

/** サポートセンター配下にスレッドが立ったら、タグを付けて解決ボタンを送る */
export async function handleThreadCreate(thread: AnyThreadChannel) {
    const supportChannelId = await UniqueChannelService.getChannelIdByKey(
        thread.guildId,
        ChannelKeySet.SupportCenter.key,
    );
    if (exists(thread.parentId) && thread.parentId === supportChannelId) {
        await editThreadTag(thread);
        await sendCloseButton(thread);
    }
}
