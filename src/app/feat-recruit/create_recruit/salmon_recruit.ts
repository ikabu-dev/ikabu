import { ChatInputCommandInteraction, ModalSubmitInteraction } from 'discord.js';

import { arrangeCommandRecruitData } from './common/arrange_command_data';
import { arrangeModalRecruitData } from './common/arrange_modal_data';
import { registerRecruitData } from './common/register_recruit_data';
import { removeDeleteButton } from './common/remove_delete_button';
import { sendRecruitCanvas, RecruitImageBuffers } from './common/send_recruit_message';
import { RecruitType } from '../../../db/recruit_service';
import { UniqueRoleService } from '../../../db/unique_role_service';
import {
    getSchedule,
    checkBigRun,
    checkTeamContest,
    getSalmonData,
    getTeamContestData,
} from '../../common/apis/splatoon3.ink/splatoon3_ink';
import { assertExistCheck, exists, sleep } from '../../common/others';
import { RoleKeySet } from '../../constant/role_key';
import { recruitBigRunCanvas, ruleBigRunCanvas } from '../common/canvases/big_run_canvas';
import { RecruitOpCode } from '../common/canvases/regenerate_canvas';
import { recruitSalmonCanvas, ruleSalmonCanvas } from '../common/canvases/salmon_canvas';
import { RecruitData } from '../common/types/recruit_data';
import { sendRecruitSticky } from '../sticky/recruit_sticky_messages';
import { createRecruitEvent } from '../vc_reservation/recruit_event';

export async function salmonRecruit(
    interaction: ChatInputCommandInteraction<'cached'> | ModalSubmitInteraction<'cached' | 'raw'>,
) {
    assertExistCheck(interaction.channel, 'channel');
    // 'インタラクションに失敗'が出ないようにするため
    await interaction.deferReply({});

    const recruitName = 'バイト募集';
    let recruitType;
    const recruitRoleId = await UniqueRoleService.getRoleIdByKey(
        interaction.guildId,
        RoleKeySet.SalmonRecruit.key,
    );

    let recruitData: RecruitData;
    if (interaction.isChatInputCommand()) {
        recruitType = getRecruitType(interaction);
        try {
            recruitData = await arrangeCommandRecruitData(interaction, recruitName, recruitType);
        } catch (error) {
            return;
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
            return;
        }
    } else {
        throw new Error('interaction type is invalid');
    }

    const salmonBuffers = await getSalmonImageBuffers(recruitData, recruitType);

    const recruitMessageList = await sendRecruitCanvas(
        interaction,
        recruitRoleId,
        recruitData,
        salmonBuffers,
    );

    let eventId: string | null = null;
    if (exists(recruitData.voiceChannel)) {
        eventId = (
            await createRecruitEvent(
                recruitData.guild,
                `サーモンラン - ${recruitData.recruiter.displayName}`,
                recruitData.recruiter.userId,
                recruitData.voiceChannel,
                salmonBuffers.ruleBuffer,
                new Date(),
            )
        ).id;
    }

    await registerRecruitData(
        recruitMessageList.recruitMessage.id,
        recruitType,
        recruitData,
        eventId,
        null,
    );

    // 募集リスト更新
    await sendRecruitSticky({
        channelOpt: { guild: recruitData.guild, channelId: recruitData.recruitChannel.id },
    });

    // 15秒後に削除ボタンを消す
    await sleep(15);

    await removeDeleteButton(recruitData, recruitMessageList.deleteButtonMessage.id);
}

async function getSalmonImageBuffers(
    recruitData: RecruitData,
    recruitType: RecruitType,
): Promise<RecruitImageBuffers> {
    const voiceChannel = recruitData.voiceChannel;
    const voiceChannelName = voiceChannel ? voiceChannel.name : null;

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
            voiceChannelName,
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
            voiceChannelName,
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
            voiceChannelName,
            'コンテスト',
        );
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
