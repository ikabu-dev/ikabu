import { RoleKeySet } from '@/config/constants/role_key';
import {
    createRecruit,
    RecruitCreateInteraction,
    RecruitSpec,
    voiceChannelName,
} from '@/features/recruit/create/common/recruit_pipeline';
import { RecruitOpCode } from '@/features/recruit/ui/canvases/regenerate_canvas';
import {
    recruitRegularCanvas,
    ruleRegularCanvas,
} from '@/features/recruit/ui/canvases/regular_canvas';
import { RecruitType } from '@/infra/db/repositories/recruit_service';
import { UniqueRoleService } from '@/infra/db/repositories/unique_role_service';
import { getRegularData } from '@/infra/external/splatoon3-ink/splatoon3_ink';
import { assertExistCheck } from '@/shared/assert';

const spec: RecruitSpec<undefined> = {
    recruitName: 'ナワバリ募集',
    eventName: 'レギュラーマッチ',
    autoClose: true,

    prepare: async (interaction) => ({
        recruitType: RecruitType.RegularRecruit,
        recruitRoleId: await UniqueRoleService.getRoleIdByKey(
            interaction.guildId,
            RoleKeySet.RegularRecruit.key,
        ),
        context: undefined,
    }),

    build: async (recruitData) => {
        const regularData = await getRegularData(recruitData.schedule, recruitData.scheduleNum);
        assertExistCheck(regularData, 'regularData');

        const recruitBuffer = await recruitRegularCanvas(
            RecruitOpCode.open,
            recruitData.recruitNum,
            recruitData.count,
            recruitData.recruiter,
            recruitData.attendee1,
            recruitData.attendee2,
            recruitData.attendee3,
            null,
            null,
            null,
            null,
            recruitData.condition,
            voiceChannelName(recruitData),
        );
        const ruleBuffer = await ruleRegularCanvas(regularData);

        return {
            imageBuffers: { recruitBuffer, ruleBuffer },
            eventImage: ruleBuffer,
            scheduleStartTime: regularData.startTime,
            scheduleEndTime: regularData.endTime,
            option: null,
        };
    },
};

export async function regularRecruit(interaction: RecruitCreateInteraction) {
    await createRecruit(interaction, spec);
}
