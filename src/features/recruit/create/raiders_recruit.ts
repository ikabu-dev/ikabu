import {
    ChannelType,
    ChatInputCommandInteraction,
    MessageFlags,
    ModalSubmitInteraction,
    VoiceBasedChannel,
} from 'discord.js';

import { ErrorTexts } from '@/config/constants/error_texts';
import { RoleKeySet } from '@/config/constants/role_key';
import {
    createRecruit,
    RecruitCreateInteraction,
    RecruitSpec,
    voiceChannelName,
} from '@/features/recruit/create/common/recruit_pipeline';
import { RecruitConditionError } from '@/features/recruit/domain/types/recruit_condition_error';
import { RecruitData } from '@/features/recruit/domain/types/recruit_data';
import { validateRecruitNum } from '@/features/recruit/domain/validators/recruit_num_validator';
import { validateVoiceChannel } from '@/features/recruit/domain/validators/vc_validator';
import { recruitRaidersCanvas } from '@/features/recruit/ui/canvases/raiders_canvas';
import { RecruitOpCode } from '@/features/recruit/ui/canvases/regenerate_canvas';
import { buildRecruitText } from '@/features/recruit/ui/recruit_text';
import { RecruitType } from '@/infra/db/repositories/recruit_service';
import { UniqueRoleService } from '@/infra/db/repositories/unique_role_service';
import { Sp3Schedule } from '@/infra/external/splatoon3-ink/types/schedule';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendRecruitModalLog } from '@/infra/logging/recruit_modal_log';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { assertExistCheck, exists, notExists } from '@/shared/assert';
import { getGuildByInteraction } from '@/shared/discord_helpers/guild_manager';
import { searchAPIMemberById, searchDBMemberById } from '@/shared/discord_helpers/member_manager';
import { isEmpty } from '@/shared/string';

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

const spec: RecruitSpec<undefined> = {
    recruitName: 'レイダース募集',
    eventName: 'レイダース',
    autoClose: false,

    prepare: async (interaction) => {
        assertExistCheck(interaction.channel, 'channel');
        const recruitRoleId = await UniqueRoleService.getRoleIdByKey(
            interaction.guildId,
            RoleKeySet.RaidersRecruit.key,
        );

        if (notExists(recruitRoleId)) {
            await interaction.channel.send(
                '設定がおかしいでし！\n「お手数ですがサポートセンターまでご連絡お願いします。」でし！',
            );
            return null;
        }

        return {
            recruitType: RecruitType.RaidersRecruit,
            recruitRoleId,
            context: undefined,
        };
    },

    // レイダースにはスケジュールがないため、共通の整形処理（スケジュール検証を伴う）は使わない
    arrange: async (interaction, recruitName) => {
        if (interaction.isChatInputCommand()) {
            return await arrangeRaidersRecruitData(interaction, recruitName);
        }
        return await arrangeRaidersModalRecruitData(interaction, recruitName);
    },

    build: async (recruitData) => {
        const recruitBuffer = await recruitRaidersCanvas(
            RecruitOpCode.open,
            recruitData.recruitNum,
            recruitData.count,
            recruitData.recruiter,
            recruitData.attendee1,
            recruitData.attendee2,
            null,
            recruitData.condition,
            voiceChannelName(recruitData),
        );

        return {
            // レイダースにはルール画像がないため、募集カードをイベントのサムネイルに使う
            imageBuffers: { recruitBuffer, ruleBuffer: null },
            eventImage: recruitBuffer,
            option: null,
        };
    },
};

export async function raidersRecruit(interaction: RecruitCreateInteraction) {
    await createRecruit(interaction, spec);
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
