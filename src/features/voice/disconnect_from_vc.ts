import { Client } from 'discord.js';

import { log4js_obj } from '@/infra/logging/log4js';
import { exists, notExists } from '@/shared/assert';
import { searchAPIMemberById } from '@/shared/discord_helpers/member_manager';

const logger = log4js_obj.getLogger();

/**
 * 起動時に、前回の停止で残ってしまったボイスチャンネル接続を切る。
 */
export async function disconnectFromVC(client: Client<true>) {
    // ギルド（サーバー）ごとに処理
    client.guilds.cache.forEach(async (guild) => {
        const botMember = await searchAPIMemberById(guild, client.user.id);
        if (notExists(botMember)) return;
        // ボイスチャンネルにBotが接続しているか確認
        const voiceState = botMember.voice;
        const voiceChannel = voiceState.channel;
        if (exists(voiceChannel) && voiceChannel.isVoiceBased()) {
            logger.info(`Disconnecting from 🔊${voiceChannel.name} in ${guild.name}`);
            await voiceState.disconnect(); // ボイスチャンネルから切断
        }
    });
}
