import { Recruit } from '@prisma/client';
import { ComponentType, EmbedBuilder, Guild, ModalSubmitInteraction } from 'discord.js';

import { getGuildByInteraction } from '@/app/common/manager/guild_manager';
import { searchDBMemberById } from '@/app/common/manager/member_manager';
import { sendEmbedsWebhook } from '@/app/common/webhook';
import { env } from '@/config/env';
import { log4js_obj } from '@/log4js_settings';
import { assertExistCheck, exists } from '@/shared/assert';

const logger = log4js_obj.getLogger('interaction');

export async function sendRecruitModalLog(interaction: ModalSubmitInteraction<'raw' | 'cached'>) {
    const guild = await getGuildByInteraction(interaction);
    const channel = interaction.channel;
    assertExistCheck(channel, 'channel');
    const channelName = channel.name;
    const authorId = interaction.member.user.id;
    const author = await searchDBMemberById(guild, authorId);
    const components = interaction.components;
    let commandLog = '';

    for (const subcomponents of components) {
        if (!('components' in subcomponents)) continue;
        const firstComponent = subcomponents.components[0];
        if (firstComponent.type === ComponentType.TextInput) {
            commandLog = commandLog + firstComponent.customId + ': ' + firstComponent.value + '\n';
        }
    }

    const embed = new EmbedBuilder();
    embed.setTitle('モーダルログ');
    if (exists(author)) {
        embed.setAuthor({
            name: `${author.displayName} [${interaction.member.user.id}]`,
            iconURL: author.iconUrl,
        });
    } else {
        logger.warn('No log generated due to missing author information');
    }
    embed.addFields([
        {
            name: '募集パラメータ',
            value: commandLog,
            inline: true,
        },
        {
            name: '使用チャンネル',
            value: channelName,
            inline: false,
        },
    ]);
    embed.setColor('#56C000');
    embed.setTimestamp(interaction.createdAt);
    assertExistCheck(env.commandLogWebhookUrl, 'COMMAND_LOG_WEBHOOK_URL');
    void sendEmbedsWebhook(env.commandLogWebhookUrl, [embed]);
}

export async function sendEditRecruitLog(
    guild: Guild,
    oldRecruitData: Recruit,
    newRecruitData: Recruit,
    editedAt: Date,
) {
    const recruiterId = newRecruitData.authorId;
    const recruiter = await searchDBMemberById(guild, recruiterId);

    const embed = new EmbedBuilder();
    embed.setTitle('募集内容編集ログ');
    if (exists(recruiter)) {
        embed.setAuthor({
            name: `${recruiter.displayName} [${recruiterId}]`,
            iconURL: recruiter.iconUrl,
        });
    } else {
        logger.warn('No log generated due to missing author information');
    }
    embed.addFields([
        {
            name: '募集人数',
            value: oldRecruitData.recruitNum + ' -> ' + newRecruitData.recruitNum,
            inline: true,
        },
        {
            name: 'FROM',
            value: oldRecruitData.condition,
            inline: false,
        },
        {
            name: 'TO',
            value: newRecruitData.condition,
            inline: false,
        },
    ]);
    embed.setColor('#0070BB');
    embed.setTimestamp(editedAt);
    assertExistCheck(env.commandLogWebhookUrl, 'COMMAND_LOG_WEBHOOK_URL');
    void sendEmbedsWebhook(env.commandLogWebhookUrl, [embed]);
}
