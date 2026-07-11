import { Message } from 'discord.js';

import { MessageCountService } from '@/infra/db/repositories/message_count_service';
import { exists } from '@/shared/assert';

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
