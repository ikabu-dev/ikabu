import { ChatInputCommandInteraction } from 'discord.js';

import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { isChannelKey } from '@/config/constants/channel_key';
import { ChannelService } from '@/db/channel_service';
import { UniqueChannelService } from '@/db/unique_channel_service';
import { log4js_obj } from '@/log4js_settings';
import { assertExistCheck, exists, notExists } from '@/shared/assert';

const logger = log4js_obj.getLogger('interaction');

export async function unsetUniqueChannelCommand(
    interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
) {
    try {
        const options = interaction.options;
        const key = options.getString('設定項目', true);

        // keyがChannelKeyに存在するかチェック
        if (!isChannelKey(key)) {
            return await interaction.editReply({
                content: '存在しないキーが選択されたでし！',
            });
        }

        const storedChannelId = await UniqueChannelService.getChannelIdByKey(
            interaction.guildId,
            key,
        );

        if (notExists(storedChannelId)) {
            await interaction.editReply({
                content: 'その項目にはチャンネルが設定されていなかったでし！',
            });
            return;
        }

        const deletedChannel = await UniqueChannelService.delete(interaction.guildId, key);

        if (exists(deletedChannel)) {
            const channel = await ChannelService.getChannel(
                interaction.guildId,
                deletedChannel.channelId,
            );
            assertExistCheck(channel, 'storedChannel');
            await interaction.editReply({
                content: `\`${channel.name}\`を\`${key}\`の設定から解除したでし！`,
            });
        } else {
            await interaction.editReply({
                content: '設定の解除に失敗したでし！',
            });
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
