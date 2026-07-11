import { ChannelType, MessageFlags, ModalSubmitInteraction, VoiceBasedChannel } from 'discord.js';

import { RecruitConditionError } from '@/app/feat-recruit/common/types/recruit_condition_error';
import { RecruitData } from '@/app/feat-recruit/common/types/recruit_data';
import { ErrorTexts } from '@/config/constants/error_texts';
import { RecruitType } from '@/infra/db/repositories/recruit_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendRecruitModalLog } from '@/infra/logging/recruit_modal_log';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { assertExistCheck } from '@/shared/assert';
import { getGuildByInteraction } from '@/shared/discord_helpers/guild_manager';
import { searchAPIMemberById, searchDBMemberById } from '@/shared/discord_helpers/member_manager';
import { isEmpty } from '@/shared/string';

import { buildRecruitText } from './recruit_text';
import { validateRecruitNum } from '../validators/recruit_num_validator';
import { getScheduleNumFromString, validateSchedule } from '../validators/schedule_validator';
import { validateVoiceChannel } from '../validators/vc_validator';

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

    await sendRecruitModalLog(interaction);

    const scheduleString = interaction.fields.fields.has('scheduleNum')
        ? interaction.fields.getStringSelectValues('scheduleNum')[0]
        : undefined;

    const voiceChannelCollection = interaction.fields.fields.has('voiceChannel')
        ? interaction.fields.getSelectedChannels('voiceChannel', false, [ChannelType.GuildVoice])
        : null;
    const voiceChannel = voiceChannelCollection
        ? (([...voiceChannelCollection.values()][0] as VoiceBasedChannel) ?? null)
        : null;

    const recruitNum = Number(interaction.fields.getTextInputValue('rNum'));
    let condition = interaction.fields.getTextInputValue('condition');
    if (isEmpty(condition)) condition = 'なし';

    const recruiter = await searchDBMemberById(guild, interactionMember.id);
    assertExistCheck(recruiter, 'Member');

    const attendeeUsersCollection = interaction.fields.fields.has('attendees')
        ? interaction.fields.getSelectedUsers('attendees')
        : null;
    const attendeeUsers = attendeeUsersCollection ? [...attendeeUsersCollection.values()] : [];
    const attendee1 = attendeeUsers[0]
        ? await searchDBMemberById(guild, attendeeUsers[0].id)
        : null;
    const attendee2 = attendeeUsers[1]
        ? await searchDBMemberById(guild, attendeeUsers[1].id)
        : null;
    const attendee3 = attendeeUsers[2]
        ? await searchDBMemberById(guild, attendeeUsers[2].id)
        : null;

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
