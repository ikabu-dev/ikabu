import { ChatInputCommandInteraction } from 'discord.js';

import { isChannelKey } from '@/config/constants/channel_key';
import { ChannelService } from '@/infra/db/repositories/channel_service';
import { UniqueChannelService } from '@/infra/db/repositories/unique_channel_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { assertExistCheck, notExists } from '@/shared/assert';

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

        // DB障害は throw されるようになったため、false は「解除する行が無かった」
        // (取得してから解除するまでの間に他の経路で解除された) を意味する
        const deleted = await UniqueChannelService.delete(interaction.guildId, key);

        if (!deleted) {
            await interaction.editReply({
                content: 'その項目は既に解除されていたでし！',
            });
            return;
        }

        const channel = await ChannelService.getChannel(interaction.guildId, storedChannelId);
        assertExistCheck(channel, 'storedChannel');
        await interaction.editReply({
            content: `\`${channel.name}\`を\`${key}\`の設定から解除したでし！`,
        });
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
