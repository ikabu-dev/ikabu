import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';

import { notifyActionRow } from './common/create_recruit_buttons';
import { ParticipantService } from '../../../db/participant_service';
import { RecruitService, RecruitType } from '../../../db/recruit_service';
import { UniqueChannelService } from '../../../db/unique_channel_service';
import { UniqueRoleService } from '../../../db/unique_role_service';
import { searchChannelById } from '../../common/manager/channel_manager';
import { searchDBMemberById } from '../../common/manager/member_manager';
import { assertExistCheck, exists, getDeveloperMention, notExists } from '../../common/others';
import { ChannelKeySet } from '../../constant/channel_key';
import { RoleKeySet } from '../../constant/role_key';
import { getMemberMentions } from '../common/member_list';
import { sendRecruitSticky } from '../sticky/recruit_sticky_messages';

export async function buttonRecruit(interaction: ChatInputCommandInteraction<'cached'>) {
    assertExistCheck(interaction.channel, 'channel');

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild;

    const privateRecruitChannelId = await UniqueChannelService.getChannelIdByKey(
        guild.id,
        ChannelKeySet.PrivateRecruit.key,
    );
    const otherGamesRecruitChannelId = await UniqueChannelService.getChannelIdByKey(
        guild.id,
        ChannelKeySet.OtherGamesRecruit.key,
    );

    if (notExists(privateRecruitChannelId) || notExists(otherGamesRecruitChannelId)) {
        await interaction.editReply('募集に失敗したでし！');
        return interaction.channel.send({
            content:
                (await getDeveloperMention(guild.id)) + '募集チャンネルが設定されていないでし！',
        });
    }

    const recruiter = await searchDBMemberById(guild, interaction.member.user.id);
    const recruitChannel = await searchChannelById(guild, interaction.channel.id);
    if (notExists(recruitChannel) || !recruitChannel.isTextBased()) return;
    const recruitNum = interaction.options.getInteger('募集人数') ?? -1;

    let rChannelName = recruitChannel.name;
    if (recruitChannel.isThread() && exists(recruitChannel.parent)) {
        rChannelName = recruitChannel.parent.name;
    }

    let recruitType;
    // チャンネル名から募集種別を判定
    if (rChannelName.includes('プラベ')) {
        recruitType = RecruitType.PrivateRecruit;
    } else if (rChannelName.includes('別ゲー')) {
        recruitType = RecruitType.OtherGameRecruit;
    } else {
        recruitType = RecruitType.OtherGameRecruit;
    }

    const privateRecruitRoleId = await UniqueRoleService.getRoleIdByKey(
        guild.id,
        RoleKeySet.PrivateRecruit.key,
    );
    const otherGamesRecruitRoleId = await UniqueRoleService.getRoleIdByKey(
        guild.id,
        RoleKeySet.OtherGamesRecruit.key,
    );

    let mention = '';
    if (recruitType === RecruitType.PrivateRecruit) {
        mention = `<@&${privateRecruitRoleId}>`;
    } else if (recruitType === RecruitType.OtherGameRecruit) {
        mention = `<@&${otherGamesRecruitRoleId}>`;
    }

    assertExistCheck(recruiter, 'recruiter');

    const sentMessage = await recruitChannel.send({
        content:
            mention + ` ボタンを押して参加表明するでし！\n${getMemberMentions(recruitNum, [])}`,
    });
    // DBに募集情報を登録
    await RecruitService.registerRecruit(
        guild.id,
        recruitChannel.id,
        sentMessage.id,
        recruiter.userId,
        recruitNum,
        'dummy',
        null,
        null,
        recruitType,
    );

    // DBに参加者情報を登録
    await ParticipantService.registerParticipantFromMember(guild.id, sentMessage.id, recruiter, 0);

    // 募集リスト更新
    if (recruitType === RecruitType.PrivateRecruit) {
        await sendRecruitSticky({
            channelOpt: { guild: guild, channelId: privateRecruitChannelId },
        });
    } else if (recruitType === RecruitType.OtherGameRecruit) {
        await sendRecruitSticky({
            channelOpt: { guild: guild, channelId: otherGamesRecruitChannelId },
        });
    }

    await interaction.editReply({
        content: '募集完了でし！参加者が来るまで気長に待つでし！',
    });
    await sentMessage.edit({ components: [notifyActionRow()] });
}
