import { ButtonInteraction, MessageFlags } from 'discord.js';

import { sendRecruitButtonLog } from '../.././../logs/buttons/recruit_button_log';
import { ParticipantService, ParticipantMember } from '../../../../db/participant_service.js';
import { RecruitService } from '../../../../db/recruit_service.js';
import { log4js_obj } from '../../../../log4js_settings.js';
import { recoveryThinkingButton, setButtonDisable } from '../../../common/button_components';
import { getGuildByInteraction } from '../../../common/manager/guild_manager';
import { searchDBMemberById } from '../../../common/manager/member_manager.js';
import { searchMessageById } from '../../../common/manager/message_manager.js';
import { assertExistCheck, exists, notExists } from '../../../common/others.js';
import { ErrorTexts } from '../../../constant/error_texts';
import { sendErrorLogs } from '../../../logs/error/send_error_logs';
import { cancelRecruitEvent } from '../../vc_reservation/recruit_event';
import { getStickyChannelId, sendRecruitSticky } from '../../sticky/recruit_sticky_messages';

const logger = log4js_obj.getLogger('recruitButton');

export async function del(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    if (!interaction.message.inGuild()) return;
    try {
        assertExistCheck(interaction.channel, 'channel');

        const guild = await getGuildByInteraction(interaction);
        const member = await searchDBMemberById(guild, interaction.member.user.id);
        assertExistCheck(member, 'member');
        const buttonMessageId = params.get('mid');
        assertExistCheck(buttonMessageId, "params.get('mid')");
        const buttonMessage = await searchMessageById(
            guild,
            interaction.channelId,
            buttonMessageId,
        );
        const image1MsgId = params.get('imid1');
        assertExistCheck(image1MsgId, "params.get('imid1')");
        const image1Message = await searchMessageById(guild, interaction.channelId, image1MsgId);
        const image2MsgId = params.get('imid2');
        let image2Message;
        if (exists(image2MsgId)) {
            image2Message = await searchMessageById(guild, interaction.channelId, image2MsgId);
        }

        const participantsData = await ParticipantService.getAllParticipants(guild.id, image1MsgId);

        if (participantsData.length === 0) {
            await interaction.editReply({
                components: setButtonDisable(interaction.message),
            });
            await interaction.followUp({
                content: 'この募集はもう削除できないでし！',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        let recruiter = participantsData[0]; // 募集者
        const attendeeList: ParticipantMember[] = []; // 募集時参加確定者リスト
        const applicantList: ParticipantMember[] = []; // 参加希望者リスト
        for (const participant of participantsData) {
            if (participant.userType === 0) {
                recruiter = participant;
            } else if (participant.userType === 1) {
                attendeeList.push(participant);
            } else {
                applicantList.push(participant);
            }
        }

        // 募集者と募集時参加確定者のIDリスト
        const confirmedMemberIDList = [];
        confirmedMemberIDList.push(recruiter.userId);
        for (const attendee of attendeeList) {
            confirmedMemberIDList.push(attendee.userId);
        }

        await sendRecruitButtonLog(interaction, member, recruiter, '削除', '#f04747');

        if (confirmedMemberIDList.includes(member.userId)) {
            try {
                await interaction.message.delete();
            } catch (error) {
                logger.warn('recruit delete button has already been deleted');
            }

            if (exists(image1Message)) {
                try {
                    await image1Message.delete();
                } catch (error) {
                    logger.warn('recruit message or recruit image has already been deleted');
                }
            }

            if (exists(image2Message)) {
                try {
                    await image2Message.delete();
                } catch (error) {
                    logger.warn('rule image has already been deleted.');
                }
            }

            if (exists(buttonMessage)) {
                try {
                    await buttonMessage.delete();
                } catch (error) {
                    logger.warn('recruit components has already been deleted');
                }
            }

            const recruitData = await RecruitService.getRecruit(guild.id, image1MsgId);

            if (notExists(recruitData)) {
                return await interaction.followUp({
                    content: '募集データが存在しないでし！',
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (exists(recruitData.eventId)) {
                await cancelRecruitEvent(guild, recruitData.eventId);
            }

            // recruitテーブルから削除
            await RecruitService.deleteRecruit(guild.id, image1MsgId);

            // participantsテーブルから該当募集のメンバー全員削除
            await ParticipantService.deleteAllParticipant(guild.id, image1MsgId);

            await interaction.followUp({
                content: '募集を削除したでし！\n次回は内容をしっかり確認してから送信するでし！',
                flags: MessageFlags.Ephemeral,
            });

            // テキストの募集チャンネルにSticky Messageを送信
            const stickyChannelId =
                (await getStickyChannelId(recruitData)) ?? interaction.channel.id;
            await sendRecruitSticky({ channelOpt: { guild: guild, channelId: stickyChannelId } });
        } else {
            await interaction.editReply({
                components: recoveryThinkingButton(interaction, '募集を削除'),
            });
            await interaction.followUp({
                content: '他人の募集は消せる訳無いでし！！！',
                flags: MessageFlags.Ephemeral,
            });
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        await interaction.message.edit({
            components: setButtonDisable(interaction.message),
        });
        await interaction.channel?.send(ErrorTexts.UndefinedError);
    }
}
