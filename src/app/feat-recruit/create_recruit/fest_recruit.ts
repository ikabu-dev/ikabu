import { Role } from '@prisma/client';

import { getFesRegularData, MatchInfo } from '@/app/common/apis/splatoon3.ink/splatoon3_ink';
import { assertExistCheck, getDeveloperMention, notExists } from '@/app/common/others';
import { RecruitType } from '@/db/recruit_service';
import { RoleService } from '@/db/role_service';

import { arrangeCommandRecruitData } from './common/arrange_command_data';
import { arrangeModalRecruitData } from './common/arrange_modal_data';
import {
    executeRecruitFlow,
    RecruitArrangement,
    RecruitFlowContext,
    RecruitInteraction,
} from './common/recruit_flow';
import { RecruitImageBuffers } from './common/send_recruit_message';
import { recruitFestCanvas, ruleFestCanvas } from '../common/canvases/fest_canvas';
import { RecruitOpCode } from '../common/canvases/regenerate_canvas';
import { RecruitData } from '../common/types/recruit_data';

const recruitName = 'フェス募集';

type FestContext = RecruitFlowContext & { teamRole: Role };

export async function festRecruit(interaction: RecruitInteraction) {
    await executeRecruitFlow<MatchInfo, FestContext>(interaction, {
        resolveArrangement,
        getMatchData: async (recruitData) => {
            const festData = await getFesRegularData(recruitData.schedule, recruitData.scheduleNum);
            assertExistCheck(festData, 'festData');
            return festData;
        },
        getImageBuffers,
        getEventTiming: (recruitData, festData) => ({
            title: `フェスマッチ - ${recruitData.recruiter.displayName}`,
            startTime: festData.startTime,
            endTime: festData.endTime,
        }),
        getRegisterOption: (recruitData, festData, context) => context.teamRole.name,
        autoClose: true,
    });
}

async function resolveArrangement(
    interaction: RecruitInteraction,
): Promise<RecruitArrangement<FestContext> | null> {
    const recruitType = RecruitType.FestivalRecruit;
    const teamRole = await getFestRecruitRole(interaction);
    const context: FestContext = { recruitType, recruitRoleId: teamRole.roleId, teamRole };

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
    festData: MatchInfo,
    context: FestContext,
): Promise<RecruitImageBuffers> {
    const voiceChannel = recruitData.voiceChannel;
    const voiceChannelName = voiceChannel ? voiceChannel.name : null;

    const recruitBuffer = await recruitFestCanvas({
        opCode: RecruitOpCode.open,
        remaining: recruitData.recruitNum,
        count: recruitData.count,
        recruiter: recruitData.recruiter,
        users: [recruitData.attendee1, recruitData.attendee2, recruitData.attendee3],
        team: context.teamRole.name,
        color: context.teamRole.hexColor,
        condition: recruitData.condition,
        channelName: voiceChannelName,
    });

    const ruleBuffer = await ruleFestCanvas(festData);

    return { recruitBuffer: recruitBuffer, ruleBuffer: ruleBuffer };
}

async function getFestRecruitRole(interaction: RecruitInteraction): Promise<Role> {
    assertExistCheck(interaction.channel, 'channel');
    const teamCharacterName = interaction.channel.name.slice(0, -2); // チャンネル名から'募集'を削除
    const team = teamCharacterName + '陣営';
    const teamRole = await RoleService.searchRole(interaction.guildId, team);

    if (notExists(teamRole)) {
        await interaction.channel.send(
            (await getDeveloperMention(interaction.guildId)) +
                '\nフェスロールの設定がおかしいでし！',
        );
        throw new Error('Festival role is not found');
    }
    return teamRole;
}
