import {
    ChannelType,
    ChatInputCommandInteraction,
    MessageFlags,
    ModalSubmitInteraction,
    VoiceBasedChannel,
} from 'discord.js';

import { Sp3Schedule } from '@/app/common/apis/splatoon3.ink/types/schedule';
import { getGuildByInteraction } from '@/app/common/manager/guild_manager';
import { searchAPIMemberById, searchDBMemberById } from '@/app/common/manager/member_manager';
import { assertExistCheck, exists, isEmpty, notExists, sleep } from '@/app/common/others';
import { ErrorTexts } from '@/app/constant/error_texts';
import { RoleKeySet } from '@/app/constant/role_key';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { sendRecruitModalLog } from '@/app/logs/modals/recruit_modal_log';
import { RecruitType } from '@/db/recruit_service';
import { UniqueRoleService } from '@/db/unique_role_service';
import { log4js_obj } from '@/log4js_settings';

import { buildRecruitText } from './common/recruit_text';
import { registerRecruitData } from './common/register_recruit_data';
import { removeDeleteButton } from './common/remove_delete_button';
import { sendRecruitCanvas, RecruitImageBuffersWithoutRule } from './common/send_recruit_message';
import { validateRecruitNum } from './validators/recruit_num_validator';
import { validateVoiceChannel } from './validators/vc_validator';
import { recruitRaidersCanvas } from '../common/canvases/raiders_canvas';
import { RecruitOpCode } from '../common/canvases/regenerate_canvas';
import { RecruitConditionError } from '../common/types/recruit_condition_error';
import { RecruitData } from '../common/types/recruit_data';
import { sendRecruitSticky } from '../sticky/recruit_sticky_messages';
import { createRecruitEvent } from '../vc_reservation/recruit_event';

const logger = log4js_obj.getLogger('recruit');

// レイダースにはスケジュールが存在しないため、空のスケジュールを RecruitData に渡す
const emptySchedule: Sp3Schedule = {
    regularSchedules: { nodes: [] },
    bankaraSchedules: { nodes: [] },
    xSchedules: { nodes: [] },
    eventSchedules: { nodes: [] },
    festSchedules: { nodes: [] },
    coopGroupingSchedule: {
        bannerImage: { url: '' },
        regularSchedules: { nodes: [] },
        bigRunSchedules: { nodes: [] },
        teamContestSchedules: { nodes: [] },
    },
};

export async function raidersRecruit(
    interaction: ChatInputCommandInteraction<'cached'> | ModalSubmitInteraction<'cached' | 'raw'>,
) {
    assertExistCheck(interaction.channel, 'channel');
    // 'インタラクションに失敗'が出ないようにするため
    await interaction.deferReply({});

    const recruitName = 'レイダース募集';
    const recruitRoleId = await UniqueRoleService.getRoleIdByKey(
        interaction.guildId,
        RoleKeySet.RaidersRecruit.key,
    );

    if (notExists(recruitRoleId)) {
        await interaction.channel.send(
            '設定がおかしいでし！\n「お手数ですがサポートセンターまでご連絡お願いします。」でし！',
        );
        return;
    }

    let recruitData: RecruitData;
    if (interaction.isChatInputCommand()) {
        try {
            recruitData = await arrangeRaidersRecruitData(interaction, recruitName);
        } catch (error) {
            return;
        }
    } else if (interaction.isModalSubmit()) {
        try {
            recruitData = await arrangeRaidersModalRecruitData(interaction, recruitName);
        } catch (error) {
            return;
        }
    } else {
        throw new Error('interaction type is invalid');
    }

    const raidersBuffers = await getRaidersImageBuffers(recruitData);

    const recruitMessageList = await sendRecruitCanvas(
        interaction,
        recruitRoleId,
        recruitData,
        raidersBuffers,
    );

    let eventId: string | null = null;
    if (exists(recruitData.voiceChannel)) {
        eventId = (
            await createRecruitEvent(
                recruitData.guild,
                `レイダース - ${recruitData.recruiter.displayName}`,
                recruitData.recruiter.userId,
                recruitData.voiceChannel,
                raidersBuffers.recruitBuffer,
                new Date(),
            )
        ).id;
    }

    await registerRecruitData(
        recruitMessageList.recruitMessage.id,
        RecruitType.RaidersRecruit,
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

/*
 * コマンド入力を RecruitData に整形する
 * (レイダースにはスケジュールがないため、スケジュール取得・検証は行わない)
 */
async function arrangeRaidersRecruitData(
    interaction: ChatInputCommandInteraction<'cached'>,
    recruitName: string,
): Promise<RecruitData> {
    const guild = interaction.guild;
    const options = interaction.options;
    const interactionMember = interaction.member;
    const recruitChannel = interaction.channel;
    assertExistCheck(recruitChannel, 'interaction.channel');

    const voiceChannel = options.getChannel('使用チャンネル', false, [
        ChannelType.GuildVoice,
        ChannelType.GuildStageVoice,
    ]);
    const recruitNum = options.getInteger('募集人数', true);
    const condition = options.getString('参加条件') ?? 'なし';

    const recruiter = await searchDBMemberById(guild, interactionMember.id);
    assertExistCheck(recruiter, 'Member');

    const user1 = options.getUser('参加者1');
    const user2 = options.getUser('参加者2');
    const attendee1 = exists(user1) ? await searchDBMemberById(guild, user1.id) : null;
    const attendee2 = exists(user2) ? await searchDBMemberById(guild, user2.id) : null;

    try {
        const count = validateRecruitNum(
            recruitNum,
            RecruitType.RaidersRecruit,
            attendee1,
            attendee2,
            null,
        );
        await validateVoiceChannel(guild.id, voiceChannel, recruiter.userId);
        const txt = buildRecruitText(recruiter.mention, recruitName, attendee1, attendee2, null);

        return {
            guild,
            interactionMember,
            recruitChannel,
            scheduleNum: 0,
            txt,
            recruitNum,
            condition,
            count,
            recruiter,
            attendee1,
            attendee2,
            attendee3: null,
            schedule: emptySchedule,
            voiceChannel,
        };
    } catch (error) {
        if (error instanceof RecruitConditionError) {
            await interaction.deleteReply();
            await interaction.followUp({
                content: `\`${interaction.toString()}\`\n${error.getErrorMessage()}`,
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await recruitChannel.send(ErrorTexts.UndefinedError);
            await sendErrorLogs(logger, error);
        }
        throw error;
    }
}

/*
 * モーダル入力を RecruitData に整形する
 * (レイダースにはスケジュールがないため、スケジュール取得・検証は行わない)
 */
async function arrangeRaidersModalRecruitData(
    interaction: ModalSubmitInteraction<'cached' | 'raw'>,
    recruitName: string,
): Promise<RecruitData> {
    const guild = await getGuildByInteraction(interaction);
    const interactionMember = await searchAPIMemberById(guild, interaction.member.user.id);
    const recruitChannel = interaction.channel;
    assertExistCheck(interactionMember, 'GuildMember');
    assertExistCheck(recruitChannel, 'interaction.channel');

    await sendRecruitModalLog(interaction);

    const voiceChannelCollection = interaction.fields.fields.has('voiceChannel')
        ? interaction.fields.getSelectedChannels('voiceChannel', false, [ChannelType.GuildVoice])
        : null;
    const voiceChannel = voiceChannelCollection
        ? (([...voiceChannelCollection.values()][0] as VoiceBasedChannel) ?? null)
        : null;

    const recruitNum = Number(interaction.fields.getTextInputValue('rNum'));
    let condition = interaction.fields.getTextInputValue('condition');
    if (isEmpty(condition)) condition = 'なし';

    const recruiter = await searchDBMemberById(guild, interactionMember.id);
    assertExistCheck(recruiter, 'Member');

    const attendeeUsersCollection = interaction.fields.fields.has('attendees')
        ? interaction.fields.getSelectedUsers('attendees')
        : null;
    const attendeeUsers = attendeeUsersCollection ? [...attendeeUsersCollection.values()] : [];
    const attendee1 = attendeeUsers[0]
        ? await searchDBMemberById(guild, attendeeUsers[0].id)
        : null;
    const attendee2 = attendeeUsers[1]
        ? await searchDBMemberById(guild, attendeeUsers[1].id)
        : null;

    try {
        const count = validateRecruitNum(
            recruitNum,
            RecruitType.RaidersRecruit,
            attendee1,
            attendee2,
            null,
        );
        await validateVoiceChannel(guild.id, voiceChannel, recruiter.userId);
        const txt = buildRecruitText(recruiter.mention, recruitName, attendee1, attendee2, null);

        return {
            guild,
            interactionMember,
            recruitChannel,
            scheduleNum: 0,
            txt,
            recruitNum,
            condition,
            count,
            recruiter,
            attendee1,
            attendee2,
            attendee3: null,
            schedule: emptySchedule,
            voiceChannel,
        };
    } catch (error) {
        if (error instanceof RecruitConditionError) {
            await interaction.deleteReply();
            await interaction.followUp({
                content: `${error.getErrorMessage()}`,
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await recruitChannel.send(ErrorTexts.UndefinedError);
            await sendErrorLogs(logger, error);
        }
        throw error;
    }
}

async function getRaidersImageBuffers(
    recruitData: RecruitData,
): Promise<RecruitImageBuffersWithoutRule> {
    const voiceChannel = recruitData.voiceChannel;
    const voiceChannelName = voiceChannel ? voiceChannel.name : null;

    const recruitBuffer = await recruitRaidersCanvas(
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
    return { recruitBuffer: recruitBuffer, ruleBuffer: null };
}
