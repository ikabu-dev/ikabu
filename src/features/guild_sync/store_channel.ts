import { Client, NonThreadGuildBasedChannel } from 'discord.js';

import { ChannelService } from '@/infra/db/repositories/channel_service';
import { notExists } from '@/shared/assert';

export async function saveChannel(channel: NonThreadGuildBasedChannel) {
    await ChannelService.save(
        channel.guild.id,
        channel.id,
        channel.name,
        channel.type,
        channel.position,
        channel.parentId,
    );
}

export async function deleteChannel(channel: NonThreadGuildBasedChannel) {
    await ChannelService.delete(channel.guild.id, channel.id);
}

export async function saveChannelAtLaunch(client: Client) {
    const clientGuilds = client.guilds.cache;
    clientGuilds.forEach(async (guild) => {
        const channelCollection = await guild.channels.fetch();

        // チャンネルをDBに保存する
        channelCollection.forEach(async (channel) => {
            if (notExists(channel)) return;

            await ChannelService.save(
                guild.id,
                channel.id,
                channel.name,
                channel.type,
                channel.position,
                channel.parentId,
            );
        });

        // 削除されたチャンネルをDBから削除する
        const dbChannels = await ChannelService.getAllGuildChannels(guild.id);
        dbChannels.forEach(async (storedChannel) => {
            if (notExists(channelCollection.get(storedChannel.channelId))) {
                await ChannelService.delete(guild.id, storedChannel.channelId);
            }
        });
    });

    // 存在しないサーバーのチャンネルをDBから削除する
    const dbChannels = await ChannelService.getAllChannels();
    dbChannels.forEach(async (storedChannel) => {
        if (notExists(clientGuilds.get(storedChannel.guildId))) {
            await ChannelService.delete(storedChannel.guildId, storedChannel.channelId);
        }
    });
}
