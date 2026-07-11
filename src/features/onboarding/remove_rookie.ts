import Discord, { GuildMember, Message, Role } from 'discord.js';

import { RoleKeySet } from '@/config/constants/role_key';
import { env } from '@/config/env';
import { sendIntentionConfirmReply } from '@/features/onboarding/send_questionnaire';
import { MemberService } from '@/infra/db/repositories/member_service';
import { RecruitCountService } from '@/infra/db/repositories/recruit_count_service';
import { UniqueRoleService } from '@/infra/db/repositories/unique_role_service';
import { VoiceCountService } from '@/infra/db/repositories/voice_count_service';
import { exists, notExists } from '@/shared/assert';
import { getDeveloperMention } from '@/shared/discord_helpers/developer_mention';
import { getAPIMemberByMessage } from '@/shared/discord_helpers/member_manager';
import { unassignRoleFromMember } from '@/shared/discord_helpers/role_manager';

export async function removeRookie(msg: Message<true>) {
    const guild = msg.guild;
    const authorId = msg.author.id;
    const member = await getAPIMemberByMessage(msg);
    const rookieRoleId = await UniqueRoleService.getRoleIdByKey(guild.id, RoleKeySet.Rookie.key);

    if (notExists(rookieRoleId)) {
        if (guild.id === env.serverId) {
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
            if (exists(env.questionnaireRookieUrl)) {
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
