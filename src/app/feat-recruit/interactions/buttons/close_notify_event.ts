import { ButtonInteraction, EmbedBuilder, MessageFlags } from 'discord.js';

import { getMemberMentions } from './other_events.js';
import { increaseRecruitCount, increaseJoinCount } from './recruit_count.js';
import { sendRecruitButtonLog } from '../.././../logs/buttons/recruit_button_log';
import { ParticipantService, ParticipantMember } from '../../../../db/participant_service.js';
import { RecruitService } from '../../../../db/recruit_service.js';
import { log4js_obj } from '../../../../log4js_settings.js';
import { disableThinkingButton, recoveryThinkingButton } from '../../../common/button_components';
import { getGuildByInteraction } from '../../../common/manager/guild_manager.js';
import { searchDBMemberById } from '../../../common/manager/member_manager.js';
import { assertExistCheck, datetimeDiff, exists, notExists } from '../../../common/others.js';
import { ErrorTexts } from '../../../constant/error_texts.js';
import { sendErrorLogs } from '../../../logs/error/send_error_logs.js';
import {
    getStickyChannelId,
    sendCloseEmbedSticky,
    sendRecruitSticky,
} from '../../sticky/recruit_sticky_messages.js';

const logger = log4js_obj.getLogger('recruitButton');

export async function closeNotify(interaction: ButtonInteraction<'cached' | 'raw'>) {
    if (!interaction.message.inGuild()) return;
    try {
        assertExistCheck(interaction.channel, 'channel');

        const guild = await getGuildByInteraction(interaction);
        const embedMessageId = interaction.message.id;

        // interaction.member.user.idでなければならない。なぜならば、APIInteractionGuildMemberはid を直接持たないからである。
        const member = await searchDBMemberById(guild, interaction.member.user.id);
        assertExistCheck(member, 'member');

        const recruitData = await RecruitService.getRecruit(guild.id, embedMessageId);

        if (notExists(recruitData)) {
            await interaction.editReply({ components: disableThinkingButton(interaction, '〆') });
            await interaction.followUp({
                content: '募集データが存在しないでし！',
            });
            return;
        }

        const participantsData = await ParticipantService.getAllParticipants(
            guild.id,
            embedMessageId,
        );

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
        const recruitChannel = interaction.channel;

        if (member.userId === recruiterId) {
            const memberList = getMemberMentions(recruitData.recruitNum, participantsData);

            // recruitテーブルから削除
            await RecruitService.deleteRecruit(guild.id, embedMessageId);

            // participantsテーブルから該当募集のメンバー全員削除
            await ParticipantService.deleteAllParticipant(guild.id, embedMessageId);

            // 環境変数にSERVER_IDが設定されている場合は、募集カウンタを増やす
            if (guild.id === process.env.SERVER_ID) {
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
        } else if (datetimeDiff(new Date(), interaction.message.createdAt) > 120) {
            const memberList = getMemberMentions(recruitData.recruitNum, participantsData);

            // recruitテーブルから削除
            await RecruitService.deleteRecruit(guild.id, embedMessageId);

            // participantsテーブルから該当募集のメンバー全員削除
            await ParticipantService.deleteAllParticipant(guild.id, embedMessageId);

            // 環境変数にSERVER_IDが設定されている場合は、募集カウンタを増やす
            if (guild.id === process.env.SERVER_ID) {
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
