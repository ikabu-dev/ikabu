import { MessageFlags, ModalSubmitInteraction } from 'discord.js';

import { RecruitType } from '../../../../db/recruit_service';
import { log4js_obj } from '../../../../log4js_settings';
import { getSchedule } from '../../../common/apis/splatoon3.ink/splatoon3_ink';
import { getGuildByInteraction } from '../../../common/manager/guild_manager';
import { searchAPIMemberById, searchDBMemberById } from '../../../common/manager/member_manager';
import {
    assertExistCheck,
    exists,
    getDeveloperMention,
    isEmpty,
    notExists,
} from '../../../common/others';
import { ErrorTexts } from '../../../constant/error_texts';
import { sendErrorLogs } from '../../../logs/error/send_error_logs';
import { sendRecruitModalLog } from '../../../logs/modals/recruit_modal_log';
import { RecruitAlertTexts } from '../../alert_texts/alert_texts';
import {
    checkRecruitNum,
    checkRegularRecruitNum,
} from '../../common/condition_checks/recruit_num_check';
import { checkRecruitSchedule } from '../../common/condition_checks/schedule_check';
import { RecruitConditionError } from '../../types/recruit_condition_error';
import { RecruitData } from '../../types/recruit_data';

const logger = log4js_obj.getLogger('recruit');

export async function arrangeModalRecruitData(
    interaction: ModalSubmitInteraction<'cached' | 'raw'>,
    recruitName: string,
    recruitType: RecruitType,
): Promise<RecruitData> {
    const guild = await getGuildByInteraction(interaction);
    const interactionMember = await searchAPIMemberById(guild, interaction.member.user.id);
    const recruitChannel = interaction.channel;
    assertExistCheck(interactionMember, 'GuildMember');
    assertExistCheck(recruitChannel, 'interaction.channel');
    const scheduleNum = 0;

    try {
        await sendRecruitModalLog(interaction);

        const schedule = await getSchedule();
        if (notExists(schedule)) {
            throw new RecruitConditionError(
                getDeveloperMention(guild.id) + RecruitAlertTexts.ScheduleLoadError,
            );
        }

        const checkScheduleResponse = await checkRecruitSchedule(
            guild.id,
            schedule,
            scheduleNum,
            recruitType,
        ); // 対象の日時に募集を建てられるかチェック
        if (!checkScheduleResponse.canRecruit) {
            throw new RecruitConditionError(checkScheduleResponse.recruitDateErrorMessage);
        }

        const voiceChannel = null;
        const recruitNum = Number(interaction.fields.getTextInputValue('rNum'));

        if (Number.isNaN(recruitNum)) {
            throw new RecruitConditionError(RecruitAlertTexts.RecruitNumIsNaN);
        }

        let condition = interaction.fields.getTextInputValue('condition');
        if (isEmpty(condition)) condition = 'なし';

        const recruiter = await searchDBMemberById(guild, interactionMember.id);
        assertExistCheck(recruiter, 'Member');

        const attendee1 = null;
        const attendee2 = null;
        const attendee3 = null;

        let recruitNumCheckResponse;
        if (recruitType === RecruitType.RegularRecruit) {
            recruitNumCheckResponse = checkRegularRecruitNum(
                recruitNum,
                attendee1,
                attendee2,
                attendee3,
            );
        } else {
            recruitNumCheckResponse = checkRecruitNum(recruitNum, attendee1, attendee2);
        }

        if (exists(recruitNumCheckResponse.recruitNumErrorMessage)) {
            throw new RecruitConditionError(recruitNumCheckResponse.recruitNumErrorMessage);
        }

        let txt = `### ${recruiter.mention}たんの${recruitName}\n`;
        txt += 'よければ合流しませんか？';

        return {
            guild: guild,
            interactionMember: interactionMember,
            recruitChannel: recruitChannel,
            scheduleNum: scheduleNum,
            txt: txt,
            recruitNum: recruitNum,
            condition: condition,
            count: recruitNumCheckResponse.memberCount,
            recruiter: recruiter,
            attendee1: attendee1,
            attendee2: attendee2,
            attendee3: attendee3,
            schedule: schedule,
            voiceChannel: voiceChannel,
        };
    } catch (error) {
        if (error instanceof RecruitConditionError) {
            // 募集条件のチェックを行う
            await interaction.deleteReply();
            await interaction.followUp({
                content: `${error.getErrorMessage()}`,
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await recruitChannel.send(ErrorTexts.UndefinedError);
            await sendErrorLogs(logger, error);
        }
        throw error;
    }
}
