import { ChatInputCommandInteraction, ModalSubmitInteraction } from 'discord.js';

import { RoleKeySet } from '@/config/constants/role_key';
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
import { recruitEventCanvas, ruleEventCanvas } from '@/features/recruit/ui/canvases/event_canvas';
import { RecruitOpCode } from '@/features/recruit/ui/canvases/regenerate_canvas';
import { createRecruitEvent } from '@/features/recruit/vc_reservation/recruit_event';
import { RecruitType } from '@/infra/db/repositories/recruit_service';
import { UniqueRoleService } from '@/infra/db/repositories/unique_role_service';
import { getEventData, EventMatchInfo } from '@/infra/external/splatoon3-ink/splatoon3_ink';
import { assertExistCheck, exists } from '@/shared/assert';
import { sleep } from '@/shared/sleep';

export async function eventRecruit(
    interaction: ChatInputCommandInteraction<'cached'> | ModalSubmitInteraction<'cached' | 'raw'>,
) {
    assertExistCheck(interaction.channel, 'channel');
    // 'インタラクションに失敗'が出ないようにするため
    await interaction.deferReply({});

    const recruitName = 'イベマ募集';
    const recruitType = RecruitType.EventRecruit;
    const recruitRoleId = await UniqueRoleService.getRoleIdByKey(
        interaction.guildId,
        RoleKeySet.EventRecruit.key,
    );

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

    const eventData = await getEventData(recruitData.schedule);

    const eventBuffers = await getEventImageBuffers(recruitData, eventData);

    const recruitMessageList = await sendRecruitCanvas(
        interaction,
        recruitRoleId,
        recruitData,
        eventBuffers,
    );

    let eventId: string | null = null;
    if (exists(recruitData.voiceChannel)) {
        eventId = (
            await createRecruitEvent(
                recruitData.guild,
                `イベントマッチ - ${recruitData.recruiter.displayName}`,
                recruitData.recruiter.userId,
                recruitData.voiceChannel,
                eventBuffers.ruleBuffer,
                eventData?.startTime ?? new Date(),
                eventData?.endTime ?? new Date(),
            )
        ).id;
    }

    await registerRecruitData(
        recruitMessageList.recruitMessage.id,
        recruitType,
        recruitData,
        eventId,
        eventData?.title ?? 'えらー',
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

async function getEventImageBuffers(
    recruitData: RecruitData,
    eventData: EventMatchInfo | null,
): Promise<RecruitImageBuffers> {
    const voiceChannel = recruitData.voiceChannel;
    const voiceChannelName = voiceChannel ? voiceChannel.name : null;

    const recruitBuffer = await recruitEventCanvas(
        RecruitOpCode.open,
        recruitData.recruitNum,
        recruitData.count,
        recruitData.recruiter,
        recruitData.attendee1,
        recruitData.attendee2,
        recruitData.attendee3,
        recruitData.condition,
        voiceChannelName,
    );

    const ruleBuffer = await ruleEventCanvas(eventData);

    return { recruitBuffer: recruitBuffer, ruleBuffer: ruleBuffer };
}
