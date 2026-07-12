import { Guild, GuildMember, PartialGuildMember } from 'discord.js';

import { ChannelKeySet } from '@/config/constants/channel_key';
import { MemberService } from '@/infra/db/repositories/member_service';
import { UniqueChannelService } from '@/infra/db/repositories/unique_channel_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { exists, notExists } from '@/shared/assert';
import { searchChannelById } from '@/shared/discord_helpers/channel_manager';

const logger = log4js_obj.getLogger();

/**
 * 退部したメンバーの情報を退部ログチャンネルに送る。
 * joinedAt が Discord から取得できない場合は DB の記録で補う。
 *
 * 退部ログチャンネルが未設定でも、部員数の更新など後続の処理は行われるべきなので、
 * ここでは警告を出して戻るだけにする。
 */
export async function sendRetireLog(
    member: GuildMember | PartialGuildMember,
    guild: Guild,
): Promise<void> {
    const displayName = member.displayName;
    const username = member.user.username;
    let joinedAt = member.joinedAt;
    // joinedAtがnullだったらDBからとってくる
    if (notExists(joinedAt)) {
        const storedMember = await MemberService.getMemberByUserId(member.guild.id, member.user.id);
        if (exists(storedMember)) {
            joinedAt = storedMember.joinedAt;
        }
    }

    let text = `${displayName}たん \`[${username}]\`が退部したでし！\n`;

    if (exists(joinedAt)) {
        const unixJoinedAt = Math.floor(joinedAt.getTime() / 1000);
        const period = Math.round((Date.now() - Number(joinedAt)) / 86400000); // サーバーに居た期間を日数にして計算
        text += `入部日: <t:${unixJoinedAt}:f>【<t:${unixJoinedAt}:R>】\n入部期間: \`${period}日間\``;
    } else {
        text += '入部日を取得できなかったでし！';
    }

    const logChannelId = await UniqueChannelService.getChannelIdByKey(
        guild.id,
        ChannelKeySet.RetireLog.key,
    );
    if (notExists(logChannelId)) {
        logger.warn(`${ChannelKeySet.RetireLog.key} is not set. [${guild.name}]`);
        return;
    }
    const retireLog = await searchChannelById(guild, logChannelId);
    if (retireLog?.isTextBased()) {
        await retireLog.send(text);
    }
}
