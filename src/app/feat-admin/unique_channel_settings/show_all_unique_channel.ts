import { ChatInputCommandInteraction } from 'discord.js';

import { notExists } from '@/app/common/others';
import { ChannelKeySet, getUniqueChannelNameByKey } from '@/app/constant/channel_key';
import { UniqueChannelService } from '@/db/unique_channel_service';

export async function showAllUniqueChannelSettings(
    interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
) {
    const uniqueChannels = await UniqueChannelService.getAllUniqueChannels(interaction.guildId);

    let message =
        `設定済みの項目を表示するでし！` +
        `[${uniqueChannels.length}/${Object.values(ChannelKeySet).length}]\n`;

    for (const uniqueChannel of uniqueChannels) {
        const keyName = getUniqueChannelNameByKey(uniqueChannel.key);

        if (notExists(keyName)) {
            message += `- \`${uniqueChannel.key}\`: \`keyName missing.\`\n`;
        } else {
            message += `- **${keyName}**: <#${uniqueChannel.channelId}>\n`;
        }
    }

    await interaction.editReply(message);
}
