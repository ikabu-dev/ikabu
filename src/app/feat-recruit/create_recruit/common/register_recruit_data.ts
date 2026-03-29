import { ParticipantService } from '../../../../db/participant_service';
import { RecruitType, RecruitService } from '../../../../db/recruit_service';
import { exists } from '../../../common/others';
import { RecruitData } from '../../types/recruit_data';

export async function registerRecruitData(
    recruitId: string,
    recruitType: RecruitType,
    recruitData: RecruitData,
    eventId: string | null,
    option: string | null,
) {
    const guildId = recruitData.guild.id;
    // DBに募集情報を登録
    await RecruitService.registerRecruit(
        guildId,
        recruitData.recruitChannel.id,
        recruitId,
        recruitData.recruiter.userId,
        recruitData.recruitNum,
        recruitData.condition,
        recruitData.voiceChannel ? recruitData.voiceChannel.name : null,
        eventId,
        recruitType,
        option,
    );

    // DBに参加者情報を登録
    await ParticipantService.registerParticipantFromMember(
        guildId,
        recruitId,
        recruitData.recruiter,
        0,
    );
    if (exists(recruitData.attendee1)) {
        await ParticipantService.registerParticipantFromMember(
            guildId,
            recruitId,
            recruitData.attendee1,
            1,
        );
    }
    if (exists(recruitData.attendee2)) {
        await ParticipantService.registerParticipantFromMember(
            guildId,
            recruitId,
            recruitData.attendee2,
            1,
        );
    }
    if (exists(recruitData.attendee3)) {
        await ParticipantService.registerParticipantFromMember(
            guildId,
            recruitId,
            recruitData.attendee3,
            1,
        );
    }
}
