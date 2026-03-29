import { ButtonInteraction, MessageFlags } from 'discord.js';

import { ParticipantService, ParticipantMember } from '../../../db/participant_service.js';
import { RecruitService, RecruitType } from '../../../db/recruit_service.js';
import { log4js_obj } from '../../../log4js_settings.js';
import {
    disableThinkingButton,
    recoveryThinkingButton,
} from '../../common/button_components.js';
import { getGuildByInteraction } from '../../common/manager/guild_manager.js';
import { searchDBMemberById } from '../../common/manager/member_manager.js';
import { assertExistCheck, exists, notExists } from '../../common/others.js';
import { ErrorTexts } from '../../constant/error_texts.js';
import { sendRecruitButtonLog } from '../../logs/buttons/recruit_button_log.js';
import { sendErrorLogs } from '../../logs/error/send_error_logs.js';
import { RecruitOpCode, regenerateCanvas } from '../canvases/regenerate_canvas.js';
import { channelLinkButtons, nsoRoomLinkButton } from '../create_recruit/common/create_recruit_buttons.js';
import { memberListText } from '../interactions/buttons/other_events.js';
import { sendJoinNotifyToHost } from '../interactions/buttons/send_notify_to_host.js';
import { getStickyChannelId, sendRecruitSticky } from '../sticky/recruit_sticky_messages.js';

const logger = log4js_obj.getLogger('recruitButton');

export async function join(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    if (!interaction.message.inGuild()) return;
    try {
        assertExistCheck(interaction.channel, 'channel');

        const guild = await getGuildByInteraction(interaction);
        const channelId = params.get('vid');
        const image1MsgId = params.get('imid1');
        assertExistCheck(image1MsgId, "params.get('imid1')");

        // interaction.member.user.idでなければならない。なぜならば、APIInteractionGuildMemberはid を直接持たないからである。
        const member = await searchDBMemberById(guild, interaction.member.user.id);
        assertExistCheck(member, 'member');

        const recruitData = await RecruitService.getRecruit(guild.id, image1MsgId);

        if (notExists(recruitData)) {
            await interaction.editReply({ components: disableThinkingButton(interaction, '参加') });
            await interaction.followUp({
                content: '募集データが存在しないでし！',
            });
            return;
        }

        const participantsData = await ParticipantService.getAllParticipants(guild.id, image1MsgId);

        let recruiter = participantsData[0]; // 募集者
        const recruiterId = recruitData.authorId;
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
        confirmedMemberIDList.push(recruiterId);
        for (const attendee of attendeeList) {
            confirmedMemberIDList.push(attendee.userId);
        }

        //  参加希望者のIDリスト
        const applicantIdList = [];
        for (const applicant of applicantList) {
            applicantIdList.push(applicant.userId);
        }

        await sendRecruitButtonLog(interaction, member, recruiter, '参加', '#5865f2');

        if (confirmedMemberIDList.includes(member.userId)) {
            await interaction.followUp({
                content: '募集メンバーは参加表明できないでし！',
                flags: MessageFlags.Ephemeral,
            });

            await interaction.editReply({
                content: await memberListText(interaction, image1MsgId),
                components: recoveryThinkingButton(interaction, '参加'),
            });
            return;
        } else {
            // 参加済みかチェック
            if (applicantIdList.includes(member.userId)) {
                await interaction.followUp({
                    content: '既に参加ボタンを押してるでし！',
                    flags: MessageFlags.Ephemeral,
                });

                await interaction.editReply({
                    components: recoveryThinkingButton(interaction, '参加'),
                });
                return;
            }

            // recruitテーブルにデータ追加
            await ParticipantService.registerParticipant(
                guild.id,
                image1MsgId,
                member.userId,
                2,
                new Date(),
            );

            const recruitChannel = interaction.channel;

            await regenerateCanvas(guild, recruitChannel.id, image1MsgId, RecruitOpCode.open);

            // 募集をしたメンバー全員に通知
            sendJoinNotifyToHost(
                interaction.message,
                image1MsgId,
                guild,
                recruitChannel,
                member,
                recruiter,
                attendeeList,
            );

            // テキストの募集チャンネルにSticky Messageを送信
            const stickyChannelId = (await getStickyChannelId(recruitData)) ?? recruitChannel.id;
            await sendRecruitSticky({ channelOpt: { guild: guild, channelId: stickyChannelId } });

            if (notExists(channelId)) {
                await interaction.followUp({
                    content: `<@${recruiterId}>からの返答を待つでし！\n条件を満たさない場合は参加を断られる場合があるでし！`,
                    // components: [channelLinkButtons(interaction.guildId, thread_message.url)], TODO: スレッド内へのリンクボタンを作る
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                await interaction.followUp({
                    content: `<@${recruiterId}>からの返答を待つでし！\n条件を満たさない場合は参加を断られる場合があるでし！`,
                    components: [channelLinkButtons(guild.id, channelId)],
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (
                recruitData.recruitType === RecruitType.PrivateRecruit &&
                exists(recruitData.option)
            ) {
                await interaction.followUp({
                    content: `ボタンを押すとヘヤタテ機能を使ってプライベートマッチの部屋に参加できるでし！`,
                    components: [nsoRoomLinkButton(recruitData.option)],
                    flags: MessageFlags.Ephemeral,
                });
            }

            await interaction.editReply({
                content: await memberListText(interaction, image1MsgId),
                components: recoveryThinkingButton(interaction, '参加'),
            });
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        await interaction.message.edit({
            components: disableThinkingButton(interaction, '参加'),
        });
        await interaction.channel?.send(ErrorTexts.UndefinedError);
    }
}
