import { Guild, MessagePayload, MessageCreateOptions } from 'discord.js';

import { StickyKey } from '@/config/constants/sticky_key';
import { StickyService } from '@/infra/db/repositories/sticky_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { searchChannelById } from '@/shared/discord_helpers/channel_manager';
import { searchMessageById } from '@/shared/discord_helpers/message_manager';

const logger = log4js_obj.getLogger('message');

type AsyncVoidFunction = () => Promise<void>;

// キューを管理する変数
const messageQueue: AsyncVoidFunction[] = [];

let isProcessing = false;

export async function processQueue() {
    if (isProcessing) return;
    isProcessing = true;

    while (messageQueue.length > 0) {
        const task = messageQueue.shift();
        if (task) {
            await task();
        }
    }

    isProcessing = false;
}

/**
 * StickyMessageを送信する
 * @param guild 送信するサーバーのGuildオブジェクト
 * @param channelId 送信するチャンネルID
 * @param key 同一チャンネルでの識別子
 * @param content 送信するコンテンツ
 */
export async function sendStickyMessage(
    guild: Guild,
    channelId: string,
    key: StickyKey,
    content: string | MessagePayload | MessageCreateOptions,
) {
    const task: AsyncVoidFunction = async () => {
        const lastStickyMsgId = await StickyService.getMessageId(guild.id, channelId, key);
        if (lastStickyMsgId) {
            const lastStickyMsg = await searchMessageById(guild, channelId, lastStickyMsgId);
            if (lastStickyMsg) {
                try {
                    await lastStickyMsg.delete();
                } catch (error) {
                    logger.warn(`last sticky message not found! [${lastStickyMsgId}]`);
                }
            }
        }
        const channel = await searchChannelById(guild, channelId);
        if (channel && channel.isTextBased()) {
            const stickyMessage = await channel.send(content);
            await StickyService.registerMessageId(guild.id, channelId, key, stickyMessage.id);
        }
    };

    // キューにタスクを追加
    messageQueue.push(task);

    // キューの処理を開始（すでに処理中であれば何もしない）
    await processQueue();
}
