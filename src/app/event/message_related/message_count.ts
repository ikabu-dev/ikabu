import { Message } from 'discord.js';

import { exists } from '@/app/common/others';
import { MessageCountService } from '@/db/message_count_service';

export async function chatCountUp(msg: Message<true>) {
    const id = msg.author.id;
    const messageCount = await getMessageCount(id);
    await MessageCountService.save(id, messageCount);
}

async function getMessageCount(id: string) {
    let messageCount = 0;
    const result = await MessageCountService.getMemberByUserId(id);
    if (exists(result)) {
        messageCount = result.count + 1;
    }
    return messageCount;
}
