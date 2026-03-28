import { ChatInputCommandInteraction, ModalSubmitInteraction } from 'discord.js';

import { RecruitType } from '../../../db/recruit_service';
import { UniqueRoleService } from '../../../db/unique_role_service';
import { log4js_obj } from '../../../log4js_settings';
import { getAnarchyOpenData, MatchInfo } from '../../common/apis/splatoon3.ink/splatoon3_ink';
import {
    assertExistCheck,
    sleep,
    rule2image,
    notExists,
    getDeveloperMention,
    exists,
} from '../../common/others';
import { RoleKeySet, isRoleKey, getUniqueRoleNameByKey } from '../../constant/role_key';
import { sendErrorLogs } from '../../logs/error/send_error_logs';
import { recruitAnarchyCanvas, ruleAnarchyCanvas } from '../canvases/anarchy_canvas';
import { RecruitOpCode } from '../canvases/regenerate_canvas';
import { recruitAutoClose } from '../common/auto_close';
import { arrangeRecruitData } from '../common/create_recruit/arrange_command_data';
import { arrangeModalRecruitData } from '../common/create_recruit/arrange_modal_data';
import { registerRecruitData } from '../common/create_recruit/register_recruit_data';
import { removeDeleteButton } from '../common/create_recruit/remove_delete_button';
import {
    sendRecruitCanvas,
    RecruitImageBuffers,
} from '../common/create_recruit/send_recruit_message';
import { createRecruitEvent } from '../common/vc_reservation/recruit_event';
import { sendRecruitSticky } from '../sticky/recruit_sticky_messages';
import { RecruitData } from '../types/recruit_data';

const logger = log4js_obj.getLogger('recruit');

export async function anarchyRecruit(
    interaction: ChatInputCommandInteraction<'cached'> | ModalSubmitInteraction<'cached' | 'raw'>,
) {
    assertExistCheck(interaction.channel, 'channel');
    // 'インタラクションに失敗'が出ないようにするため
    await interaction.deferReply({ ephemeral: false });

    const recruitName = 'バンカラ募集';
    const recruitType = RecruitType.AnarchyRecruit;
    let recruitData: RecruitData;
    let recruitRoleId: string | null;
    let rank: string;

    if (interaction.isChatInputCommand()) {
        const recruitRankRole = await getAnarchyRecruitRole(interaction);
        recruitRoleId = recruitRankRole.recruitRoleId;
        rank = recruitRankRole.rank;

        try {
            recruitData = await arrangeRecruitData(interaction, recruitName, recruitType);
        } catch (error) {
            return;
        }
    } else if (interaction.isModalSubmit()) {
        recruitRoleId = await UniqueRoleService.getRoleIdByKey(
            interaction.guildId,
            RoleKeySet.AnarchyRecruit.key,
        );
        rank = '指定なし';

        try {
            recruitData = await arrangeModalRecruitData(interaction, recruitName, recruitType);
        } catch (error) {
            return;
        }
    } else {
        throw new Error('interaction type is invalid');
    }

    const anarchyData = await getAnarchyOpenData(recruitData.schedule, recruitData.scheduleNum);
    assertExistCheck(anarchyData, 'anarchyOpenData');

    const anarchyBuffers = await getAnarchyImageBuffers(recruitData, anarchyData, rank);

    const recruitMessageList = await sendRecruitCanvas(
        interaction,
        recruitRoleId,
        recruitData,
        anarchyBuffers,
    );

    let eventId: string | null = null;
    if (exists(recruitData.voiceChannel)) {
        eventId = (
            await createRecruitEvent(
                recruitData.guild,
                `バンカラマッチ - ${recruitData.recruiter.displayName}`,
                recruitData.recruiter.userId,
                recruitData.voiceChannel,
                anarchyBuffers.ruleBuffer,
                anarchyData.startTime,
                anarchyData.endTime,
            )
        ).id;
    }

    await registerRecruitData(
        recruitMessageList.recruitMessage.id,
        recruitType,
        recruitData,
        eventId,
        rank,
    );

    // 募集リスト更新
    await sendRecruitSticky({
        channelOpt: { guild: recruitData.guild, channelId: recruitData.recruitChannel.id },
    });

    // 15秒後に削除ボタンを消す
    await sleep(15);

    await removeDeleteButton(recruitData, recruitMessageList.deleteButtonMessage.id);

    // 2時間後にボタンを無効化する
    await sleep(7200 - 15);

    await recruitAutoClose(
        recruitData,
        recruitMessageList.recruitMessage.id,
        recruitMessageList.buttonMessage,
    );
}

async function getAnarchyImageBuffers(
    recruitData: RecruitData,
    anarchyData: MatchInfo,
    rank: string,
): Promise<RecruitImageBuffers> {
    const voiceChannel = recruitData.voiceChannel;
    const voiceChannelName = voiceChannel ? voiceChannel.name : null;

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
        voiceChannelName,
    );

    const ruleIconUrl = rule2image(anarchyData.rule);
    const ruleBuffer = await ruleAnarchyCanvas(anarchyData, ruleIconUrl);

    return { recruitBuffer: recruitBuffer, ruleBuffer: ruleBuffer };
}

type AnarchyRecruitRankRole = {
    recruitRoleId: string | null;
    rank: string;
};
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
