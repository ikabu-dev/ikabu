import fs from 'fs';

import { stringify } from 'csv-stringify/sync';
import {
    AttachmentBuilder,
    ChannelType,
    ChatInputCommandInteraction,
    PermissionsBitField,
} from 'discord.js';

import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { assertExistCheck, notExists } from '@/shared/assert';
import { searchChannelById } from '@/shared/discord_helpers/channel_manager';
import { getGuildByInteraction } from '@/shared/discord_helpers/guild_manager';
import { searchAPIMemberById } from '@/shared/discord_helpers/member_manager';

const logger = log4js_obj.getLogger('ChannelManager');

export async function handleDeleteChannel(
    interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
) {
    // 'インタラクションに失敗'が出ないようにするため
    await interaction.deferReply();

    const guild = await getGuildByInteraction(interaction);
    const member = await searchAPIMemberById(guild, interaction.member.user.id);
    assertExistCheck(member, 'member');

    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return await interaction.followUp('チャンネルを管理する権限がないでし！');
    }
    const { options } = interaction;
    const categoryIds = options.getString('チャンネルid', true);

    const strCmd = categoryIds.replace('\x20+', ' ');
    const splits = strCmd.split(' ');
    let channelIdList = [];
    for (const argument of splits) {
        if (argument != '') {
            channelIdList.push(argument);
        }
    }

    if (channelIdList.length == 0) {
        return await interaction.followUp('削除したいチャンネルのIDを入れるでし！');
    }

    await interaction.editReply('指定されたIDのチャンネルを削除中でし！\nちょっと待つでし！');

    const removed = [];

    removed.push(['チャンネルID', 'チャンネル名']);

    await interaction.editReply('0% 完了');

    channelIdList = Array.from(new Set(channelIdList));

    try {
        // i = index
        // removed[i][0] = deleted channel (id)
        // removed[i][1] = deleted channel (name)
        for (const i in channelIdList) {
            let channelName;
            const channel = await searchChannelById(guild, channelIdList[i]);
            // if channel ID is not found, consider as an error.
            if (notExists(channel)) {
                channelName = 'NOT_FOUND!';
            } else if (channel.type == ChannelType.GuildCategory) {
                channelName = 'THIS_IS_CATEGORY';
            } else {
                if (channel.type == ChannelType.GuildText) {
                    channelName = '#' + channel.name;
                } else if (channel.type == ChannelType.GuildVoice) {
                    channelName = '🔊' + channel.name;
                }
                await channel.delete();
                await guild.channels.fetch();
            }
            removed.push([channelIdList[i], channelName]);

            const progress = `${((+i + 1) / channelIdList.length) * 100}`;
            await interaction.editReply(parseInt(progress, 10) + '% 完了');
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        await interaction.followUp('チャンネル削除中にエラーでし！');
    }

    const csvString = stringify(removed);
    fs.writeFileSync('./temp/temp.csv', csvString);
    const attachment = new AttachmentBuilder('./temp/temp.csv', {
        name: 'removed_channel.csv',
    });

    await interaction.followUp({
        content:
            '操作が完了したでし！\nしゃべると長くなるから下に削除したチャンネルをまとめておいたでし！',
        files: [attachment],
    });
}
