import { EventMatchInfo, getEventData } from '@/app/common/apis/splatoon3.ink/splatoon3_ink';
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
import { recruitEventCanvas, ruleEventCanvas } from '../common/canvases/event_canvas';
import { RecruitOpCode } from '../common/canvases/regenerate_canvas';
import { RecruitData } from '../common/types/recruit_data';

const recruitName = 'イベマ募集';

export async function eventRecruit(interaction: RecruitInteraction) {
    await executeRecruitFlow<EventMatchInfo | null, RecruitFlowContext>(interaction, {
        resolveArrangement,
        getMatchData: (recruitData) => getEventData(recruitData.schedule),
        getImageBuffers,
        getEventTiming: (recruitData, eventData) => ({
            title: `イベントマッチ - ${recruitData.recruiter.displayName}`,
            startTime: eventData?.startTime ?? new Date(),
            endTime: eventData?.endTime ?? new Date(),
        }),
        getRegisterOption: (recruitData, eventData) => eventData?.title ?? 'えらー',
        autoClose: true,
    });
}

async function resolveArrangement(
    interaction: RecruitInteraction,
): Promise<RecruitArrangement<RecruitFlowContext> | null> {
    const recruitType = RecruitType.EventRecruit;
    const recruitRoleId = await UniqueRoleService.getRoleIdByKey(
        interaction.guildId,
        RoleKeySet.EventRecruit.key,
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
    eventData: EventMatchInfo | null,
): Promise<RecruitImageBuffers> {
    const voiceChannel = recruitData.voiceChannel;
    const voiceChannelName = voiceChannel ? voiceChannel.name : null;

    const recruitBuffer = await recruitEventCanvas({
        opCode: RecruitOpCode.open,
        remaining: recruitData.recruitNum,
        count: recruitData.count,
        recruiter: recruitData.recruiter,
        users: [recruitData.attendee1, recruitData.attendee2, recruitData.attendee3],
        condition: recruitData.condition,
        channelName: voiceChannelName,
    });

    const ruleBuffer = await ruleEventCanvas(eventData);

    return { recruitBuffer: recruitBuffer, ruleBuffer: ruleBuffer };
}
