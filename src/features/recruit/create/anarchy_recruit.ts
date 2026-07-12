import { ChatInputCommandInteraction, ModalSubmitInteraction } from 'discord.js';

import { RoleKeySet, isRoleKey, getUniqueRoleNameByKey } from '@/config/constants/role_key';
import {
    createRecruit,
    RecruitCreateInteraction,
    RecruitPreparation,
    RecruitSpec,
    voiceChannelName,
} from '@/features/recruit/create/common/recruit_pipeline';
import {
    recruitAnarchyCanvas,
    ruleAnarchyCanvas,
} from '@/features/recruit/ui/canvases/anarchy_canvas';
import { RecruitOpCode } from '@/features/recruit/ui/canvases/regenerate_canvas';
import { RecruitType } from '@/infra/db/repositories/recruit_service';
import { UniqueRoleService } from '@/infra/db/repositories/unique_role_service';
import { getAnarchyOpenData } from '@/infra/external/splatoon3-ink/splatoon3_ink';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { assertExistCheck, notExists } from '@/shared/assert';
import { getDeveloperMention } from '@/shared/discord_helpers/developer_mention';
import { rule2image } from '@/shared/splatoon/rule_image';

const logger = log4js_obj.getLogger('recruit');

/** バンカラ募集で指定されたウデマエ。指定なし・設定不備の場合もカードに表示する */
type AnarchyContext = { rank: string };

const spec: RecruitSpec<AnarchyContext> = {
    recruitName: 'バンカラ募集',
    eventName: 'バンカラマッチ',
    autoClose: true,

    prepare: async (interaction) => {
        if (interaction.isChatInputCommand()) {
            return await prepareFromCommand(interaction);
        }
        return await prepareFromModal(interaction);
    },

    build: async (recruitData, { context: { rank } }) => {
        const anarchyData = await getAnarchyOpenData(recruitData.schedule, recruitData.scheduleNum);
        assertExistCheck(anarchyData, 'anarchyOpenData');

        const recruitBuffer = await recruitAnarchyCanvas(
            RecruitOpCode.open,
            recruitData.recruitNum,
            recruitData.count,
            recruitData.recruiter,
            recruitData.attendee1,
            recruitData.attendee2,
            recruitData.attendee3,
            recruitData.condition,
            rank,
            voiceChannelName(recruitData),
        );
        const ruleIconUrl = rule2image(anarchyData.rule);
        const ruleBuffer = await ruleAnarchyCanvas(anarchyData, ruleIconUrl);

        return {
            imageBuffers: { recruitBuffer, ruleBuffer },
            eventImage: ruleBuffer,
            eventStartTime: anarchyData.startTime,
            eventEndTime: anarchyData.endTime,
            option: rank,
        };
    },
};

export async function anarchyRecruit(interaction: RecruitCreateInteraction) {
    await createRecruit(interaction, spec);
}

async function prepareFromModal(
    interaction: ModalSubmitInteraction<'cached' | 'raw'>,
): Promise<RecruitPreparation<AnarchyContext>> {
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
        return anarchyPreparation(null, 'えらー');
    }

    return anarchyPreparation(anarchyRecruitRoleId, '指定なし');
}

async function prepareFromCommand(
    interaction: ChatInputCommandInteraction<'cached'>,
): Promise<RecruitPreparation<AnarchyContext>> {
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
        return anarchyPreparation(null, 'えらー');
    }

    const rankRoleKey = interaction.options.getString('募集ウデマエ');
    // 募集条件がランクの場合はウデマエロールにメンション
    if (notExists(rankRoleKey)) {
        return anarchyPreparation(anarchyRecruitRoleId, '指定なし');
    }

    if (!isRoleKey(rankRoleKey)) {
        await sendErrorLogs(logger, 'rankRoleKey is not RoleKey');
        return anarchyPreparation(anarchyRecruitRoleId, 'えらー');
    }

    const rank = getUniqueRoleNameByKey(rankRoleKey);
    const rankRoleId = await UniqueRoleService.getRoleIdByKey(interaction.guildId, rankRoleKey);
    if (notExists(rankRoleId)) {
        await interaction.channel.send(
            (await getDeveloperMention(interaction.guildId)) +
                `\nウデマエロール\`${rank}\`が設定されていないでし！`,
        );
        return anarchyPreparation(anarchyRecruitRoleId, 'えらー');
    }

    return anarchyPreparation(rankRoleId, rank);
}

function anarchyPreparation(
    recruitRoleId: string | null,
    rank: string,
): RecruitPreparation<AnarchyContext> {
    return {
        recruitType: RecruitType.AnarchyRecruit,
        recruitRoleId,
        context: { rank },
    };
}
