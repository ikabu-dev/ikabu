import { Channel } from '@prisma/client';
import {
    ChannelType,
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionsBitField,
} from 'discord.js';

import { adminChannelSetting } from '@/features/channel_settings/admin_channel_setting';
import { vcToolsSetting } from '@/features/channel_settings/vcTools_setting';
import { ChannelService } from '@/infra/db/repositories/channel_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { exists, notExists } from '@/shared/assert';

const logger = log4js_obj.getLogger('interaction');

export async function channelSettingsHandler(interaction: ChatInputCommandInteraction<'cached'>) {
    try {
        await interaction.deferReply({});

        const guild = interaction.guild;
        const member = interaction.member;

        if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return await interaction.editReply({
                content: 'チャンネルを管理する権限がないでし！',
            });
        }

        const options = interaction.options;
        const isVCToolsEnabled = options.getBoolean('vctoolsを使用する', false);
        const isAdminChannel = options.getBoolean('管理者限定チャンネルとして設定する', false);
        const targetChannel = options.getChannel('チャンネル', false) ?? interaction.channel;

        if (notExists(targetChannel)) {
            return await interaction.editReply({
                content: 'チャンネルまたはカテゴリが見つからなかったでし！',
            });
        }

        let storedChannel: Channel | null = null;

        if (exists(isVCToolsEnabled)) {
            const result = await vcToolsSetting(interaction, targetChannel, isVCToolsEnabled);
            if (notExists(result)) {
                await interaction.followUp({
                    content: 'VCToolsの設定に失敗したでし！',
                });
            } else {
                storedChannel = result;
            }
        }

        if (exists(isAdminChannel)) {
            const result = await adminChannelSetting(interaction, targetChannel, isAdminChannel);
            if (notExists(result)) {
                await interaction.followUp({
                    content: '管理者限定チャンネルの設定に失敗したでし！',
                });
            } else {
                storedChannel = result;
            }
        }

        if (exists(storedChannel)) {
            await interaction.editReply({
                content: '設定を更新したでし！\n',
            });
        } else {
            storedChannel = await ChannelService.getChannel(guild.id, targetChannel.id);
            await interaction.editReply({
                content: '設定を表示するでし！\n',
            });
        }

        if (notExists(storedChannel)) {
            return await interaction.followUp({
                content: 'チャンネル情報が見つからなかったでし！',
            });
        }

        let channelType = 'チャンネル';

        if (storedChannel.type === ChannelType.GuildCategory) {
            channelType = 'カテゴリ';
        }

        const embed = new EmbedBuilder();
        embed.setTitle(channelType + '設定');
        embed.setDescription(`<#${storedChannel.channelId}>`);
        embed.addFields(
            {
                name: 'VCTools',
                value: storedChannel.isVCToolsEnabled ? '使用する' : '使用しない',
            },
            {
                name: '管理者限定',
                value: storedChannel.isAdminChannel ? 'はい' : 'いいえ',
            },
        );
        if (channelType === 'カテゴリ') {
            embed.setFooter({
                text: 'カテゴリに含まれるチャンネルはすべて同じ設定が継承されます。',
            });
        }

        await interaction.followUp({
            embeds: [embed],
        });
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
