import { EmbedBuilder, Guild } from 'discord.js';

import { RecruitService, RecruitType } from '../../../../db/recruit_service';
import { log4js_obj } from '../../../../log4js_settings';
import { searchMessageById } from '../../../common/manager/message_manager';
import { assertExistCheck, notExists } from '../../../common/others';
import { sendErrorLogs } from '../../../logs/error/send_error_logs';

const logger = log4js_obj.getLogger('recruit');

export async function regenerateEmbed(
    guild: Guild,
    channelId: string,
    messageId: string,
    recruitType: number,
) {
    try {
        const message = await searchMessageById(guild, channelId, messageId);
        assertExistCheck(message, 'message');
        const oldEmbed = message.embeds[0];

        const recruitData = await RecruitService.getRecruit(guild.id, messageId);
        if (notExists(recruitData)) {
            logger.warn('embed was not regenerated! [recruitData was not found!]');
            return;
        }

        const condition = recruitData.condition;
        const recruitNum = recruitData.recruitNum;

        let conditionTitle;
        if (recruitType === RecruitType.PrivateRecruit) {
            conditionTitle = 'プラベ内容または参加条件';
        } else if (recruitType === RecruitType.OtherGameRecruit) {
            conditionTitle = '参加条件';
        }

        const newFields = [];
        for (const field of oldEmbed.fields) {
            if (field.name === conditionTitle) {
                newFields.push({ name: field.name, value: condition, inline: field.inline });
            } else if (field.name === '募集人数' && recruitNum != -1) {
                newFields.push({
                    name: field.name,
                    value: recruitNum.toString(),
                    inline: field.inline,
                });
            } else {
                newFields.push({ name: field.name, value: field.value, inline: field.inline });
            }
        }

        const newEmbed = EmbedBuilder.from(oldEmbed).setFields(newFields);
        await message.edit({ embeds: [newEmbed] });
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
