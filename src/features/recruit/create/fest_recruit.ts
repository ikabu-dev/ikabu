import { Role } from '@prisma/client';
import { ChatInputCommandInteraction, ModalSubmitInteraction } from 'discord.js';

import { arrangeCommandRecruitData } from '@/features/recruit/create/common/arrange_command_data';
import { arrangeModalRecruitData } from '@/features/recruit/create/common/arrange_modal_data';
import { registerRecruitData } from '@/features/recruit/create/common/register_recruit_data';
import { removeDeleteButton } from '@/features/recruit/create/common/remove_delete_button';
import {
    sendRecruitCanvas,
    RecruitImageBuffers,
} from '@/features/recruit/create/common/send_recruit_message';
import { RecruitData } from '@/features/recruit/domain/types/recruit_data';
import { recruitAutoClose } from '@/features/recruit/interactions/close_recruit/auto_close';
import { sendRecruitSticky } from '@/features/recruit/sticky/recruit_sticky_messages';
import { recruitFestCanvas, ruleFestCanvas } from '@/features/recruit/ui/canvases/fest_canvas';
import { RecruitOpCode } from '@/features/recruit/ui/canvases/regenerate_canvas';
import { createRecruitEvent } from '@/features/recruit/vc_reservation/recruit_event';
import { RecruitType } from '@/infra/db/repositories/recruit_service';
import { RoleService } from '@/infra/db/repositories/role_service';
import { getFesRegularData, MatchInfo } from '@/infra/external/splatoon3-ink/splatoon3_ink';
import { assertExistCheck, notExists, exists } from '@/shared/assert';
import { getDeveloperMention } from '@/shared/discord_helpers/developer_mention';
import { sleep } from '@/shared/sleep';

export async function festRecruit(
    interaction: ChatInputCommandInteraction<'cached'> | ModalSubmitInteraction<'cached' | 'raw'>,
) {
    assertExistCheck(interaction.channel, 'channel');
    // 'インタラクションに失敗'が出ないようにするため
    await interaction.deferReply({});

    const recruitName = 'フェス募集';
    const recruitType = RecruitType.FestivalRecruit;
    const recruitRole = await getFestRecruitRole(interaction);
    const teamName = recruitRole.name; // フェスのチーム名

    let recruitData: RecruitData;
    if (interaction.isChatInputCommand()) {
        try {
            recruitData = await arrangeCommandRecruitData(interaction, recruitName, recruitType);
        } catch (error) {
            return;
        }
    } else if (interaction.isModalSubmit()) {
        try {
            recruitData = await arrangeModalRecruitData(interaction, recruitName, recruitType);
        } catch (error) {
            return;
        }
    } else {
        throw new Error('interaction type is invalid');
    }

    const festData = await getFesRegularData(recruitData.schedule, recruitData.scheduleNum);
    assertExistCheck(festData, 'festData');

    const festBuffers = await getFestImageBuffers(recruitData, festData, recruitRole);

    const recruitMessageList = await sendRecruitCanvas(
        interaction,
        recruitRole.roleId,
        recruitData,
        festBuffers,
    );

    let eventId: string | null = null;
    if (exists(recruitData.voiceChannel)) {
        eventId = (
            await createRecruitEvent(
                recruitData.guild,
                `フェスマッチ - ${recruitData.recruiter.displayName}`,
                recruitData.recruiter.userId,
                recruitData.voiceChannel,
                festBuffers.ruleBuffer,
                festData.startTime,
                festData.endTime,
            )
        ).id;
    }

    await registerRecruitData(
        recruitMessageList.recruitMessage.id,
        recruitType,
        recruitData,
        eventId,
        teamName,
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

async function getFestImageBuffers(
    recruitData: RecruitData,
    festData: MatchInfo,
    teamRole: Role,
): Promise<RecruitImageBuffers> {
    const voiceChannel = recruitData.voiceChannel;
    const voiceChannelName = voiceChannel ? voiceChannel.name : null;

    const recruitBuffer = await recruitFestCanvas(
        RecruitOpCode.open,
        recruitData.recruitNum,
        recruitData.count,
        recruitData.recruiter,
        recruitData.attendee1,
        recruitData.attendee2,
        recruitData.attendee3,
        teamRole.name,
        teamRole.hexColor,
        recruitData.condition,
        voiceChannelName,
    );

    const ruleBuffer = await ruleFestCanvas(festData);

    return { recruitBuffer: recruitBuffer, ruleBuffer: ruleBuffer };
}

async function getFestRecruitRole(
    interaction:
        ChatInputCommandInteraction<'cached' | 'raw'> | ModalSubmitInteraction<'cached' | 'raw'>,
): Promise<Role> {
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
