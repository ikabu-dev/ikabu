import { ChatInputCommandInteraction, ModalSubmitInteraction } from 'discord.js';

import { getAnarchyOpenData, MatchInfo } from '@/app/common/apis/splatoon3.ink/splatoon3_ink';
import {
    assertExistCheck,
    exists,
    getDeveloperMention,
    notExists,
    rule2image,
} from '@/app/common/others';
import { getUniqueRoleNameByKey, isRoleKey, RoleKeySet } from '@/app/constant/role_key';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { RecruitType } from '@/db/recruit_service';
import { UniqueRoleService } from '@/db/unique_role_service';
import { log4js_obj } from '@/log4js_settings';

import { arrangeCommandRecruitData } from './common/arrange_command_data';
import { arrangeModalRecruitData } from './common/arrange_modal_data';
import {
    executeRecruitFlow,
    RecruitArrangement,
    RecruitFlowContext,
    RecruitInteraction,
} from './common/recruit_flow';
import { RecruitImageBuffers } from './common/send_recruit_message';
import { recruitAnarchyCanvas, ruleAnarchyCanvas } from '../common/canvases/anarchy_canvas';
import { RecruitOpCode } from '../common/canvases/regenerate_canvas';
import { RecruitData } from '../common/types/recruit_data';

const logger = log4js_obj.getLogger('recruit');
const recruitName = 'バンカラ募集';

type AnarchyContext = RecruitFlowContext & { rank: string };

export async function anarchyRecruit(interaction: RecruitInteraction) {
    await executeRecruitFlow<MatchInfo, AnarchyContext>(interaction, {
        resolveArrangement,
        getMatchData: async (recruitData) => {
            const anarchyData = await getAnarchyOpenData(
                recruitData.schedule,
                recruitData.scheduleNum,
            );
            assertExistCheck(anarchyData, 'anarchyOpenData');
            return anarchyData;
        },
        getImageBuffers,
        getEventTiming: (recruitData, anarchyData) => ({
            title: `バンカラマッチ - ${recruitData.recruiter.displayName}`,
            startTime: anarchyData.startTime,
            endTime: anarchyData.endTime,
        }),
        getRegisterOption: (recruitData, anarchyData, context) => context.rank,
        autoClose: true,
    });
}

async function resolveArrangement(
    interaction: RecruitInteraction,
): Promise<RecruitArrangement<AnarchyContext> | null> {
    const recruitType = RecruitType.AnarchyRecruit;
    let recruitData: RecruitData;
    let context: AnarchyContext;

    if (interaction.isChatInputCommand()) {
        const recruitRankRole = await getAnarchyRecruitRole(interaction);
        context = {
            recruitType,
            recruitRoleId: recruitRankRole.recruitRoleId,
            rank: recruitRankRole.rank,
        };

        try {
            recruitData = await arrangeCommandRecruitData(interaction, recruitName, recruitType);
        } catch (error) {
            return null;
        }
    } else if (interaction.isModalSubmit()) {
        const recruitRankRole = await getAnarchyRecruitRoleFromModal(interaction);
        context = {
            recruitType,
            recruitRoleId: recruitRankRole.recruitRoleId,
            rank: recruitRankRole.rank,
        };

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
    anarchyData: MatchInfo,
    context: AnarchyContext,
): Promise<RecruitImageBuffers> {
    const voiceChannel = recruitData.voiceChannel;
    const voiceChannelName = voiceChannel ? voiceChannel.name : null;

    const recruitBuffer = await recruitAnarchyCanvas({
        opCode: RecruitOpCode.open,
        remaining: recruitData.recruitNum,
        count: recruitData.count,
        recruiter: recruitData.recruiter,
        users: [recruitData.attendee1, recruitData.attendee2, recruitData.attendee3],
        condition: recruitData.condition,
        rank: context.rank,
        channelName: voiceChannelName,
    });

    const ruleIconUrl = rule2image(anarchyData.rule);
    const ruleBuffer = await ruleAnarchyCanvas(anarchyData, ruleIconUrl);

    return { recruitBuffer: recruitBuffer, ruleBuffer: ruleBuffer };
}

type AnarchyRecruitRankRole = {
    recruitRoleId: string | null;
    rank: string;
};
async function getAnarchyRecruitRoleFromModal(
    interaction: ModalSubmitInteraction<'cached' | 'raw'>,
): Promise<AnarchyRecruitRankRole> {
    assertExistCheck(interaction.channel, 'channel');
    const anarchyRecruitRoleId = await UniqueRoleService.getRoleIdByKey(
        interaction.guildId,
        RoleKeySet.AnarchyRecruit.key,
    );
    if (notExists(anarchyRecruitRoleId)) {
        await interaction.channel.send(
            (await getDeveloperMention(interaction.guildId)) +
                `\nバンカラ募集ロールが設定されていないでし！`,
        );
        return { recruitRoleId: null, rank: 'えらー' };
    }

    return { recruitRoleId: anarchyRecruitRoleId, rank: '指定なし' };
}

async function getAnarchyRecruitRole(
    interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
): Promise<AnarchyRecruitRankRole> {
    assertExistCheck(interaction.channel, 'channel');
    const anarchyRecruitRoleId = await UniqueRoleService.getRoleIdByKey(
        interaction.guildId,
        RoleKeySet.AnarchyRecruit.key,
    );
    if (notExists(anarchyRecruitRoleId)) {
        await interaction.channel.send(
            (await getDeveloperMention(interaction.guildId)) +
                `\nバンカラ募集ロールが設定されていないでし！`,
        );
        return { recruitRoleId: null, rank: 'えらー' };
    }

    const rankRoleKey = interaction.options.getString('募集ウデマエ');
    let rank = '指定なし';
    // 募集条件がランクの場合はウデマエロールにメンション
    if (exists(rankRoleKey)) {
        if (!isRoleKey(rankRoleKey)) {
            await sendErrorLogs(logger, 'rankRoleKey is not RoleKey');
            return { recruitRoleId: anarchyRecruitRoleId, rank: 'えらー' };
        }
        rank = getUniqueRoleNameByKey(rankRoleKey);
        const rankRoleId = await UniqueRoleService.getRoleIdByKey(interaction.guildId, rankRoleKey);
        if (notExists(rankRoleId)) {
            await interaction.channel.send(
                (await getDeveloperMention(interaction.guildId)) +
                    `\nウデマエロール\`${rank}\`が設定されていないでし！`,
            );
            return { recruitRoleId: anarchyRecruitRoleId, rank: 'えらー' };
        }
        return { recruitRoleId: rankRoleId, rank: rank };
    } else {
        return { recruitRoleId: anarchyRecruitRoleId, rank: '指定なし' };
    }
}
