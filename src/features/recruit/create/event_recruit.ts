import { RoleKeySet } from '@/config/constants/role_key';
import {
    createRecruit,
    RecruitCreateInteraction,
    RecruitSpec,
    voiceChannelName,
} from '@/features/recruit/create/common/recruit_pipeline';
import { recruitEventCanvas, ruleEventCanvas } from '@/features/recruit/ui/canvases/event_canvas';
import { RecruitOpCode } from '@/features/recruit/ui/canvases/regenerate_canvas';
import { RecruitType } from '@/infra/db/repositories/recruit_service';
import { UniqueRoleService } from '@/infra/db/repositories/unique_role_service';
import { getEventData } from '@/infra/external/splatoon3-ink/splatoon3_ink';

const spec: RecruitSpec<undefined> = {
    recruitName: 'イベマ募集',
    eventName: 'イベントマッチ',
    autoClose: true,

    prepare: async (interaction) => ({
        recruitType: RecruitType.EventRecruit,
        recruitRoleId: await UniqueRoleService.getRoleIdByKey(
            interaction.guildId,
            RoleKeySet.EventRecruit.key,
        ),
        context: undefined,
    }),

    build: async (recruitData) => {
        const eventData = await getEventData(recruitData.schedule);

        const recruitBuffer = await recruitEventCanvas(
            RecruitOpCode.open,
            recruitData.recruitNum,
            recruitData.count,
            recruitData.recruiter,
            recruitData.attendee1,
            recruitData.attendee2,
            recruitData.attendee3,
            recruitData.condition,
            voiceChannelName(recruitData),
        );
        const ruleBuffer = await ruleEventCanvas(eventData);

        return {
            imageBuffers: { recruitBuffer, ruleBuffer },
            eventImage: ruleBuffer,
            eventStartTime: eventData?.startTime ?? new Date(),
            // 開催中のイベントが無い場合は終了時刻が定まらない(募集カードも'えらー'になる)。
            // 現在時刻を入れると即座に〆られてしまうため、期限なしとして扱う
            scheduleEndTime: eventData?.endTime,
            option: eventData?.title ?? 'えらー',
        };
    },
};

export async function eventRecruit(interaction: RecruitCreateInteraction) {
    await createRecruit(interaction, spec);
}
