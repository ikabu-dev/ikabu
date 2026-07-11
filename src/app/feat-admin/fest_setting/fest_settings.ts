import { ChannelType, ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';

import { ChannelKeySet } from '@/config/constants/channel_key';
import { UniqueChannelService } from '@/infra/db/repositories/unique_channel_service';
import { notExists } from '@/shared/assert';
import { searchChannelById } from '@/shared/discord_helpers/channel_manager';

import { festEnd } from './fest_end';
import { festStart } from './fest_start';

export async function festSettingHandler(interaction: ChatInputCommandInteraction<'cached'>) {
    await interaction.deferReply({});

    const guild = interaction.guild;
    const member = interaction.member;

    if (notExists(member)) {
        return await interaction.editReply('メンバー情報が取得できなかったでし！');
    }

    // 権限チェック
    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return await interaction.editReply('チャンネルを管理する権限がないでし！');
    }

    const fesCategoryId = await UniqueChannelService.getChannelIdByKey(
        guild.id,
        ChannelKeySet.FestivalCategory.key,
    );

    // .envにカテゴリIDが設定されているかチェック
    if (notExists(fesCategoryId)) {
        return await interaction.editReply(
            ChannelKeySet.FestivalCategory.name + 'が設定されていないでし！',
        );
    }

    const categoryChannel = await searchChannelById(guild, fesCategoryId);

    if (notExists(categoryChannel) || categoryChannel.type !== ChannelType.GuildCategory) {
        return await interaction.editReply('カテゴリチャンネルが見つからないでし！');
    }

    const { options } = interaction;

    const subCommand = options.getSubcommand(true);

    switch (subCommand) {
        case '開始':
            await festStart(interaction, guild, categoryChannel);
            break;
        case '終了':
            await festEnd(interaction, guild, categoryChannel);
            break;
        default:
            break;
    }
}
