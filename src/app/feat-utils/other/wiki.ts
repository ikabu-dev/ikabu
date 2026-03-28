import {
    CacheType,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags,
} from 'discord.js';
import wiki from 'wikijs';

import { log4js_obj } from '../../../log4js_settings';
import { notExists } from '../../common/others';
import { sendErrorLogs } from '../../logs/error/send_error_logs';

export async function handleWiki(interaction: ChatInputCommandInteraction<CacheType>) {
    const logger = log4js_obj.getLogger('interaction');
    try {
        const { options } = interaction;
        const word = options.getString('キーワード');

        if (notExists(word)) {
            return await interaction.reply({
                content: 'キーワードが読み取れなかったでし！',
                flags: MessageFlags.Ephemeral,
            });
        }

        // 'インタラクションに失敗'が出ないようにするため
        await interaction.deferReply({});
        const wikipedia = wiki({ apiUrl: 'http://ja.wikipedia.org/w/api.php' });
        const data = await wikipedia.search(word);
        const page = await wikipedia.page(data.results[0]);
        const summary = await page.summary();
        const imageURL = await page.mainImage();
        const url = page.url();
        if (summary === '') {
            return await interaction.editReply('見つからなかったでし！');
        }
        const embed = new EmbedBuilder()
            .setTitle(page.raw.title)
            .setURL(decodeURI(url))
            .setColor(0xf02d7d)
            .addFields({
                name: '概要',
                value: summary.substring(0, 300),
            })
            .setImage(decodeURI(imageURL));

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
