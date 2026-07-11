import { ButtonInteraction, EmbedBuilder, MessageFlags } from 'discord.js';

import { ErrorTexts } from '@/config/constants/error_texts';
import { env } from '@/config/env';
import { ParticipantService, ParticipantMember } from '@/infra/db/repositories/participant_service';
import { RecruitService } from '@/infra/db/repositories/recruit_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendRecruitButtonLog } from '@/infra/logging/recruit_button_log';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { assertExistCheck, exists, notExists } from '@/shared/assert';
import { datetimeDiff } from '@/shared/datetime/date_calc';
import {
    disableThinkingButton,
    recoveryThinkingButton,
} from '@/shared/discord_helpers/button_components';
import { getGuildByInteraction } from '@/shared/discord_helpers/guild_manager';
import { searchDBMemberById } from '@/shared/discord_helpers/member_manager';
import { searchMessageById } from '@/shared/discord_helpers/message_manager';

import { regenerateCanvas, RecruitOpCode } from '../common/canvases/regenerate_canvas.js';
import { getMemberMentions } from '../common/member_list';
import { increaseJoinCount, increaseRecruitCount } from '../common/recruit_count';
import {
    getStickyChannelId,
    sendCloseEmbedSticky,
    sendRecruitSticky,
} from '../sticky/recruit_sticky_messages.js';

const logger = log4js_obj.getLogger('recruitButton');

export async function close(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    if (!interaction.message.inGuild()) return;
    try {
        assertExistCheck(interaction.channel, 'channel');

        const guild = await getGuildByInteraction(interaction);
        const image1MsgId = params.get('imid1');
        assertExistCheck(image1MsgId, "params.get('imid1')");

        // interaction.member.user.idでなければならない。なぜならば、APIInteractionGuildMemberはid を直接持たないからである。
        const member = await searchDBMemberById(guild, interaction.member.user.id);
        assertExistCheck(member, 'member');

        const recruitData = await RecruitService.getRecruit(guild.id, image1MsgId);

        if (notExists(recruitData)) {
            await interaction.editReply({ components: disableThinkingButton(interaction, '〆') });
            await interaction.followUp({
                content: '募集データが存在しないでし！',
            });
            return;
        }

        const participantsData = await ParticipantService.getAllParticipants(guild.id, image1MsgId);

        let recruiter = participantsData[0]; // 募集者
        const recruiterId = recruitData.authorId;
        const attendeeList: ParticipantMember[] = []; // 募集時参加確定者リスト
        const applicantList: ParticipantMember[] = []; // 参加希望者リスト
        for (const participant of participantsData) {
            if (participant.userType === 0) {
                recruiter = participant;
            } else if (participant.userType === 1) {
                attendeeList.push(participant);
            } else {
                applicantList.push(participant);
            }
        }

        // 募集者と募集時参加確定者のIDリスト
        const confirmedMemberIDList = [];
        confirmedMemberIDList.push(recruiterId);
        for (const attendee of attendeeList) {
            confirmedMemberIDList.push(attendee.userId);
        }

        //  参加希望者のIDリスト
        const applicantIdList = [];
        for (const applicant of applicantList) {
            applicantIdList.push(applicant.userId);
        }

        await sendRecruitButtonLog(interaction, member, recruiter, '〆', '#4f545c');

        const embed = new EmbedBuilder().setDescription(`<@${recruiterId}>たんの募集〆`);
        const buttonMessage = interaction.message;
        const image1Message = await searchMessageById(guild, interaction.channelId, image1MsgId);
        assertExistCheck(image1Message);
        const recruitChannel = interaction.channel;

        if (confirmedMemberIDList.includes(member.userId)) {
            const memberList = getMemberMentions(recruitData.recruitNum, participantsData);

            await regenerateCanvas(guild, recruitChannel.id, image1MsgId, RecruitOpCode.close);

            // recruitテーブルから削除
            await RecruitService.deleteRecruit(guild.id, image1MsgId);

            // participantsテーブルから該当募集のメンバー全員削除
            await ParticipantService.deleteAllParticipant(guild.id, image1MsgId);

            // 環境変数にSERVER_IDが設定されている場合は、募集カウンタを増やす
            if (guild.id === env.serverId) {
                await increaseRecruitCount(confirmedMemberIDList);
                await increaseJoinCount(applicantIdList);
            }

            await buttonMessage.edit({
                content: `<@${recruiterId}>たんの募集は〆！\n${memberList}`,
                components: disableThinkingButton(interaction, '〆'),
            });
            await interaction.followUp({ embeds: [embed] });

            if (recruitChannel.isThread()) {
                // フォーラムやスレッドの場合は、テキストの募集チャンネルにSticky Messageを送信する
                const stickyChannelId = await getStickyChannelId(recruitData);
                if (exists(stickyChannelId)) {
                    await sendRecruitSticky({
                        channelOpt: { guild: guild, channelId: stickyChannelId },
                    });
                }
            } else {
                await sendCloseEmbedSticky(guild, recruitChannel);
            }
        } else if (datetimeDiff(new Date(), image1Message.createdAt) > 120) {
            const memberList = getMemberMentions(recruitData.recruitNum, participantsData);

            await regenerateCanvas(guild, recruitChannel.id, image1MsgId, RecruitOpCode.close);

            // recruitテーブルから削除
            await RecruitService.deleteRecruit(guild.id, image1MsgId);

            // participantsテーブルから該当募集のメンバー全員削除
            await ParticipantService.deleteAllParticipant(guild.id, image1MsgId);

            // 環境変数にSERVER_IDが設定されている場合は、募集カウンタを増やす
            if (guild.id === env.serverId) {
                await increaseRecruitCount(confirmedMemberIDList);
                await increaseJoinCount(applicantIdList);
            }

            await buttonMessage.edit({
                content: `<@${recruiterId}>たんの募集は〆！\n${memberList}`,
                components: disableThinkingButton(interaction, '〆'),
            });
            const embed = new EmbedBuilder().setDescription(
                `<@${recruiterId}>たんの募集〆 \n <@${member.userId}>たんが代理〆`,
            );
            await interaction.followUp({ embeds: [embed] });

            if (recruitChannel.isThread()) {
                // フォーラムやスレッドの場合は、テキストの募集チャンネルにSticky Messageを送信する
                const stickyChannelId = await getStickyChannelId(recruitData);
                if (exists(stickyChannelId)) {
                    await sendRecruitSticky({
                        channelOpt: { guild: guild, channelId: stickyChannelId },
                    });
                }
            } else {
                await sendCloseEmbedSticky(guild, recruitChannel);
            }
        } else {
            await interaction.followUp({
                content: '募集主以外は募集を〆られないでし。',
                flags: MessageFlags.Ephemeral,
            });
            await interaction.editReply({
                components: recoveryThinkingButton(interaction, '〆'),
            });
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        await interaction.message.edit({
            components: disableThinkingButton(interaction, '〆'),
        });
        await interaction.channel?.send(ErrorTexts.UndefinedError);
    }
}
