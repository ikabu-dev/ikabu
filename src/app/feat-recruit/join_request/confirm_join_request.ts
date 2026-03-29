import { ButtonInteraction, EmbedBuilder, MessageFlags } from 'discord.js';

import { memberListText } from '../interactions/buttons/other_events';
import { ParticipantMember, ParticipantService } from '../../../db/participant_service';
import { RecruitService } from '../../../db/recruit_service';
import { log4js_obj } from '../../../log4js_settings';
import { recoveryThinkingButton } from '../../common/button_components';
import { searchChannelById } from '../../common/manager/channel_manager';
import { getGuildByInteraction } from '../../common/manager/guild_manager';
import { searchAPIMemberById, searchDBMemberById } from '../../common/manager/member_manager';
import { searchMessageById } from '../../common/manager/message_manager';
import { assertExistCheck, exists, notExists } from '../../common/others';
import { sendStickyMessage } from '../../common/sticky_message';
import { RecruitParam } from '../../constant/button_id';
import { ErrorTexts } from '../../constant/error_texts';
import { StickyKey } from '../../constant/sticky_key';
import { sendErrorLogs } from '../../logs/error/send_error_logs';
import { RecruitOpCode, regenerateCanvas } from '../canvases/regenerate_canvas';
import { availableRecruitString } from '../sticky/recruit_sticky_messages';

const logger = log4js_obj.getLogger('recruitButton');

export async function confirmJoinRequest(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    try {
        const guild = await getGuildByInteraction(interaction);
        const recruitMessageId = params.get('rid') ?? '';

        const recruitData = await RecruitService.getRecruit(guild.id, recruitMessageId);

        // 既に募集が終了している場合
        if (notExists(recruitData)) {
            return await interaction.message.edit({ components: [] });
        }

        const recruitChannelId = recruitData.channelId;

        const recruitMessage = await searchMessageById(guild, recruitChannelId, recruitMessageId);
        if (notExists(recruitMessage)) {
            await interaction.message.edit({ components: [] });
            return await interaction.followUp('募集メッセージが存在しないでし!');
        }
        const recuritPram = params.get('d');

        if (!(await hasPermission(guild.id, interaction.member.user.id, recruitMessageId))) {
            await interaction.followUp({
                content:
                    '参加承認/拒否の操作は募集主か募集時に参加確定していた人しかできないでし！',
                flags: MessageFlags.Ephemeral,
            });
            if (recuritPram === RecruitParam.Approve) {
                return await interaction.editReply({
                    components: recoveryThinkingButton(interaction, '承認'),
                });
            } else if (recuritPram === RecruitParam.Reject) {
                return await interaction.editReply({
                    components: recoveryThinkingButton(interaction, '拒否'),
                });
            }
        }

        const embed = new EmbedBuilder();

        const participantId = params.get('pid') ?? '';
        const participant = await searchDBMemberById(guild, participantId);
        assertExistCheck(participant, 'participant');
        embed.setAuthor({
            name: participant.displayName,
            iconURL: participant.iconUrl,
        });

        let text = `<@${interaction.member.user.id}>たん`;

        if (recuritPram === RecruitParam.Approve) {
            embed.setTitle('参加承認');
            embed.setColor('Green');
            text += 'によって参加が承認されたでし！';
            const recruit = await RecruitService.getRecruit(guild.id, recruitMessageId);
            assertExistCheck(recruit, 'recruit');
            const recruiter = await searchAPIMemberById(guild, recruit.authorId);
            assertExistCheck(recruiter, 'recruiter');
            if (exists(recruiter.voice.channel)) {
                text += `<@${recruiter.id}>たんは<#${recruiter.voice.channel.id}>で通話中でし！\n別途開始時間やボイスチャンネルの指定がない場合はこのボイスチャンネルに参加するでし！`;
            } else {
                text += `開始時間や使用するボイスチャンネルについては募集主からの連絡を待つでし！`;
            }
            embed.setThumbnail(
                'https://raw.githubusercontent.com/shngmsw/ikabu/stg/images/stamp/approval.png',
            );
        } else if (recuritPram === RecruitParam.Reject) {
            embed.setTitle('参加拒否');
            embed.setColor('Red');
            text +=
                'が参加を拒否したため、参加は自動的に取り下げられたでし！\n参加条件を見返してみるでし！';
            embed.setThumbnail(
                'https://raw.githubusercontent.com/shngmsw/ikabu/stg/images/stamp/reject.png',
            );

            const participant = await ParticipantService.getParticipant(
                guild.id,
                recruitMessageId,
                participantId,
            );

            if (exists(participant)) {
                // participantsテーブルから対象者のデータのみ削除
                await ParticipantService.deleteParticipant(
                    guild.id,
                    recruitMessageId,
                    participantId,
                );
            }

            await regenerateCanvas(guild, recruitChannelId, recruitMessageId, RecruitOpCode.open);

            const memberListMessageId = params.get('mid') ?? '';
            const memberListMessage = await searchMessageById(
                guild,
                recruitChannelId,
                memberListMessageId,
            );
            assertExistCheck(memberListMessage, 'memberListMessage');
            await memberListMessage.edit({
                content: await memberListText(interaction, recruitMessageId),
            });
        }

        embed.setDescription(text);

        await recruitMessage.reply({ content: `<@${participantId}>`, embeds: [embed] });

        const recruitChannel = await searchChannelById(guild, recruitChannelId);

        if (exists(recruitChannel) && recruitChannel.isTextBased()) {
            await sendStickyMessage(guild, recruitChannelId, StickyKey.AvailableRecruit, {
                content: await availableRecruitString(guild, recruitChannel.id),
                flags: MessageFlags.SuppressNotifications,
            });
        }

        await interaction.message.edit({
            components: [],
        });
    } catch (error) {
        await sendErrorLogs(logger, error);
        await interaction.message.edit({
            components: [],
        });
        await interaction.channel?.send(ErrorTexts.UndefinedError);
        await interaction.channel?.send('手動で返信するでし！');
    }
}

async function hasPermission(guildId: string, userId: string, messageId: string) {
    const participantsData = await ParticipantService.getAllParticipants(guildId, messageId);

    let recruiter = participantsData[0]; // 募集者
    const recruiterId = recruiter.userId;
    const attendeeList: ParticipantMember[] = []; // 募集時参加確定者リスト
    for (const participant of participantsData) {
        if (participant.userType === 0) {
            recruiter = participant;
        } else if (participant.userType === 1) {
            attendeeList.push(participant);
        }
    }

    // 募集者と募集時参加確定者のIDリスト
    const confirmedMemberIDList = [];
    confirmedMemberIDList.push(recruiterId);
    for (const attendee of attendeeList) {
        confirmedMemberIDList.push(attendee.userId);
    }

    return confirmedMemberIDList.includes(userId);
}
