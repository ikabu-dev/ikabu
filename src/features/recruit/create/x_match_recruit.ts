import { MessageFlags } from 'discord.js';

import { ChannelKeySet } from '@/config/constants/channel_key';
import { X_POWER_BANDS } from '@/config/constants/recruit';
import { RoleKeySet } from '@/config/constants/role_key';
import {
    createRecruit,
    RecruitCreateInteraction,
    RecruitSpec,
    voiceChannelName,
} from '@/features/recruit/create/common/recruit_pipeline';
import {
    recruitAnarchyCanvas,
    ruleAnarchyCanvas,
} from '@/features/recruit/ui/canvases/anarchy_canvas';
import { RecruitOpCode } from '@/features/recruit/ui/canvases/regenerate_canvas';
import { RecruitType } from '@/infra/db/repositories/recruit_service';
import { UniqueChannelService } from '@/infra/db/repositories/unique_channel_service';
import { UniqueRoleService } from '@/infra/db/repositories/unique_role_service';
import { getXMatchData } from '@/infra/external/splatoon3-ink/splatoon3_ink';
import { log4js_obj } from '@/infra/logging/log4js';
import { assertExistCheck } from '@/shared/assert';
import { rule2image } from '@/shared/splatoon/rule_image';

type XPowerBand = (typeof X_POWER_BANDS)[number];

const logger = log4js_obj.getLogger('recruit');

const spec: RecruitSpec<XPowerBand> = {
    recruitName: ChannelKeySet.XMatchRecruit.name,
    eventName: 'Xマッチ',
    autoClose: true,

    prepare: async (interaction) => {
        const selectedBand = interaction.isChatInputCommand()
            ? interaction.options.getString('xp帯', true)
            : interaction.fields.getStringSelectValues('xPowerBand')[0];
        const band = X_POWER_BANDS.find((option) => option === selectedBand);
        if (band === undefined) {
            await interaction.editReply('Xパワー帯を選択するでし！');
            return null;
        }

        const recruitRoleId = await UniqueRoleService.getRoleIdByKey(
            interaction.guildId,
            RoleKeySet.XMatchRecruit.key,
        );
        if (recruitRoleId === null) {
            logger.warn(`Xマッチ募集ロールが未設定です [guildId: ${interaction.guildId}]`);
        }

        return {
            recruitType: RecruitType.XMatchRecruit,
            recruitRoleId,
            context: band,
        };
    },

    build: async (data, { context: band }) => {
        const match = await getXMatchData(data.schedule, data.scheduleNum);
        assertExistCheck(match, 'xMatchData');
        assertExistCheck(match.rule, 'xMatchRule');

        const recruitBuffer = await recruitAnarchyCanvas(
            RecruitOpCode.open,
            data.recruitNum,
            data.count,
            data.recruiter,
            null,
            null,
            null,
            data.condition,
            band,
            voiceChannelName(data),
            'xMatch',
        );
        const ruleBuffer = await ruleAnarchyCanvas(match, rule2image(match.rule));
        return {
            imageBuffers: { recruitBuffer, ruleBuffer },
            eventImage: ruleBuffer,
            messageDetail: `**${match.rule}** ｜ Xパワー ${band}`,
            scheduleStartTime: match.startTime,
            scheduleEndTime: match.endTime,
            option: band,
        };
    },
};

export async function xMatchRecruit(interaction: RecruitCreateInteraction) {
    const channelId = await UniqueChannelService.getChannelIdByKey(
        interaction.guildId,
        ChannelKeySet.XMatchRecruit.key,
    );
    if (channelId === null || interaction.channelId !== channelId) {
        await interaction.reply({
            content: channelId
                ? `<#${channelId}> でXマッチ募集をするでし！`
                : 'Xマッチ募集チャンネルが設定されていないでし！',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    await createRecruit(interaction, spec);
}
