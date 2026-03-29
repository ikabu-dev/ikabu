import { ButtonInteraction, MessageFlags } from 'discord.js';

import { ParticipantService, ParticipantMember } from '../../../db/participant_service.js';
import { RecruitService } from '../../../db/recruit_service.js';
import { log4js_obj } from '../../../log4js_settings.js';
import { disableThinkingButton, recoveryThinkingButton } from '../../common/button_components';
import { getGuildByInteraction } from '../../common/manager/guild_manager.js';
import { searchDBMemberById } from '../../common/manager/member_manager.js';
import { assertExistCheck, notExists } from '../../common/others.js';
import { ErrorTexts } from '../../constant/error_texts.js';
import { sendRecruitButtonLog } from '../../logs/buttons/recruit_button_log';
import { sendErrorLogs } from '../../logs/error/send_error_logs.js';
import { memberListText } from '../interactions/buttons/other_events.js';
import { sendJoinNotifyToHost } from '../interactions/buttons/send_notify_to_host.js';
import { getStickyChannelId, sendRecruitSticky } from '../sticky/recruit_sticky_messages.js';

const logger = log4js_obj.getLogger('recruitButton');

export async function joinNotify(interaction: ButtonInteraction<'cached' | 'raw'>) {
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
            await interaction.editReply({ components: disableThinkingButton(interaction, '参加') });
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

        //  参加希望者のIDリスト
        const applicantIdList = [];
        for (const applicant of applicantList) {
            applicantIdList.push(applicant.userId);
        }

        await sendRecruitButtonLog(interaction, member, recruiter, '参加', '#5865f2');

        if (member.userId === recruiterId) {
            await interaction.followUp({
                content: '募集主は参加表明できないでし！',
                flags: MessageFlags.Ephemeral,
            });

            await interaction.editReply({
                content: await memberListText(interaction, embedMessageId),
                components: recoveryThinkingButton(interaction, '参加'),
            });

            return;
        } else {
            // 参加済みかチェック
            if (applicantIdList.includes(member.userId)) {
                await interaction.followUp({
                    content: 'すでに参加ボタンを押してるでし！',
                    flags: MessageFlags.Ephemeral,
                });

                await interaction.editReply({
                    components: recoveryThinkingButton(interaction, '参加'),
                });

                return;
            }

            // recruitテーブルにデータ追加
            await ParticipantService.registerParticipant(
                guild.id,
                embedMessageId,
                member.userId,
                2,
                new Date(),
            );

            const recruitChannel = interaction.channel;

            // ホストに通知
            sendJoinNotifyToHost(
                interaction.message,
                interaction.message.id,
                guild,
                recruitChannel,
                member,
                recruiter,
                attendeeList,
            );

            // テキストの募集チャンネルにSticky Messageを送信
            const stickyChannelId = (await getStickyChannelId(recruitData)) ?? recruitChannel.id;
            await sendRecruitSticky({ channelOpt: { guild: guild, channelId: stickyChannelId } });

            await interaction.followUp({
                content: `<@${recruiterId}>からの返答を待つでし！\n条件を満たさない場合は参加を断られる場合があるでし！`,
                flags: MessageFlags.Ephemeral,
            });

            await interaction.editReply({
                content: await memberListText(interaction, embedMessageId),
                components: recoveryThinkingButton(interaction, '参加'),
            });
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        await interaction.message.edit({
            components: disableThinkingButton(interaction, '参加'),
        });
        await interaction.channel?.send(ErrorTexts.UndefinedError);
    }
}
