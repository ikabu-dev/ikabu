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
import { RecruitOpCode } from '@/features/recruit/ui/canvases/regenerate_canvas';
import {
    recruitRegularCanvas,
    ruleRegularCanvas,
} from '@/features/recruit/ui/canvases/regular_canvas';
import { createRecruitEvent } from '@/features/recruit/vc_reservation/recruit_event';
import { RecruitType } from '@/infra/db/repositories/recruit_service';
import { UniqueRoleService } from '@/infra/db/repositories/unique_role_service';
import { getRegularData, MatchInfo } from '@/infra/external/splatoon3-ink/splatoon3_ink';
import { assertExistCheck, exists } from '@/shared/assert';
import { sleep } from '@/shared/sleep';

export async function regularRecruit(
    interaction: ChatInputCommandInteraction<'cached'> | ModalSubmitInteraction<'cached' | 'raw'>,
) {
    assertExistCheck(interaction.channel, 'channel');
    // 'インタラクションに失敗'が出ないようにするため
    await interaction.deferReply({});

    const recruitName = 'ナワバリ募集';
    const recruitType = RecruitType.RegularRecruit;
    const recruitRoleId = await UniqueRoleService.getRoleIdByKey(
        interaction.guildId,
        RoleKeySet.RegularRecruit.key,
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

    const regularData = await getRegularData(recruitData.schedule, recruitData.scheduleNum);
    assertExistCheck(regularData, 'regularData');

    const regularBuffers = await getRegularImageBuffers(recruitData, regularData);

    const recruitMessageList = await sendRecruitCanvas(
        interaction,
        recruitRoleId,
        recruitData,
        regularBuffers,
    );

    let eventId: string | null = null;
    if (exists(recruitData.voiceChannel)) {
        eventId = (
            await createRecruitEvent(
                recruitData.guild,
                `レギュラーマッチ - ${recruitData.recruiter.displayName}`,
                recruitData.recruiter.userId,
                recruitData.voiceChannel,
                regularBuffers.ruleBuffer,
                regularData.startTime,
                regularData.endTime,
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

    // 2時間後にボタンを無効化する
    await sleep(7200 - 15);

    await recruitAutoClose(
        recruitData,
        recruitMessageList.recruitMessage.id,
        recruitMessageList.buttonMessage,
    );
}

async function getRegularImageBuffers(
    recruitData: RecruitData,
    regularData: MatchInfo,
): Promise<RecruitImageBuffers> {
    const voiceChannel = recruitData.voiceChannel;
    const voiceChannelName = voiceChannel ? voiceChannel.name : null;

    const recruitBuffer = await recruitRegularCanvas(
        RecruitOpCode.open,
        recruitData.recruitNum,
        recruitData.count,
        recruitData.recruiter,
        recruitData.attendee1,
        recruitData.attendee2,
        recruitData.attendee3,
        null,
        null,
        null,
        null,
        recruitData.condition,
        voiceChannelName,
    );

    const ruleBuffer = await ruleRegularCanvas(regularData);

    return { recruitBuffer: recruitBuffer, ruleBuffer: ruleBuffer };
}
