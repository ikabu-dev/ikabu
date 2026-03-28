import { ChannelType, ChatInputCommandInteraction, MessageFlags } from 'discord.js';

import { RecruitType } from '../../../../db/recruit_service';
import { log4js_obj } from '../../../../log4js_settings';
import { getSchedule } from '../../../common/apis/splatoon3.ink/splatoon3_ink';
import { searchDBMemberById } from '../../../common/manager/member_manager';
import { assertExistCheck, exists, getDeveloperMention, notExists } from '../../../common/others';
import { ErrorTexts } from '../../../constant/error_texts';
import { sendErrorLogs } from '../../../logs/error/send_error_logs';
import { RecruitAlertTexts } from '../../alert_texts/alert_texts';
import {
    checkRecruitNum,
    checkRegularRecruitNum,
} from '../../common/condition_checks/recruit_num_check';
import { checkRecruitSchedule } from '../../common/condition_checks/schedule_check';
import { getVCReserveErrorMessage } from '../../common/condition_checks/vc_reserve_check';
import { RecruitConditionError } from '../../types/recruit_condition_error';
import { RecruitData } from '../../types/recruit_data';

const logger = log4js_obj.getLogger('recruit');

export async function arrangeRecruitData(
    interaction: ChatInputCommandInteraction<'cached'>,
    recruitName: string,
    recruitType: RecruitType,
): Promise<RecruitData> {
    const guild = interaction.guild;
    const options = interaction.options;
    const interactionMember = interaction.member;
    const recruitChannel = interaction.channel;
    assertExistCheck(recruitChannel, 'interaction.channel');

    let scheduleNum = 0;
    if (options.getSubcommand() === 'now') {
        scheduleNum = 0;
    } else if (options.getSubcommand() === 'next') {
        scheduleNum = 1;
    }

    try {
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

        const voiceChannel = options.getChannel('使用チャンネル', false, [
            ChannelType.GuildVoice,
            ChannelType.GuildStageVoice,
        ]);
        const recruitNum = options.getInteger('募集人数', true);
        const condition = options.getString('参加条件') ?? 'なし';

        const recruiter = await searchDBMemberById(guild, interactionMember.id);
        assertExistCheck(recruiter, 'Member');
        const user1 = options.getUser('参加者1');
        const user2 = options.getUser('参加者2');
        const user3 = options.getUser('参加者3'); // レギュラーマッチ用の参加者指定

        const attendee1 = exists(user1) ? await searchDBMemberById(guild, user1.id) : null;
        const attendee2 = exists(user2) ? await searchDBMemberById(guild, user2.id) : null;
        const attendee3 = exists(user3) ? await searchDBMemberById(guild, user3.id) : null;

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

        if (exists(voiceChannel)) {
            const voiceChannelReserveErrorMessage = await getVCReserveErrorMessage(
                guild.id,
                voiceChannel,
                recruiter.userId,
            );
            if (exists(voiceChannelReserveErrorMessage)) {
                throw new RecruitConditionError(voiceChannelReserveErrorMessage);
            }
        }

        let txt = `### ${recruiter.mention}たんの${recruitName}\n`;
        const members: string[] = [];

        if (exists(attendee1)) {
            members.push(attendee1.mention + 'たん');
        }
        if (exists(attendee2)) {
            members.push(attendee2.mention + 'たん');
        }
        if (exists(attendee3)) {
            members.push(attendee3.mention + 'たん');
        }

        if (members.length !== 0) {
            for (const i in members) {
                if (parseInt(i) === 0) {
                    txt = txt + members[i];
                } else {
                    txt = txt + 'と' + members[i];
                }
            }
            txt += 'の参加が既に決定しているでし！\n';
        }

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
                content: `\`${interaction.toString()}\`\n${error.getErrorMessage()}`,
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await recruitChannel.send(ErrorTexts.UndefinedError);
            await sendErrorLogs(logger, error);
        }
        throw error;
    }
}
