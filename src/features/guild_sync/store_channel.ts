import { Client, NonThreadGuildBasedChannel } from 'discord.js';

import { ChannelService } from '@/infra/db/repositories/channel_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { notExists } from '@/shared/assert';

const logger = log4js_obj.getLogger('database');

// channelCreate / channelUpdate / channelDelete から呼ばれる。
// 呼び出し元(gateway/events.ts)は await せず投げっぱなしにするため、
// ここで受け止めないと例外がそのまま unhandled rejection になる。
export async function saveChannel(channel: NonThreadGuildBasedChannel) {
    try {
        await ChannelService.save(
            channel.guild.id,
            channel.id,
            channel.name,
            channel.type,
            channel.position,
            channel.parentId,
        );
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}

export async function deleteChannel(channel: NonThreadGuildBasedChannel) {
    try {
        await ChannelService.delete(channel.guild.id, channel.id);
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}

export async function saveChannelAtLaunch(client: Client) {
    const clientGuilds = client.guilds.cache;

    // forEach(async ...) は返り値の Promise を捨てるため、呼び出し元が await しても
    // 完了が保証されず、例外も拾えない。逐次 await する。
    for (const guild of clientGuilds.values()) {
        const channelCollection = await guild.channels.fetch();

        // チャンネルをDBに保存する
        for (const channel of channelCollection.values()) {
            if (notExists(channel)) continue;

            await ChannelService.save(
                guild.id,
                channel.id,
                channel.name,
                channel.type,
                channel.position,
                channel.parentId,
            );
        }

        // 削除されたチャンネルをDBから削除する
        const dbChannels = await ChannelService.getAllGuildChannels(guild.id);
        for (const storedChannel of dbChannels) {
            if (notExists(channelCollection.get(storedChannel.channelId))) {
                await ChannelService.delete(guild.id, storedChannel.channelId);
            }
        }
    }

    // 存在しないサーバーのチャンネルをDBから削除する
    const dbChannels = await ChannelService.getAllChannels();
    for (const storedChannel of dbChannels) {
        if (notExists(clientGuilds.get(storedChannel.guildId))) {
            await ChannelService.delete(storedChannel.guildId, storedChannel.channelId);
        }
    }
}
