import { ChatInputCommandInteraction } from 'discord.js';

import { RoleKeySet } from '@/config/constants/role_key';
import {
    createRecruit,
    RecruitBuild,
    RecruitCreateInteraction,
    RecruitSpec,
    voiceChannelName,
} from '@/features/recruit/create/common/recruit_pipeline';
import { RecruitData } from '@/features/recruit/domain/types/recruit_data';
import {
    recruitBigRunCanvas,
    ruleBigRunCanvas,
} from '@/features/recruit/ui/canvases/big_run_canvas';
import { RecruitOpCode } from '@/features/recruit/ui/canvases/regenerate_canvas';
import {
    recruitSalmonCanvas,
    ruleSalmonCanvas,
} from '@/features/recruit/ui/canvases/salmon_canvas';
import { RecruitType } from '@/infra/db/repositories/recruit_service';
import { UniqueRoleService } from '@/infra/db/repositories/unique_role_service';
import {
    getSchedule,
    checkBigRun,
    checkTeamContest,
    getSalmonData,
    getTeamContestData,
} from '@/infra/external/splatoon3-ink/splatoon3_ink';
import { assertExistCheck } from '@/shared/assert';

const spec: RecruitSpec<undefined> = {
    recruitName: 'バイト募集',
    eventName: 'サーモンラン',
    autoClose: false,

    prepare: async (interaction) => {
        let recruitType: RecruitType;
        if (interaction.isChatInputCommand()) {
            recruitType = getRecruitTypeFromSubcommand(interaction);
        } else {
            try {
                recruitType = await getRecruitTypeFromSchedule();
            } catch (error) {
                return null;
            }
        }

        return {
            recruitType,
            recruitRoleId: await UniqueRoleService.getRoleIdByKey(
                interaction.guildId,
                RoleKeySet.SalmonRecruit.key,
            ),
            context: undefined,
        };
    },

    build: async (recruitData, { recruitType }) => {
        const buffers = await getSalmonImageBuffers(recruitData, recruitType);
        return {
            ...buffers,
            option: null,
        };
    },
};

export async function salmonRecruit(interaction: RecruitCreateInteraction) {
    await createRecruit(interaction, spec);
}

async function getSalmonImageBuffers(
    recruitData: RecruitData,
    recruitType: RecruitType,
): Promise<Pick<RecruitBuild, 'imageBuffers' | 'eventImage'>> {
    const vcName = voiceChannelName(recruitData);

    let recruitBuffer: Buffer;
    let ruleBuffer: Buffer;
    if (recruitType === RecruitType.SalmonRecruit) {
        recruitBuffer = await recruitSalmonCanvas(
            RecruitOpCode.open,
            recruitData.recruitNum,
            recruitData.count,
            recruitData.recruiter,
            recruitData.attendee1,
            recruitData.attendee2,
            null,
            recruitData.condition,
            vcName,
        );
        ruleBuffer = await ruleSalmonCanvas(await getSalmonData(recruitData.schedule, 0));
    } else if (recruitType === RecruitType.BigRunRecruit) {
        recruitBuffer = await recruitBigRunCanvas(
            RecruitOpCode.open,
            recruitData.recruitNum,
            recruitData.count,
            recruitData.recruiter,
            recruitData.attendee1,
            recruitData.attendee2,
            null,
            recruitData.condition,
            vcName,
        );
        ruleBuffer = await ruleBigRunCanvas(await getSalmonData(recruitData.schedule, 0));
    } else if (recruitType === RecruitType.TeamContestRecruit) {
        recruitBuffer = await recruitSalmonCanvas(
            RecruitOpCode.open,
            recruitData.recruitNum,
            recruitData.count,
            recruitData.recruiter,
            recruitData.attendee1,
            recruitData.attendee2,
            null,
            recruitData.condition,
            vcName,
            'コンテスト',
        );
        ruleBuffer = await ruleSalmonCanvas(await getTeamContestData(recruitData.schedule, 0));
    } else {
        throw new Error('RecruitType not found');
    }

    return {
        imageBuffers: { recruitBuffer, ruleBuffer },
        eventImage: ruleBuffer,
    };
}

/** モーダルからの募集では、現在のスケジュールからバイトの種別を判定する */
async function getRecruitTypeFromSchedule(): Promise<RecruitType> {
    const schedule = await getSchedule();
    assertExistCheck(schedule, 'schedule');

    if (checkBigRun(schedule, 0)) {
        return RecruitType.BigRunRecruit;
    }
    if (checkTeamContest(schedule, 0)) {
        return RecruitType.TeamContestRecruit;
    }
    return RecruitType.SalmonRecruit;
}

function getRecruitTypeFromSubcommand(
    interaction: ChatInputCommandInteraction<'cached'>,
): RecruitType {
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
