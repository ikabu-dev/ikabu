import { Member } from '@prisma/client';
import axios from 'axios';
import { Guild, GuildMember, Interaction, Message } from 'discord.js';

import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { MemberService } from '@/db/member_service';
import { log4js_obj } from '@/log4js_settings';
import { assertExistCheck, exists, notExists } from '@/shared/assert';

import { getGuildByInteraction } from './guild_manager';

const logger = log4js_obj.getLogger('MemberManager');

export async function getAPIMemberByInteraction(interaction: Interaction<'cached' | 'raw'>) {
    const guild = await getGuildByInteraction(interaction);
    const memberId = interaction.user.id;
    let member = interaction.member;
    if (notExists(member) || !(member instanceof GuildMember)) {
        member = await guild.members.fetch(memberId);
    }
    return member;
}

/**
 * ユーザーIDからメンバーを検索する．ない場合はnullを返す．
 * @param guild Guildオブジェクト
 * @param roleId ユーザーID
 * @returns メンバーオブジェクト
 */
export async function searchAPIMemberById(guild: Guild, userId: string) {
    let member;
    try {
        // fetch(mid)とすれば、cache見てなければフェッチしてくる
        member = await guild.members.fetch(userId);
    } catch (error) {
        member = null;
        logger.warn('member missing (Discord API)');
    }

    return member;
}

export async function getAPIMemberByMessage(message: Message<true>) {
    const guild = message.guild;
    const memberId = message.author.id;
    let member = message.member;
    if (notExists(member)) {
        member = await guild.members.fetch(memberId);
    }
    return member;
}

/**
 * DBからMember型のオブジェクトを探してくる、なければAPIから拾ってきて登録し、Member型で返す
 * @param guild Guildオブジェクト
 * @param userId ユーザーID
 * @returns Member型オブジェクト
 */
export async function searchDBMemberById(guild: Guild, userId: string): Promise<Member | null> {
    const member = await MemberService.getMemberByUserId(guild.id, userId);

    // membersテーブルにレコードがあるか確認
    if (notExists(member)) {
        const guildMember = await searchAPIMemberById(guild, userId);

        if (notExists(guildMember)) {
            logger.warn(
                `member missing (ikabu DB) => member missing (Discord API)\n [guildId: ${guild.id}, userId: ${userId}]`,
            );
            return null;
        }

        assertExistCheck(guildMember.joinedAt, 'joinedAt');

        const newMember = await MemberService.saveMemberFromGuildMember(guildMember);

        if (exists(newMember)) {
            logger.warn(
                `member missing (ikabu DB) => member was registered successfully.\n [guildId: ${guild.id}, userId: ${userId}]`,
            );
        } else {
            await sendErrorLogs(
                logger,
                `member missing (ikabu DB) => Failed to register.\n [guildId: ${guild.id}, userId: ${userId}]`,
            );
            return null;
        }

        return newMember;
    } else if (!(await isUrlValid(member.iconUrl))) {
        // 画像URLが無効な場合
        const guildMember = await searchAPIMemberById(guild, userId);

        if (notExists(guildMember)) {
            logger.warn(
                `member Icon invalid => member missing (Discord API)\n [guildId: ${guild.id}, userId: ${userId}]`,
            );
            return null;
        }

        const newMember = await MemberService.saveMemberFromGuildMember(guildMember);

        if (exists(newMember)) {
            logger.warn(
                `member Icon invalid => Icon URL was updated successfully.\n [guildId: ${guild.id}, userId: ${userId}]`,
            );
        } else {
            await sendErrorLogs(
                logger,
                `member Icon invalid => Failed to update Icon URL.\n [guildId: ${guild.id}, userId: ${userId}]`,
            );
            return null;
        }

        return newMember;
    } else {
        return member;
    }
}

/**
 * メンバーのカラー(名前の色)を返す
 * @param member 対象メンバー
 * @returns HEX COLOR CODE
 */
export function getMemberColor(member: GuildMember) {
    /* member.displayColorでもとれるけど、@everyoneが#000000(BLACK)になるので
       ロール有無チェックしてなければ#FFFFFF(WHITE)を返す */
    try {
        const role = member.roles.color;
        if (notExists(role)) {
            return '#FFFFFF';
        } else {
            return role.hexColor;
        }
    } catch (error) {
        void sendErrorLogs(logger, error);
        return '#FFFFFF';
    }
}

async function isUrlValid(url: string) {
    try {
        const response = await axios.head(url);
        return response.status === 200;
    } catch (error) {
        return false;
    }
}
