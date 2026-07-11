import { Member, Recruit } from '@prisma/client';
import { AttachmentBuilder, Guild, Message } from 'discord.js';

import { ParticipantService, ParticipantMember } from '@/infra/db/repositories/participant_service';
import { RecruitService, RecruitType } from '@/infra/db/repositories/recruit_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { assertExistCheck, notExists } from '@/shared/assert';
import { searchMessageById } from '@/shared/discord_helpers/message_manager';
import { searchRoleById, searchRoleIdByName } from '@/shared/discord_helpers/role_manager';

import { recruitAnarchyCanvas } from './anarchy_canvas';
import { recruitBigRunCanvas } from './big_run_canvas';
import { recruitEventCanvas } from './event_canvas';
import { recruitFestCanvas } from './fest_canvas';
import { recruitRaidersCanvas } from './raiders_canvas';
import { recruitRegularCanvas } from './regular_canvas';
import { recruitSalmonCanvas } from './salmon_canvas';

const logger = log4js_obj.getLogger('recruit');

export const RecruitOpCode = {
    open: 0,
    close: 1,
    cancel: 2,
};

export async function regenerateCanvas(
    guild: Guild,
    channelId: string,
    messageId: string,
    opCode: number,
) {
    try {
        const recruit = await RecruitService.getRecruit(guild.id, messageId);
        if (notExists(recruit)) {
            logger.warn('canvas was not regenerated! [recruit was not found!]');
            return;
        }
        const participantsData = await ParticipantService.getAllParticipants(guild.id, messageId);
        const message = await searchMessageById(guild, channelId, messageId);
        assertExistCheck(message, 'message');
        const applicantList: ParticipantMember[] = []; // 参加希望者リスト
        for (const participant of participantsData) {
            if (participant.userType === 2) {
                applicantList.push(participant);
            }
        }
        const applicantNum = applicantList.length;
        switch (recruit.recruitType) {
            case RecruitType.RegularRecruit:
                await regenRegularCanvas(message, recruit, participantsData, applicantNum, opCode);
                break;
            case RecruitType.EventRecruit:
                await regenEventCanvas(message, recruit, participantsData, applicantNum, opCode);
                break;
            case RecruitType.AnarchyRecruit:
                await regenAnarchyCanvas(message, recruit, participantsData, applicantNum, opCode);
                break;
            case RecruitType.SalmonRecruit:
                await regenSalmonCanvas(
                    message,
                    recruit,
                    participantsData,
                    applicantNum,
                    opCode,
                    false,
                );
                break;
            case RecruitType.FestivalRecruit:
                await regenFesCanvas(message, recruit, participantsData, applicantNum, opCode);
                break;
            case RecruitType.BigRunRecruit:
                await regenBigRunCanvas(message, recruit, participantsData, applicantNum, opCode);
                break;
            case RecruitType.TeamContestRecruit:
                await regenSalmonCanvas(
                    message,
                    recruit,
                    participantsData,
                    applicantNum,
                    opCode,
                    true,
                );
                break;
            case RecruitType.RaidersRecruit:
                await regenRaidersCanvas(message, recruit, participantsData, applicantNum, opCode);
                break;
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}

async function regenRegularCanvas(
    message: Message<true>,
    recruit: Recruit,
    participantsData: ParticipantMember[],
    applicantNum: number,
    opCode: number,
) {
    const recruitNum = recruit.recruitNum;
    const remainingNum = recruitNum - applicantNum;
    const count = remainingNum + participantsData.length; // 全体の枠数
    const channelName = recruit.vcName;
    const condition = recruit.condition;

    const submitMembersList: (Member | null)[] = Array(count).fill(null); // 枠数までnull埋め
    participantsData.forEach(
        (participant, index) => (submitMembersList[index] = participant.member),
    );

    if (notExists(submitMembersList[0])) return;

    const recruitBuffer = await recruitRegularCanvas(
        opCode,
        remainingNum,
        count,
        submitMembersList[0],
        submitMembersList[1],
        submitMembersList[2],
        submitMembersList[3],
        submitMembersList[4],
        submitMembersList[5],
        submitMembersList[6],
        submitMembersList[7],
        condition,
        channelName,
    );
    const recruitImage = new AttachmentBuilder(recruitBuffer, {
        name: 'ikabu_recruit.png',
    });

    await message.edit({ files: [recruitImage] });
}

async function regenEventCanvas(
    message: Message<true>,
    recruit: Recruit,
    participantsData: ParticipantMember[],
    applicantNum: number,
    opCode: number,
) {
    const applicantList: ParticipantMember[] = []; // 参加希望者リスト
    for (const participant of participantsData) {
        if (participant.userType === 2) {
            applicantList.push(participant);
        }
    }
    const recruitNum = recruit.recruitNum;
    const remainingNum = recruitNum - applicantNum;
    const count = remainingNum + participantsData.length; // 全体の枠数
    const channelName = recruit.vcName;
    const condition = recruit.condition;

    const submitMembersList: (Member | null)[] = Array(count).fill(null); // 枠数までnull埋め
    participantsData.forEach(
        (participant, index) => (submitMembersList[index] = participant.member),
    );

    if (notExists(submitMembersList[0])) return;

    const recruitBuffer = await recruitEventCanvas(
        opCode,
        remainingNum,
        count,
        submitMembersList[0],
        submitMembersList[1],
        submitMembersList[2],
        submitMembersList[3],
        condition,
        channelName,
    );
    const recruitImage = new AttachmentBuilder(recruitBuffer, {
        name: 'ikabu_recruit.png',
    });

    await message.edit({ files: [recruitImage] });
}

async function regenAnarchyCanvas(
    message: Message<true>,
    recruit: Recruit,
    participantsData: ParticipantMember[],
    applicantNum: number,
    opCode: number,
) {
    const applicantList: ParticipantMember[] = []; // 参加希望者リスト
    for (const participant of participantsData) {
        if (participant.userType === 2) {
            applicantList.push(participant);
        }
    }
    const recruitNum = recruit.recruitNum;
    const remainingNum = recruitNum - applicantNum;
    const count = remainingNum + participantsData.length; // 全体の枠数
    const channelName = recruit.vcName;
    const condition = recruit.condition;
    const rank = recruit.option;

    const submitMembersList: (Member | null)[] = Array(count).fill(null); // 枠数までnull埋め
    participantsData.forEach(
        (participant, index) => (submitMembersList[index] = participant.member),
    );

    if (notExists(submitMembersList[0])) return;

    const recruitBuffer = await recruitAnarchyCanvas(
        opCode,
        remainingNum,
        count,
        submitMembersList[0],
        submitMembersList[1],
        submitMembersList[2],
        submitMembersList[3],
        condition,
        rank,
        channelName,
    );
    const recruitImage = new AttachmentBuilder(recruitBuffer, {
        name: 'ikabu_recruit.png',
    });

    await message.edit({ files: [recruitImage] });
}

async function regenSalmonCanvas(
    message: Message<true>,
    recruit: Recruit,
    participantsData: ParticipantMember[],
    applicantNum: number,
    opCode: number,
    isTeamContest: boolean,
) {
    const applicantList: ParticipantMember[] = []; // 参加希望者リスト
    for (const participant of participantsData) {
        if (participant.userType === 2) {
            applicantList.push(participant);
        }
    }
    const recruitNum = recruit.recruitNum;
    const remainingNum = recruitNum - applicantNum;
    const count = remainingNum + participantsData.length; // 全体の枠数
    const channelName = recruit.vcName;
    const condition = recruit.condition;

    const submitMembersList: (Member | null)[] = Array(count).fill(null); // 枠数までnull埋め
    participantsData.forEach(
        (participant, index) => (submitMembersList[index] = participant.member),
    );

    if (notExists(submitMembersList[0])) return;

    const recruitBuffer = await recruitSalmonCanvas(
        opCode,
        remainingNum,
        count,
        submitMembersList[0],
        submitMembersList[1],
        submitMembersList[2],
        submitMembersList[3],
        condition,
        channelName,
        isTeamContest ? 'コンテスト' : undefined,
    );

    const recruitImage = new AttachmentBuilder(recruitBuffer, {
        name: 'ikabu_recruit.png',
    });

    await message.edit({ files: [recruitImage] });
}

async function regenRaidersCanvas(
    message: Message<true>,
    recruit: Recruit,
    participantsData: ParticipantMember[],
    applicantNum: number,
    opCode: number,
) {
    const applicantList: ParticipantMember[] = []; // 参加希望者リスト
    for (const participant of participantsData) {
        if (participant.userType === 2) {
            applicantList.push(participant);
        }
    }
    const recruitNum = recruit.recruitNum;
    const remainingNum = recruitNum - applicantNum;
    const count = remainingNum + participantsData.length; // 全体の枠数
    const channelName = recruit.vcName;
    const condition = recruit.condition;

    const submitMembersList: (Member | null)[] = Array(count).fill(null); // 枠数までnull埋め
    participantsData.forEach(
        (participant, index) => (submitMembersList[index] = participant.member),
    );

    if (notExists(submitMembersList[0])) return;

    const recruitBuffer = await recruitRaidersCanvas(
        opCode,
        remainingNum,
        count,
        submitMembersList[0],
        submitMembersList[1],
        submitMembersList[2],
        submitMembersList[3],
        condition,
        channelName,
    );

    const recruitImage = new AttachmentBuilder(recruitBuffer, {
        name: 'ikabu_recruit.png',
    });

    await message.edit({ files: [recruitImage] });
}

async function regenFesCanvas(
    message: Message<true>,
    recruit: Recruit,
    participantsData: ParticipantMember[],
    applicantNum: number,
    opCode: number,
) {
    const applicantList: ParticipantMember[] = []; // 参加希望者リスト
    for (const participant of participantsData) {
        if (participant.userType === 2) {
            applicantList.push(participant);
        }
    }
    const recruitNum = recruit.recruitNum;
    const remainingNum = recruitNum - applicantNum;
    const count = remainingNum + participantsData.length; // 全体の枠数
    const channelName = recruit.vcName;
    const condition = recruit.condition;
    const teamName = recruit.option;
    assertExistCheck(teamName, 'teamName');

    const mentionId = await searchRoleIdByName(message.guild, teamName);
    assertExistCheck(mentionId);
    const teamRole = await searchRoleById(message.guild, mentionId);
    assertExistCheck(teamRole, 'teamRole');

    const submitMembersList: (Member | null)[] = Array(count).fill(null); // 枠数までnull埋め
    participantsData.forEach(
        (participant, index) => (submitMembersList[index] = participant.member),
    );

    if (notExists(submitMembersList[0])) return;

    const recruitBuffer = await recruitFestCanvas(
        opCode,
        remainingNum,
        count,
        submitMembersList[0],
        submitMembersList[1],
        submitMembersList[2],
        submitMembersList[3],
        teamRole.name,
        teamRole.hexColor,
        condition,
        channelName,
    );
    const recruitImage = new AttachmentBuilder(recruitBuffer, {
        name: 'ikabu_recruit.png',
    });

    await message.edit({ files: [recruitImage] });
}
async function regenBigRunCanvas(
    message: Message<true>,
    recruit: Recruit,
    participantsData: ParticipantMember[],
    applicantNum: number,
    opCode: number,
) {
    const applicantList: ParticipantMember[] = []; // 参加希望者リスト
    for (const participant of participantsData) {
        if (participant.userType === 2) {
            applicantList.push(participant);
        }
    }
    const recruitNum = recruit.recruitNum;
    const remainingNum = recruitNum - applicantNum;
    const count = remainingNum + participantsData.length; // 全体の枠数
    const channelName = recruit.vcName;
    const condition = recruit.condition;

    const submitMembersList: (Member | null)[] = Array(count).fill(null); // 枠数までnull埋め
    participantsData.forEach(
        (participant, index) => (submitMembersList[index] = participant.member),
    );

    if (notExists(submitMembersList[0])) return;

    const recruitBuffer = await recruitBigRunCanvas(
        opCode,
        remainingNum,
        count,
        submitMembersList[0],
        submitMembersList[1],
        submitMembersList[2],
        submitMembersList[3],
        condition,
        channelName,
    );

    const recruitImage = new AttachmentBuilder(recruitBuffer, {
        name: 'ikabu_recruit.png',
    });

    await message.edit({ files: [recruitImage] });
}
