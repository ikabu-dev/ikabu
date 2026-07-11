import { GuildMember, Role } from 'discord.js';

import { ChannelKeySet } from '@/config/constants/channel_key';
import { RoleKeySet } from '@/config/constants/role_key';
import { env } from '@/config/env';
import { MemberService } from '@/infra/db/repositories/member_service';
import { UniqueChannelService } from '@/infra/db/repositories/unique_channel_service';
import { UniqueRoleService } from '@/infra/db/repositories/unique_role_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { exists, notExists } from '@/shared/assert';
import { searchChannelById } from '@/shared/discord_helpers/channel_manager';
import { getDeveloperMention } from '@/shared/discord_helpers/developer_mention';
import { searchAPIMemberById } from '@/shared/discord_helpers/member_manager';
import { assignRoleToMember, searchRoleById } from '@/shared/discord_helpers/role_manager';
import { sleep } from '@/shared/sleep';

const logger = log4js_obj.getLogger('guildMemberAdd');

export async function guildMemberAddEvent(newMember: GuildMember) {
    try {
        const guild = await newMember.guild.fetch();
        const userId = newMember.user.id;

        const lobbyChannelId = await UniqueChannelService.getChannelIdByKey(
            guild.id,
            ChannelKeySet.Lobby.key,
        );
        let lobbyChannel = null;
        let welcomeMessage = null;
        if (exists(lobbyChannelId)) {
            lobbyChannel = await searchChannelById(guild, lobbyChannelId);
        }
        // ロビーチャンネルが設定されているサーバーでは、ロビーチャンネルにメッセージを送信する
        if (exists(lobbyChannel) && lobbyChannel.isTextBased()) {
            const ruleChannelId = await UniqueChannelService.getChannelIdByKey(
                guild.id,
                ChannelKeySet.Rule.key,
            );
            const descriptionChannelId = await UniqueChannelService.getChannelIdByKey(
                guild.id,
                ChannelKeySet.Description.key,
            );
            const introductionChannelId = await UniqueChannelService.getChannelIdByKey(
                guild.id,
                ChannelKeySet.Introduction.key,
            );

            welcomeMessage = await lobbyChannel.send(
                `<@!${userId}> たん、よろしくお願いします！\n` +
                    `最初の10分間は閲覧しかできません、その間に <#${ruleChannelId}> と <#${descriptionChannelId}> をよく読んでくださいね\n` +
                    `10分経ったら、書き込めるようになります。 <#${introductionChannelId}> で自己紹介も兼ねて自分のフレコを貼ってください\n\n` +
                    `${guild.name}のみんなが歓迎していますよ〜`,
            );
        }

        const rookieRoleId = await UniqueRoleService.getRoleIdByKey(
            guild.id,
            RoleKeySet.Rookie.key,
        );

        if (notExists(rookieRoleId)) {
            if (guild.id === env.serverId) {
                if (exists(lobbyChannel) && lobbyChannel.isTextBased()) {
                    await lobbyChannel.send(
                        (await getDeveloperMention(guild.id)) +
                            '新入部員ロールが設定されていないでし！',
                    );
                } else {
                    await sendErrorLogs(logger, RoleKeySet.Rookie.key + 'was not found.');
                }
            }
            return;
        }

        const beginnerRole = await searchRoleById(guild, rookieRoleId);

        // 新入部員ロールが設定されているサーバーでは、新入部員ロールを付与する
        if (exists(beginnerRole)) {
            // membersテーブルにレコードがあるか確認
            const storedMember = await MemberService.getMemberByUserId(guild.id, userId);
            const guildMember = await searchAPIMemberById(guild, userId);
            if (notExists(guildMember)) {
                await sendErrorLogs(logger, 'member missing (Discord API)');
                return;
            }

            if (exists(storedMember)) {
                // 退部していた部員のプロフィール更新()
                await MemberService.saveMemberFromGuildMember(guildMember, storedMember.isRookie);

                if (storedMember.isRookie) {
                    await setRookieRole(guild.id, userId, beginnerRole);
                }

                // 出戻り勢の場合はリアクションを変える
                if (exists(welcomeMessage)) {
                    await welcomeMessage.react('👌');
                }
            } else {
                // 新入部員の情報を登録
                await MemberService.saveMemberFromGuildMember(guildMember, true);

                await sleep(60 * 10);
                await setRookieRole(guild.id, userId, beginnerRole);

                if (exists(welcomeMessage)) {
                    await welcomeMessage.react('👍');
                }
            }
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}

async function setRookieRole(guildId: string, userId: string, beginnerRole: Role) {
    const member = await searchAPIMemberById(beginnerRole.guild, userId);
    if (exists(member)) {
        await assignRoleToMember(beginnerRole, member);
        await MemberService.setRookieFlag(guildId, userId, true);
    }
}
