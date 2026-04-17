import { ButtonInteraction, MessageFlags } from 'discord.js';

import { ParticipantMember, ParticipantService } from '../../db/participant_service';
import { RecruitService } from '../../db/recruit_service';
import { log4js_obj } from '../../log4js_settings';
import { disableThinkingButton, recoveryThinkingButton } from '../common/button_components';
import { cancelRecruit } from './cancel_recruit/cancel_event';
import { cancelRecruitNotify } from './cancel_recruit/cancel_notify_event';
import { cancelRequest } from './cancel_request/cancel_event';
import { getGuildByInteraction } from '../common/manager/guild_manager';
import { searchDBMemberById } from '../common/manager/member_manager';
import { assertExistCheck, notExists } from '../common/others';
import { ErrorTexts } from '../constant/error_texts';
import { cancelRequestNotify } from './cancel_request/cancel_notify_event';
import { sendRecruitButtonLog } from '../logs/buttons/recruit_button_log';
import { sendErrorLogs } from '../logs/error/send_error_logs';

const logger = log4js_obj.getLogger('recruitButton');

export async function cancelButtonHandler(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    if (!interaction.message.inGuild()) return;
    try {
        const guild = await getGuildByInteraction(interaction);
        assertExistCheck(interaction.channel, 'channel');
        const image1MsgId = params.get('imid1');
        assertExistCheck(image1MsgId, "params.get('imid1')");

        const member = await searchDBMemberById(guild, interaction.member.user.id);
        assertExistCheck(member, 'member');

        const recruitData = await RecruitService.getRecruit(guild.id, image1MsgId);

        if (notExists(recruitData)) {
            await interaction.editReply({
                components: disableThinkingButton(interaction, 'キャンセル'),
            });
            await interaction.followUp({
                content: '募集データが存在しないでし！',
            });
            return;
        }

        const participantsData = await ParticipantService.getAllParticipants(guild.id, image1MsgId);

        let recruiter = participantsData[0];
        const attendeeList: ParticipantMember[] = [];
        const applicantList: ParticipantMember[] = [];
        for (const participant of participantsData) {
            if (participant.userType === 0) {
                recruiter = participant;
            } else if (participant.userType === 1) {
                attendeeList.push(participant);
            } else {
                applicantList.push(participant);
            }
        }

        const confirmedMemberIDList = [recruitData.authorId, ...attendeeList.map((a) => a.userId)];
        const applicantIdList = applicantList.map((a) => a.userId);

        await sendRecruitButtonLog(interaction, member, recruiter, 'キャンセル', '#f04747');

        if (confirmedMemberIDList.includes(member.userId)) {
            await cancelRecruit(interaction, guild, recruitData, image1MsgId);
        } else if (applicantIdList.includes(member.userId)) {
            await cancelRequest(interaction, guild, member, recruiter, attendeeList, image1MsgId);
        } else {
            await interaction.followUp({
                content: '他人の募集は勝手にキャンセルできないでし！！',
                flags: MessageFlags.Ephemeral,
            });
            await interaction.editReply({
                components: recoveryThinkingButton(interaction, 'キャンセル'),
            });
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        await interaction.message.edit({
            components: disableThinkingButton(interaction, 'キャンセル'),
        });
        await interaction.channel?.send(ErrorTexts.UndefinedError);
    }
}

export async function cancelNotifyButtonHandler(interaction: ButtonInteraction<'cached' | 'raw'>) {
    if (!interaction.message.inGuild()) return;
    try {
        const guild = await getGuildByInteraction(interaction);
        assertExistCheck(interaction.channel, 'channel');

        const embedMessageId = interaction.message.id;

        const member = await searchDBMemberById(guild, interaction.member.user.id);
        assertExistCheck(member, 'member');

        const recruitData = await RecruitService.getRecruit(guild.id, embedMessageId);

        if (notExists(recruitData)) {
            await interaction.editReply({
                components: disableThinkingButton(interaction, 'キャンセル'),
            });
            await interaction.followUp({
                content: '募集データが存在しないでし！',
            });
            return;
        }

        const participantsData = await ParticipantService.getAllParticipants(
            guild.id,
            embedMessageId,
        );

        let recruiter = participantsData[0];
        const recruiterId = recruitData.authorId;
        const attendeeList: ParticipantMember[] = [];
        const applicantList: ParticipantMember[] = [];
        for (const participant of participantsData) {
            if (participant.userType === 0) {
                recruiter = participant;
            } else if (participant.userType === 1) {
                attendeeList.push(participant);
            } else {
                applicantList.push(participant);
            }
        }

        const applicantIdList = applicantList.map((a) => a.userId);

        await sendRecruitButtonLog(interaction, member, recruiter, 'キャンセル', '#f04747');

        if (member.userId === recruiterId) {
            await cancelRecruitNotify(interaction, guild, recruitData, embedMessageId);
        } else if (applicantIdList.includes(member.userId)) {
            await cancelRequestNotify(
                interaction,
                guild,
                member,
                recruiter,
                attendeeList,
                embedMessageId,
            );
        } else {
            await interaction.followUp({
                content: '他人の募集は勝手にキャンセルできないでし！！',
                flags: MessageFlags.Ephemeral,
            });
            await interaction.editReply({
                components: recoveryThinkingButton(interaction, 'キャンセル'),
            });
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        await interaction.message.edit({
            components: disableThinkingButton(interaction, 'キャンセル'),
        });
        await interaction.channel?.send(ErrorTexts.UndefinedError);
    }
}
