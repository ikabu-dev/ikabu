import { ButtonInteraction, EmbedBuilder, MessageFlags } from 'discord.js';

import { memberListText } from './other_events.js';
import { sendCancelNotifyToHost } from './send_notify_to_host.js';
import { sendRecruitButtonLog } from '../.././../logs/buttons/recruit_button_log';
import { ParticipantService, ParticipantMember } from '../../../../db/participant_service.js';
import { RecruitService } from '../../../../db/recruit_service.js';
import { log4js_obj } from '../../../../log4js_settings.js';
import { disableThinkingButton, recoveryThinkingButton } from '../../../common/button_components';
import { getGuildByInteraction } from '../../../common/manager/guild_manager.js';
import { searchDBMemberById } from '../../../common/manager/member_manager.js';
import { assertExistCheck, exists, notExists } from '../../../common/others.js';
import { sendStickyMessage } from '../../../common/sticky_message.js';
import { ErrorTexts } from '../../../constant/error_texts.js';
import { StickyKey } from '../../../constant/sticky_key.js';
import { sendErrorLogs } from '../../../logs/error/send_error_logs.js';
import {
    availableRecruitString,
    getStickyChannelId,
    sendCloseEmbedSticky,
    sendRecruitSticky,
} from '../../sticky/recruit_sticky_messages.js';

const logger = log4js_obj.getLogger('recruitButton');

export async function cancelNotify(interaction: ButtonInteraction<'cached' | 'raw'>) {
    if (!interaction.message.inGuild()) return;
    try {
        const guild = await getGuildByInteraction(interaction);
        assertExistCheck(interaction.channel, 'channel');

        const embedMessageId = interaction.message.id;

        // interaction.member.user.idでなければならない。なぜならば、APIInteractionGuildMemberはid を直接持たないからである。
        const member = await searchDBMemberById(guild, interaction.member.user.id);
        assertExistCheck(member, 'member');

        const recruitData = await RecruitService.getRecruit(guild.id, embedMessageId);

        if (notExists(recruitData)) {
            await interaction.editReply({
                components: disableThinkingButton(interaction, 'キャンセル'),
            });
            await interaction.followUp({
                content: '募集データが存在しないでし！',
                ephemeral: false,
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

        await sendRecruitButtonLog(interaction, member, recruiter, 'キャンセル', '#f04747');

        const embed = new EmbedBuilder().setDescription(`<@${recruiterId}>たんの募集〆`);
        const buttonMessage = interaction.message;
        const recruitChannel = interaction.channel;

        if (member.userId == recruiterId) {
            // recruitテーブルから削除
            await RecruitService.deleteRecruit(guild.id, embedMessageId);

            // participantsテーブルから該当募集のメンバー全員削除
            await ParticipantService.deleteAllParticipant(guild.id, embedMessageId);

            await buttonMessage.edit({
                content: `<@${recruiterId}>たんの募集はキャンセルされたでし！`,
                components: disableThinkingButton(interaction, 'キャンセル'),
            });
            await interaction.followUp({ embeds: [embed], ephemeral: false });

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
            // 参加済みかチェック
            if (applicantIdList.includes(member.userId)) {
                // participantsテーブルから自分のデータのみ削除
                await ParticipantService.deleteParticipant(guild.id, embedMessageId, member.userId);

                // ホストに通知
                sendCancelNotifyToHost(
                    interaction.message,
                    guild,
                    recruitChannel,
                    member,
                    recruiter,
                    attendeeList,
                );

                await interaction.editReply({
                    content: await memberListText(interaction, embedMessageId),
                    components: recoveryThinkingButton(interaction, 'キャンセル'),
                });

                if (recruitChannel.isTextBased()) {
                    await sendStickyMessage(guild, recruitChannel.id, StickyKey.AvailableRecruit, {
                        content: await availableRecruitString(guild, recruitChannel.id),
                        flags: MessageFlags.SuppressNotifications,
                    });
                }
            } else {
                await interaction.followUp({
                    content: '他人の募集は勝手にキャンセルできないでし！！',
                    flags: MessageFlags.Ephemeral,
                });
                await interaction.editReply({
                    components: recoveryThinkingButton(interaction, 'キャンセル'),
                });
            }
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        await interaction.message.edit({
            components: disableThinkingButton(interaction, 'キャンセル'),
        });
        await interaction.channel?.send(ErrorTexts.UndefinedError);
    }
}
