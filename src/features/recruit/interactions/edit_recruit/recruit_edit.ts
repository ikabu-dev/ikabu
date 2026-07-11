import { BaseGuildTextChannel, MessageFlags, ModalSubmitInteraction } from 'discord.js';

import { ErrorTexts } from '@/config/constants/error_texts';
import { StickyKey } from '@/config/constants/sticky_key';
import { availableRecruitString } from '@/features/recruit/sticky/recruit_sticky_messages';
import { RecruitOpCode, regenerateCanvas } from '@/features/recruit/ui/canvases/regenerate_canvas';
import { regenerateEmbed } from '@/features/recruit/ui/embeds/regenerate_embed';
import { ParticipantService } from '@/infra/db/repositories/participant_service';
import { RecruitService, RecruitType } from '@/infra/db/repositories/recruit_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendEditRecruitLog } from '@/infra/logging/recruit_modal_log';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { assertExistCheck, notExists } from '@/shared/assert';
import { getGuildByInteraction } from '@/shared/discord_helpers/guild_manager';
import { sendStickyMessage } from '@/shared/discord_helpers/sticky_message';

const logger = log4js_obj.getLogger('interaction');

export async function recruitEdit(
    interaction: ModalSubmitInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    try {
        const messageId = params.get('mid');
        assertExistCheck(messageId, "params.get('mid')");

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const guild = await getGuildByInteraction(interaction);

        const oldRecruitData = await RecruitService.getRecruit(guild.id, messageId);

        if (notExists(oldRecruitData)) {
            return interaction.editReply('募集データが存在しないでし！');
        }

        let remaining = interaction.fields.getTextInputValue('remaining');
        remaining = remaining.replace(/\s+/g, '');
        remaining = remaining.replace(/　+/g, '');

        let replyMessage = '';
        if (remaining !== '' && !isNaN(Number(remaining))) {
            replyMessage += await editRecruitNum(
                guild.id,
                messageId,
                oldRecruitData.recruitType,
                Number(remaining),
            );
        }

        const conditionStr = interaction.fields.getTextInputValue('condition');
        let conditionCheck = conditionStr.replace(/\s+/g, '');
        conditionCheck = conditionCheck.replace(/　+/g, '');

        if (conditionCheck !== '') {
            replyMessage += await editCondition(guild.id, messageId, conditionStr);
        }

        if (replyMessage === '') {
            replyMessage = '何も入力されなかったでし！';
        } else {
            replyMessage += '\n**メンバーリストを更新するには参加ボタンを押すでし！**';
        }

        if (notExists(interaction.channel)) {
            return interaction.editReply('エラーでし！');
        }

        const channelId = interaction.channel.id;

        switch (oldRecruitData.recruitType) {
            case RecruitType.RegularRecruit:
            case RecruitType.AnarchyRecruit:
            case RecruitType.EventRecruit:
            case RecruitType.SalmonRecruit:
            case RecruitType.FestivalRecruit:
            case RecruitType.BigRunRecruit:
            case RecruitType.RaidersRecruit:
                await regenerateCanvas(guild, channelId, messageId, RecruitOpCode.open);
                break;
            case RecruitType.PrivateRecruit:
            case RecruitType.OtherGameRecruit:
                await regenerateEmbed(guild, channelId, messageId, oldRecruitData.recruitType);
        }

        const newRecruitData = await RecruitService.getRecruit(guild.id, messageId);

        if (notExists(newRecruitData)) {
            return interaction.editReply('募集データの更新に失敗したでし！');
        }

        await sendEditRecruitLog(guild, oldRecruitData, newRecruitData, interaction.createdAt);

        if (interaction.channel instanceof BaseGuildTextChannel) {
            await sendStickyMessage(guild, channelId, StickyKey.AvailableRecruit, {
                content: await availableRecruitString(guild, interaction.channel.id),
                flags: MessageFlags.SuppressNotifications,
            });
        }

        await interaction.editReply(replyMessage);
    } catch (error) {
        await sendErrorLogs(logger, error);
        if (interaction.channel instanceof BaseGuildTextChannel) {
            await interaction.channel.send(ErrorTexts.UndefinedError);
        }
    }
}

async function editRecruitNum(
    guildId: string,
    messageId: string,
    recruitType: number,
    remainingNum: number,
) {
    const participants = await ParticipantService.getAllParticipants(guildId, messageId);
    const recruitersList = [];
    for (const participant of participants) {
        if (participant.userType === 0 || participant.userType === 1) {
            recruitersList.push(participant);
        }
    }
    const memberCount = participants.length + remainingNum;
    let replyMessage;

    let limit;
    switch (recruitType) {
        case RecruitType.AnarchyRecruit:
        case RecruitType.EventRecruit:
        case RecruitType.SalmonRecruit:
        case RecruitType.FestivalRecruit:
        case RecruitType.BigRunRecruit:
        case RecruitType.RaidersRecruit:
            limit = 4;
            break;
        case RecruitType.RegularRecruit:
            limit = 8;
            break;
        default:
            limit = 99;
    }

    let recruitNum;
    if (memberCount > limit) {
        recruitNum = limit - recruitersList.length;
        replyMessage = '募集人数が多すぎるでし！\n利用可能な最大値に設定したでし！';
    } else {
        recruitNum = memberCount - recruitersList.length;
        replyMessage = '募集人数を設定したでし！';
    }

    await RecruitService.updateRecruitNum(guildId, messageId, recruitNum);

    return replyMessage;
}

async function editCondition(guildId: string, messageId: string, condition: string) {
    await RecruitService.updateCondition(guildId, messageId, condition);
    return '\n参加条件を更新したでし！';
}
