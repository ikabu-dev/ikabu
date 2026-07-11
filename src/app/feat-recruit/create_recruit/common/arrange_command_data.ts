import { ChannelType, ChatInputCommandInteraction, MessageFlags } from 'discord.js';

import { searchDBMemberById } from '@/app/common/manager/member_manager';
import { RecruitConditionError } from '@/app/feat-recruit/common/types/recruit_condition_error';
import { RecruitData } from '@/app/feat-recruit/common/types/recruit_data';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { ErrorTexts } from '@/config/constants/error_texts';
import { RecruitType } from '@/db/recruit_service';
import { log4js_obj } from '@/log4js_settings';
import { assertExistCheck, exists } from '@/shared/assert';

import { buildRecruitText } from './recruit_text';
import { validateRecruitNum } from '../validators/recruit_num_validator';
import { getScheduleNumFromString, validateSchedule } from '../validators/schedule_validator';
import { validateVoiceChannel } from '../validators/vc_validator';

const logger = log4js_obj.getLogger('recruit');

export async function arrangeCommandRecruitData(
    interaction: ChatInputCommandInteraction<'cached'>,
    recruitName: string,
    recruitType: RecruitType,
): Promise<RecruitData> {
    const guild = interaction.guild;
    const options = interaction.options;
    const interactionMember = interaction.member;
    const recruitChannel = interaction.channel;
    assertExistCheck(recruitChannel, 'interaction.channel');

    const scheduleString = options.getSubcommand(true);
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

    try {
        const scheduleNum = getScheduleNumFromString(scheduleString);
        const schedule = await validateSchedule(guild, scheduleNum, recruitType);
        const count = validateRecruitNum(recruitNum, recruitType, attendee1, attendee2, attendee3);
        await validateVoiceChannel(guild.id, voiceChannel, recruiter.userId);
        const txt = buildRecruitText(
            recruiter.mention,
            recruitName,
            attendee1,
            attendee2,
            attendee3,
        );

        return {
            guild,
            interactionMember,
            recruitChannel,
            scheduleNum,
            txt,
            recruitNum,
            condition,
            count,
            recruiter,
            attendee1,
            attendee2,
            attendee3,
            schedule,
            voiceChannel,
        };
    } catch (error) {
        if (error instanceof RecruitConditionError) {
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
