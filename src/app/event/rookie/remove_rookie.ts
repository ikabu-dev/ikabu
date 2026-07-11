import Discord, { GuildMember, Message, Role } from 'discord.js';

import { getAPIMemberByMessage } from '@/app/common/manager/member_manager';
import { unassignRoleFromMember } from '@/app/common/manager/role_manager';
import { exists, getDeveloperMention, notExists } from '@/app/common/others';
import { RoleKeySet } from '@/app/constant/role_key';
import { MemberService } from '@/db/member_service';
import { RecruitCountService } from '@/db/recruit_count_service';
import { UniqueRoleService } from '@/db/unique_role_service';
import { VoiceCountService } from '@/db/voice_count_service';

import { sendIntentionConfirmReply } from './send_questionnaire';

export async function removeRookie(msg: Message<true>) {
    const guild = msg.guild;
    const authorId = msg.author.id;
    const member = await getAPIMemberByMessage(msg);
    const rookieRoleId = await UniqueRoleService.getRoleIdByKey(guild.id, RoleKeySet.Rookie.key);

    if (notExists(rookieRoleId)) {
        if (guild.id === process.env.SERVER_ID) {
            await msg.channel.send(
                (await getDeveloperMention(guild.id)) + '新入部員ロールが設定されていないでし！',
            );
        }
        return;
    }

    if (await shouldRemoveRookie(member)) {
        const hasRookieRole = member.roles.cache.find((role: Role) => role.id === rookieRoleId);
        if (hasRookieRole) {
            await unassignRoleFromMember(rookieRoleId, member);

            // 新入部員フラグをfalseにする
            await MemberService.setRookieFlag(guild.id, authorId, false);

            const embed = new Discord.EmbedBuilder();
            embed.setDescription(
                '新入部員期間が終わったでし！\nこれからもイカ部心得を守ってイカ部生活をエンジョイするでし！',
            );
            embed.setAuthor({
                name: member.displayName,
                iconURL: member.displayAvatarURL(),
            });
            await msg.channel.send({ embeds: [embed] }).catch();
            if (exists(process.env.QUESTIONNAIRE_ROOKIE_URL)) {
                await sendIntentionConfirmReply(msg, authorId, 'QUESTIONNAIRE_ROOKIE_URL');
            }
        }
    }
}

/*
 * 新入部員ロールを削除すべきかどうかを判定する
 * voice_countテーブルのtotal_secが20時間以上
 * かつ recruit_countテーブルのrecruit_count + join_countが20回以上
 * の場合
 * @param member
 * @return boolean
 */
async function shouldRemoveRookie(member: GuildMember) {
    const recruitCountResult = await RecruitCountService.getCountByUserId(member.id);
    const voiceCountResult = await VoiceCountService.getCountByUserId(member.id);
    if (notExists(recruitCountResult) || notExists(voiceCountResult)) {
        return false;
    }
    const count = recruitCountResult.recruitCount + recruitCountResult.joinCount;
    const totalSec = voiceCountResult.totalSec;
    if (count >= 20 && totalSec >= 60 * 60 * 20) {
        return true;
    } else {
        return false;
    }
}
