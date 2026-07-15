import { Client } from 'discord.js';

import { log4js_obj } from '@/infra/logging/log4js';
import { exists, notExists } from '@/shared/assert';
import { searchAPIMemberById } from '@/shared/discord_helpers/member_manager';

const logger = log4js_obj.getLogger();

/**
 * 起動時に、前回の停止で残ってしまったボイスチャンネル接続を切る。
 */
export async function disconnectFromVC(client: Client<true>) {
    // forEach(async ...) は返り値の Promise を捨てるため、呼び出し元(起動時の
    // ready_handler)が await しても切断の完了は保証されず、ループ内の例外も
    // 握り潰されていた。逐次 await する。
    for (const guild of client.guilds.cache.values()) {
        const botMember = await searchAPIMemberById(guild, client.user.id);
        if (notExists(botMember)) continue;
        // ボイスチャンネルにBotが接続しているか確認
        const voiceState = botMember.voice;
        const voiceChannel = voiceState.channel;
        if (exists(voiceChannel) && voiceChannel.isVoiceBased()) {
            logger.info(`Disconnecting from 🔊${voiceChannel.name} in ${guild.name}`);
            await voiceState.disconnect(); // ボイスチャンネルから切断
        }
    }
}
