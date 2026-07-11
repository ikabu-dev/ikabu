import { Guild } from 'discord.js';

import { log4js_obj } from '@/infra/logging/log4js';
import { exists } from '@/shared/assert';
import { searchChannelById } from '@/shared/discord_helpers/channel_manager';

const logger = log4js_obj.getLogger('MessageManager');

/**
 * メッセージIDからメッセージを検索する．ない場合はnullを返す．
 * @param {string} guild Guildオブジェクト
 * @param {string} channelId チャンネルID
 * @param {string} messageId メッセージID
 * @returns メッセージオブジェクト
 */
export async function searchMessageById(guild: Guild, channelId: string, messageId: string) {
    const channel = await searchChannelById(guild, channelId);
    let message = null;
    if (exists(channel) && channel.isTextBased()) {
        try {
            // fetch(mid)とすれば、cache見てなければフェッチしてくる
            message = await channel.messages.fetch(messageId);
        } catch (error) {
            logger.warn('message missing');
        }
        return message;
    } else {
        logger.warn('message missing');
        return null;
    }
}
