import { ButtonInteraction, MessageFlags } from 'discord.js';

import { ErrorTexts } from '@/config/constants/error_texts';
import { memberListText } from '@/features/recruit/common/member_list';
import { sendJoinNotifyToHost } from '@/features/recruit/common/send_notify_to_host';
import {
    getStickyChannelId,
    sendRecruitSticky,
} from '@/features/recruit/sticky/recruit_sticky_messages';
import {
    channelLinkButtons,
    nsoRoomLinkButton,
} from '@/features/recruit/ui/buttons/create_recruit_buttons';
import { RecruitOpCode, regenerateCanvas } from '@/features/recruit/ui/canvases/regenerate_canvas';
import { ParticipantService, ParticipantMember } from '@/infra/db/repositories/participant_service';
import { RecruitService, RecruitType } from '@/infra/db/repositories/recruit_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendRecruitButtonLog } from '@/infra/logging/recruit_button_log';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { assertExistCheck, exists, notExists } from '@/shared/assert';
import {
    disableThinkingButton,
    recoveryThinkingButton,
} from '@/shared/discord_helpers/button_components';
import { getGuildByInteraction } from '@/shared/discord_helpers/guild_manager';
import { searchDBMemberById } from '@/shared/discord_helpers/member_manager';

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
