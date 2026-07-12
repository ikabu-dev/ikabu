import { Member } from '@prisma/client';
import { GuildMember } from 'discord.js';

import { modalRecruit } from '@/config/constants/images';
import { RoleKeySet } from '@/config/constants/role_key';
import { prisma } from '@/infra/db/prisma';
import { UniqueRoleService } from '@/infra/db/repositories/unique_role_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { exists } from '@/shared/assert';
const logger = log4js_obj.getLogger('database');

export class MemberService {
    /**
     * GuildMemberオブジェクトをMemberテーブルに登録/更新 (項目: displayName, iconUrl, isRookie, (登録時: joinedAt))
     * @param guildId Guild ID
     * @param userId User ID
     * @param displayName ユーザ名
     * @param iconUrl アイコン画像URL
     * @param joinedAt サーバ参加日時(登録時のみ)
     * @param isRookie 新入部員フラグ
     * @returns 登録/更新したMemberオブジェクト
     */
    static async saveMember(
        guildId: string,
        userId: string,
        displayName: string,
        iconUrl: string,
        joinedAt: Date,
        isRookie: boolean,
    ): Promise<Member> {
        return await prisma.member.upsert({
            where: {
                guildId_userId: {
                    guildId: guildId,
                    userId: userId,
                },
            },
            update: {
                displayName: displayName,
                iconUrl: iconUrl,
                isRookie: isRookie,
            },
            create: {
                guildId: guildId,
                userId: userId,
                displayName: displayName,
                mention: `<@${userId}>`,
                iconUrl: iconUrl,
                joinedAt: joinedAt,
                isRookie: isRookie,
            },
        });
    }

    /**
     * GuildMemberオブジェクトをMemberテーブルに登録/更新 (項目: displayName, iconUrl, isRookie, (登録時: joinedAt))
     * @param member GuildMember オブジェクト
     * @param isRookie isRookieをオーバーライドできます。省略すれば、新入部員ロールを持っているか確認します。
     * @returns 登録/更新したMemberオブジェクト
     */
    static async saveMemberFromGuildMember(
        member: GuildMember,
        isRookie?: boolean,
    ): Promise<Member> {
        const iconUrl = member.displayAvatarURL().replace('.webp', '.png').replace('.webm', '.gif');

        let hasRookieRole = false;

        if (exists(isRookie)) {
            // isRookieが指定されている場合はその値を使う
            hasRookieRole = isRookie;
        } else {
            // isRookieが指定されていない場合は新入部員ロールを持っているか確認する
            const rookieRoleId = await UniqueRoleService.getRoleIdByKey(
                member.guild.id,
                RoleKeySet.Rookie.key,
            );

            // rookieRoleが存在するサーバの場合、新入部員ロールを持っているか確認
            if (exists(rookieRoleId)) {
                const memberRoles = member.roles.cache.get(rookieRoleId);
                if (exists(memberRoles)) {
                    hasRookieRole = true;
                }
            }
        }

        return await prisma.member.upsert({
            where: {
                guildId_userId: {
                    guildId: member.guild.id,
                    userId: member.user.id,
                },
            },
            update: {
                displayName: member.displayName,
                iconUrl: iconUrl,
                isRookie: hasRookieRole,
            },
            create: {
                guildId: member.guild.id,
                userId: member.user.id,
                displayName: member.displayName,
                mention: `<@${member.user.id}>`,
                iconUrl: iconUrl,
                joinedAt: member.joinedAt,
                isRookie: hasRookieRole,
            },
        });
    }

    /**
     * 対象メンバーがDBに存在しないのは正常系のため、
     * 0件マッチで throw しない updateMany を使う。
     */
    static async updateJoinedAt(guildId: string, userId: string, joinedAt: Date): Promise<void> {
        await prisma.member.updateMany({
            where: {
                guildId: guildId,
                userId: userId,
            },
            data: {
                joinedAt: joinedAt,
            },
        });
    }

    /**
     * 対象メンバーがDBに存在しないのは正常系のため、
     * 0件マッチで throw しない updateMany を使う。
     */
    static async setRookieFlag(guildId: string, userId: string, isRookie: boolean): Promise<void> {
        await prisma.member.updateMany({
            where: {
                guildId: guildId,
                userId: userId,
            },
            data: {
                isRookie: isRookie,
            },
        });
    }

    static async getMemberByUserId(guildId: string, userId: string): Promise<Member | null> {
        const member = await prisma.member.findUnique({
            where: {
                guildId_userId: {
                    guildId: guildId,
                    userId: userId,
                },
            },
        });

        return member;
    }

    static async getMemberGuildIdsByUserId(userId: string): Promise<string[]> {
        const members = await prisma.member.findMany({
            where: {
                userId: userId,
            },
        });
        const guildIds: string[] = [];
        for (const member of members) {
            guildIds.push(member.guildId);
        }
        return guildIds;
    }

    // ダミーを作らないとModalでエラーが出るため
    static async createDummyUser(guildId: string) {
        // 既存のメンバーを検索します
        const members = await prisma.member.findMany({
            where: {
                guildId: guildId,
                userId: {
                    startsWith: 'attendee',
                },
            },
        });

        // 既存のメンバーが3人未満の場合はダミーユーザーを作成
        if (members.length < 3) {
            const dummyUsers = [
                {
                    guildId: guildId,
                    userId: 'attendee1',
                    displayName: '参加確定者1',
                    mention: '',
                    iconUrl: modalRecruit.placeHold,
                    joinedAt: new Date(),
                },
                {
                    guildId: guildId,
                    userId: 'attendee2',
                    displayName: '参加確定者2',
                    mention: '',
                    iconUrl: modalRecruit.placeHold,
                    joinedAt: new Date(),
                },
                {
                    guildId: guildId,
                    userId: 'attendee3',
                    displayName: '参加確定者3',
                    mention: '',
                    iconUrl: modalRecruit.placeHold,
                    joinedAt: new Date(),
                },
            ];

            // 既存のダミーユーザーのuserIdを抽出
            const existingUserIds = members.map((member) => member.userId);

            // 既に存在するダミーユーザーを除外
            const usersToCreate = dummyUsers.filter(
                (user) => !existingUserIds.includes(user.userId),
            );

            // 新たに作成すべきダミーユーザーを追加
            for (const user of usersToCreate) {
                await prisma.member.create({
                    data: user,
                });
                logger.info(`dummy user created: ${user.userId}`);
            }
        }
    }
}
