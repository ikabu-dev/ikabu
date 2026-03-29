import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';

import { embedRecruitDeleteButton, recruitActionRow } from './common/create_recruit_buttons';
import { ParticipantService } from '../../../db/participant_service';
import { RecruitService, RecruitType } from '../../../db/recruit_service';
import { UniqueRoleService } from '../../../db/unique_role_service';
import { log4js_obj } from '../../../log4js_settings';
import { searchDBMemberById } from '../../common/manager/member_manager';
import { searchMessageById } from '../../common/manager/message_manager';
import { assertExistCheck, exists, sleep } from '../../common/others';
import { RoleKeySet } from '../../constant/role_key';
import { sendErrorLogs } from '../../logs/error/send_error_logs';
import { getMemberMentions } from '../interactions/buttons/other_events';
import { sendRecruitSticky } from '../sticky/recruit_sticky_messages';

const logger = log4js_obj.getLogger('recruit');

export async function privateRecruit(interaction: ChatInputCommandInteraction<'cached'>) {
    await interaction.deferReply({});

    const options = interaction.options;
    const startTime = options.getString('開始時刻', true);
    const time = options.getString('所要時間', true);
    const recruitNumText = options.getString('募集人数', true);
    const condition = options.getString('内容または参加条件') ?? 'なし';
    const roomUrl = options.getString('ヘヤタテurl');
    const logo =
        'https://cdn.wikimg.net/en/splatoonwiki/images/1/1a/Private-battles-badge%402x.png';

    if (exists(roomUrl) && !isRoomUrl(roomUrl)) {
        await interaction.deleteReply();
        return await interaction.followUp({
            content: `\`${roomUrl}\`はヘヤタテURLではないでし！`,
            flags: MessageFlags.Ephemeral,
        });
    }

    assertExistCheck(interaction.channel, 'channel');

    const guild = interaction.guild;
    const recruiter = await searchDBMemberById(guild, interaction.member.user.id);
    const recruitChannel = interaction.channel;

    assertExistCheck(recruiter, 'recruiter');

    const embed = new EmbedBuilder()
        .setAuthor({
            name: recruiter.displayName,
            iconURL: recruiter.iconUrl,
        })
        .setTitle('プライベートマッチ募集')
        .addFields([
            {
                name: '開始時刻',
                value: startTime,
            },
            {
                name: '所要時間',
                value: time,
            },
            {
                name: '募集人数',
                value: recruitNumText,
            },
            {
                name: 'プラベ内容または参加条件',
                value: condition,
            },
            {
                name: 'ヘヤタテURL',
                value:
                    roomUrl !== null
                        ? 'あり\n`※参加ボタンを押すと参加用URLが表示されます。`'
                        : 'なし',
            },
        ])
        .setColor('#5900b7')
        .setTimestamp()
        .setThumbnail(logo);

    try {
        const embedMessage = await interaction.editReply({
            content: `### <@${recruiter.userId}>**たんのプライベート募集**`,
            embeds: [embed],
        });

        if (!embedMessage.inGuild()) return;

        let recruitNum = Number(recruitNumText);
        if (isNaN(recruitNum)) {
            recruitNum = -1;
        }

        // DBに募集情報を登録
        await RecruitService.registerRecruit(
            guild.id,
            recruitChannel.id,
            embedMessage.id,
            recruiter.userId,
            recruitNum,
            condition,
            null,
            null,
            RecruitType.PrivateRecruit,
            roomUrl,
        );

        // DBに参加者情報を登録
        await ParticipantService.registerParticipantFromMember(
            guild.id,
            embedMessage.id,
            recruiter,
            0,
        );

        const privateRecruitRoleId = await UniqueRoleService.getRoleIdByKey(
            guild.id,
            RoleKeySet.PrivateRecruit.key,
        );
        const mention = `<@&${privateRecruitRoleId}>`;
        const sentMessage = await recruitChannel.send({
            content:
                mention + ` ボタンを押して参加表明するでし！\n${getMemberMentions(recruitNum, [])}`,
        });
        // 募集文を削除してもボタンが動くように、bot投稿メッセージのメッセージIDでボタン作る
        await sentMessage.edit({ components: [recruitActionRow(embedMessage)] });
        const deleteButtonMsg = await recruitChannel.send({
            components: [embedRecruitDeleteButton(sentMessage, embedMessage)],
        });

        await interaction.followUp({
            content:
                '募集完了でし！参加者が来るまで気長に待つでし！\n15秒間は募集を取り消せるでし！',
            flags: MessageFlags.Ephemeral,
        });

        // 募集リスト更新
        if (recruitChannel.isTextBased()) {
            await sendRecruitSticky({ channelOpt: { guild: guild, channelId: recruitChannel.id } });
        }

        // 15秒後に削除ボタンを消す
        await sleep(15);
        const deleteButtonCheck = await searchMessageById(
            guild,
            recruitChannel.id,
            deleteButtonMsg.id,
        );
        if (exists(deleteButtonCheck)) {
            await deleteButtonCheck.delete();
        } else {
            return;
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}

function isRoomUrl(url: string) {
    return url.match(/https:\/\/s.nintendo.com\//g) !== null;
}
