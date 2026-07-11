import { getRegularData, MatchInfo } from '@/app/common/apis/splatoon3.ink/splatoon3_ink';
import { assertExistCheck } from '@/app/common/others';
import { RoleKeySet } from '@/app/constant/role_key';
import { RecruitType } from '@/db/recruit_service';
import { UniqueRoleService } from '@/db/unique_role_service';

import { arrangeCommandRecruitData } from './common/arrange_command_data';
import { arrangeModalRecruitData } from './common/arrange_modal_data';
import {
    executeRecruitFlow,
    RecruitArrangement,
    RecruitFlowContext,
    RecruitInteraction,
} from './common/recruit_flow';
import { RecruitImageBuffers } from './common/send_recruit_message';
import { RecruitOpCode } from '../common/canvases/regenerate_canvas';
import { recruitRegularCanvas, ruleRegularCanvas } from '../common/canvases/regular_canvas';
import { RecruitData } from '../common/types/recruit_data';

const recruitName = 'ナワバリ募集';

export async function regularRecruit(interaction: RecruitInteraction) {
    await executeRecruitFlow<MatchInfo, RecruitFlowContext>(interaction, {
        resolveArrangement,
        getMatchData: async (recruitData) => {
            const regularData = await getRegularData(recruitData.schedule, recruitData.scheduleNum);
            assertExistCheck(regularData, 'regularData');
            return regularData;
        },
        getImageBuffers,
        getEventTiming: (recruitData, regularData) => ({
            title: `レギュラーマッチ - ${recruitData.recruiter.displayName}`,
            startTime: regularData.startTime,
            endTime: regularData.endTime,
        }),
        getRegisterOption: () => null,
        autoClose: true,
    });
}

async function resolveArrangement(
    interaction: RecruitInteraction,
): Promise<RecruitArrangement<RecruitFlowContext> | null> {
    const recruitType = RecruitType.RegularRecruit;
    const recruitRoleId = await UniqueRoleService.getRoleIdByKey(
        interaction.guildId,
        RoleKeySet.RegularRecruit.key,
    );
    const context: RecruitFlowContext = { recruitType, recruitRoleId };

    let recruitData: RecruitData;
    if (interaction.isChatInputCommand()) {
        try {
            recruitData = await arrangeCommandRecruitData(interaction, recruitName, recruitType);
        } catch (error) {
            return null;
        }
    } else if (interaction.isModalSubmit()) {
        try {
            recruitData = await arrangeModalRecruitData(interaction, recruitName, recruitType);
        } catch (error) {
            return null;
        }
    } else {
        throw new Error('interaction type is invalid');
    }

    return { recruitData, context };
}

async function getImageBuffers(
    recruitData: RecruitData,
    regularData: MatchInfo,
): Promise<RecruitImageBuffers> {
    const voiceChannel = recruitData.voiceChannel;
    const voiceChannelName = voiceChannel ? voiceChannel.name : null;

    const recruitBuffer = await recruitRegularCanvas({
        opCode: RecruitOpCode.open,
        remaining: recruitData.recruitNum,
        count: recruitData.count,
        recruiter: recruitData.recruiter,
        users: [
            recruitData.attendee1,
            recruitData.attendee2,
            recruitData.attendee3,
            null,
            null,
            null,
            null,
        ],
        condition: recruitData.condition,
        channelName: voiceChannelName,
    });

    const ruleBuffer = await ruleRegularCanvas(regularData);

    return { recruitBuffer: recruitBuffer, ruleBuffer: ruleBuffer };
}
