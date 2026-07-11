import { ChatInputCommandInteraction } from 'discord.js';

import {
    checkBigRun,
    checkTeamContest,
    getSalmonData,
    getSchedule,
    getTeamContestData,
} from '@/app/common/apis/splatoon3.ink/splatoon3_ink';
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
import { recruitBigRunCanvas, ruleBigRunCanvas } from '../common/canvases/big_run_canvas';
import { RecruitOpCode } from '../common/canvases/regenerate_canvas';
import { recruitSalmonCanvas, ruleSalmonCanvas } from '../common/canvases/salmon_canvas';
import { RecruitData } from '../common/types/recruit_data';

const recruitName = 'バイト募集';

export async function salmonRecruit(interaction: RecruitInteraction) {
    await executeRecruitFlow<null, RecruitFlowContext>(interaction, {
        resolveArrangement,
        getMatchData: async () => null,
        getImageBuffers,
        getEventTiming: (recruitData) => ({
            title: `サーモンラン - ${recruitData.recruiter.displayName}`,
            startTime: new Date(),
        }),
        getRegisterOption: () => null,
        autoClose: false,
    });
}

async function resolveArrangement(
    interaction: RecruitInteraction,
): Promise<RecruitArrangement<RecruitFlowContext> | null> {
    const recruitRoleId = await UniqueRoleService.getRoleIdByKey(
        interaction.guildId,
        RoleKeySet.SalmonRecruit.key,
    );

    let recruitType: RecruitType;
    let recruitData: RecruitData;
    if (interaction.isChatInputCommand()) {
        recruitType = getRecruitType(interaction);
        try {
            recruitData = await arrangeCommandRecruitData(interaction, recruitName, recruitType);
        } catch (error) {
            return null;
        }
    } else if (interaction.isModalSubmit()) {
        try {
            const schedule = await getSchedule();
            assertExistCheck(schedule, 'schedule');
            if (checkBigRun(schedule, 0)) {
                recruitType = RecruitType.BigRunRecruit;
            } else if (checkTeamContest(schedule, 0)) {
                recruitType = RecruitType.TeamContestRecruit;
            } else {
                recruitType = RecruitType.SalmonRecruit;
            }

            recruitData = await arrangeModalRecruitData(interaction, recruitName, recruitType);
        } catch (error) {
            return null;
        }
    } else {
        throw new Error('interaction type is invalid');
    }

    return { recruitData, context: { recruitType, recruitRoleId } };
}

async function getImageBuffers(
    recruitData: RecruitData,
    matchData: null,
    context: RecruitFlowContext,
): Promise<RecruitImageBuffers> {
    const voiceChannel = recruitData.voiceChannel;
    const voiceChannelName = voiceChannel ? voiceChannel.name : null;

    let recruitBuffer: Buffer;
    let ruleBuffer: Buffer;
    if (context.recruitType === RecruitType.SalmonRecruit) {
        recruitBuffer = await recruitSalmonCanvas({
            opCode: RecruitOpCode.open,
            remaining: recruitData.recruitNum,
            count: recruitData.count,
            recruiter: recruitData.recruiter,
            users: [recruitData.attendee1, recruitData.attendee2, null],
            condition: recruitData.condition,
            channelName: voiceChannelName,
        });
        ruleBuffer = await ruleSalmonCanvas(await getSalmonData(recruitData.schedule, 0));
    } else if (context.recruitType === RecruitType.BigRunRecruit) {
        recruitBuffer = await recruitBigRunCanvas({
            opCode: RecruitOpCode.open,
            remaining: recruitData.recruitNum,
            count: recruitData.count,
            recruiter: recruitData.recruiter,
            users: [recruitData.attendee1, recruitData.attendee2, null],
            condition: recruitData.condition,
            channelName: voiceChannelName,
        });
        ruleBuffer = await ruleBigRunCanvas(await getSalmonData(recruitData.schedule, 0));
    } else if (context.recruitType === RecruitType.TeamContestRecruit) {
        recruitBuffer = await recruitSalmonCanvas({
            opCode: RecruitOpCode.open,
            remaining: recruitData.recruitNum,
            count: recruitData.count,
            recruiter: recruitData.recruiter,
            users: [recruitData.attendee1, recruitData.attendee2, null],
            condition: recruitData.condition,
            channelName: voiceChannelName,
            subTitle: 'コンテスト',
        });
        ruleBuffer = await ruleSalmonCanvas(await getTeamContestData(recruitData.schedule, 0));
    } else {
        throw new Error('RecruitType not found');
    }

    return { recruitBuffer: recruitBuffer, ruleBuffer: ruleBuffer };
}

function getRecruitType(interaction: ChatInputCommandInteraction<'cached' | 'raw'>): RecruitType {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'run') {
        return RecruitType.SalmonRecruit;
    } else if (subcommand === 'bigrun') {
        return RecruitType.BigRunRecruit;
    } else if (subcommand === 'contest') {
        return RecruitType.TeamContestRecruit;
    } else {
        throw new Error('RecruitType not found');
    }
}
