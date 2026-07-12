import { Role } from '@prisma/client';

import {
    createRecruit,
    RecruitCreateInteraction,
    RecruitSpec,
    voiceChannelName,
} from '@/features/recruit/create/common/recruit_pipeline';
import { recruitFestCanvas, ruleFestCanvas } from '@/features/recruit/ui/canvases/fest_canvas';
import { RecruitOpCode } from '@/features/recruit/ui/canvases/regenerate_canvas';
import { RecruitType } from '@/infra/db/repositories/recruit_service';
import { RoleService } from '@/infra/db/repositories/role_service';
import { getFesRegularData } from '@/infra/external/splatoon3-ink/splatoon3_ink';
import { assertExistCheck, notExists } from '@/shared/assert';
import { getDeveloperMention } from '@/shared/discord_helpers/developer_mention';

const spec: RecruitSpec<Role> = {
    recruitName: 'フェス募集',
    eventName: 'フェスマッチ',
    autoClose: true,

    prepare: async (interaction) => {
        const teamRole = await getFestRecruitRole(interaction);
        return {
            recruitType: RecruitType.FestivalRecruit,
            recruitRoleId: teamRole.roleId,
            context: teamRole,
        };
    },

    build: async (recruitData, { context: teamRole }) => {
        const festData = await getFesRegularData(recruitData.schedule, recruitData.scheduleNum);
        assertExistCheck(festData, 'festData');

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
            voiceChannelName(recruitData),
        );
        const ruleBuffer = await ruleFestCanvas(festData);

        return {
            imageBuffers: { recruitBuffer, ruleBuffer },
            eventImage: ruleBuffer,
            scheduleStartTime: festData.startTime,
            scheduleEndTime: festData.endTime,
            option: teamRole.name, // フェスのチーム名
        };
    },
};

export async function festRecruit(interaction: RecruitCreateInteraction) {
    await createRecruit(interaction, spec);
}

async function getFestRecruitRole(interaction: RecruitCreateInteraction): Promise<Role> {
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
