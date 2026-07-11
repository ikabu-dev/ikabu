import { TeamDivider } from '@prisma/client';

import { prisma } from '@/infra/db/prisma';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
const logger = log4js_obj.getLogger('database');

export type TeamMember = {
    messageId: string;
    memberId: string;
    memberName: string;
    team: number;
    joinedMatchCount: number;
    win: number;
    forceSpectate: boolean;
    hideWin: boolean;
    winRate: number;
};

export class TeamDividerService {
    /**
     * DBにメンバーを登録・試合回数更新時にも使用
     * @param teamDivider TeamDividerオブジェクト
     */
    static async registerMemberToDB(
        messageId: string,
        memberId: string,
        memberName: string,
        team: number,
        matchNum: number,
        joinedMatchCount: number,
        win: number,
        forceSpectate: boolean,
        hideWin: boolean,
    ) {
        try {
            await prisma.teamDivider.upsert({
                where: {
                    messageId_memberId_matchNum: {
                        messageId: messageId,
                        memberId: memberId,
                        matchNum: matchNum,
                    },
                },
                create: {
                    messageId: messageId,
                    memberId: memberId,
                    memberName: memberName,
                    team: team,
                    matchNum: matchNum,
                    joinedMatchCount: joinedMatchCount,
                    win: win,
                    forceSpectate: forceSpectate,
                    hideWin: hideWin,
                },
                update: {
                    memberName: memberName,
                    team: team,
                    joinedMatchCount: joinedMatchCount,
                    win: win,
                    forceSpectate: forceSpectate,
                    hideWin: hideWin,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
        }
    }

    static async deleteMemberFromDB(messageId: string, memberId: string) {
        try {
            await prisma.teamDivider.deleteMany({
                where: {
                    messageId: messageId,
                    memberId: memberId,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
        }
    }

    /**
     * 0回戦(参加者登録時)の表示を行う
     * @param messageId 登録メッセージID
     * @returns 表示用メッセージ
     */
    static async registeredMembersStrings(messageId: string) {
        try {
            const members = await prisma.teamDivider.findMany({
                where: {
                    messageId: messageId,
                    matchNum: 0,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });

            let usersString = '';
            for (const member of members) {
                usersString = usersString + `\n${member.memberName}`;
            }
            return { text: usersString, memberCount: members.length };
        } catch (error) {
            await sendErrorLogs(logger, error);
            return { text: '', memberCount: 0 };
        }
    }

    /**
     * 特定の試合数で特定メンバーを取得
     * @param messageId 登録メッセージID
     * @param matchNum 該当試合数
     * @param memberId 該当メンバーID
     * @returns 取得結果
     */
    static async selectMemberFromDB(messageId: string, matchNum: number, memberId: string) {
        try {
            const member = await prisma.teamDivider.findUnique({
                where: {
                    messageId_memberId_matchNum: {
                        messageId: messageId,
                        memberId: memberId,
                        matchNum: matchNum,
                    },
                },
            });
            return member;
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }

    /**
     * 特定の試合数で全メンバーを取得
     * @param messageId 登録メッセージID
     * @param matchNum 該当試合数
     * @returns 取得結果
     */
    static async selectAllMemberFromDB(messageId: string, matchNum: number) {
        try {
            const members = await prisma.teamDivider.findMany({
                where: {
                    messageId: messageId,
                    matchNum: matchNum,
                },
            });
            return members;
        } catch (error) {
            await sendErrorLogs(logger, error);
            return [];
        }
    }

    /**
     * テーブルから該当のチーム分け情報を削除
     * @param messageId 登録メッセージID
     */
    static async deleteAllMemberFromDB(messageId: string) {
        try {
            await prisma.teamDivider.deleteMany({
                where: {
                    messageId: messageId,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
        }
    }

    /**
     * 特定の試合数のチームを登録
     * @param messageId 登録メッセージID
     * @param memberId 該当メンバーID
     * @param matchNum 該当試合数
     * @param team 該当チーム(alfa=0, bravo=1, 観戦=2)
     */
    static async setTeam(messageId: string, memberId: string, matchNum: number, team: number) {
        try {
            await prisma.teamDivider.updateMany({
                where: {
                    messageId: messageId,
                    memberId: memberId,
                    matchNum: matchNum,
                },
                data: {
                    team: team,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
        }
    }

    /**
     * 特定の試合数の試合参加回数を登録
     * @param messageId 登録メッセージID
     * @param memberId 該当メンバーID
     * @param matchNum 該当試合数
     * @param count 試合参加回数
     */
    static async setCount(messageId: string, memberId: string, matchNum: number, count: number) {
        try {
            await prisma.teamDivider.updateMany({
                where: {
                    messageId: messageId,
                    memberId: memberId,
                    matchNum: matchNum,
                },
                data: {
                    joinedMatchCount: count,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
        }
    }

    /**
     * 特定の試合数の勝利数を登録
     * @param messageId 登録メッセージID
     * @param memberId 該当メンバーID
     * @param matchNum 該当試合数
     * @param winCount 勝利数
     */
    static async setWin(messageId: string, memberId: string, matchNum: number, winCount: number) {
        try {
            await prisma.teamDivider.updateMany({
                where: {
                    messageId: messageId,
                    memberId: memberId,
                    matchNum: matchNum,
                },
                data: {
                    win: winCount,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
        }
    }

    /**
     * 戦績表示の設定
     * @param messageId 登録メッセージID
     * @param flag true=隠す or false=表示
     */
    static async setHideWin(messageId: string, flag: boolean) {
        try {
            await prisma.teamDivider.updateMany({
                where: {
                    messageId: messageId,
                },
                data: {
                    hideWin: flag,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
        }
    }

    /**
     * 特定の試合数の観戦希望者を登録
     * @param messageId 登録メッセージID
     * @param memberId 該当メンバーID
     * @param matchNum 該当試合数
     * @param flag true or false
     */
    static async setForceSpectate(
        messageId: string,
        memberId: string,
        matchNum: number,
        flag: boolean,
    ) {
        try {
            await prisma.teamDivider.updateMany({
                where: {
                    messageId: messageId,
                    memberId: memberId,
                    matchNum: matchNum,
                },
                data: {
                    forceSpectate: flag,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
        }
    }

    /**
     * 特定の試合数のチームメンバーを取得
     * @param messageId 登録メッセージID
     * @param matchNum 該当試合数
     * @param teamNum 該当チーム(alfa=0, bravo=1, 観戦=2)
     * @returns 取得結果
     */
    static async getTeamMembers(
        messageId: string,
        matchNum: number,
        team: number,
    ): Promise<TeamMember[]> {
        let members: TeamDivider[] = [];
        try {
            members = await prisma.teamDivider.findMany({
                where: {
                    messageId: messageId,
                    matchNum: matchNum,
                    team: team,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
        }

        const result = members.map((member) => {
            let winRate = 0;
            if (member.joinedMatchCount === 0) {
                winRate = 0;
            } else {
                winRate = member.win / member.joinedMatchCount;
            }
            return {
                messageId: member.messageId,
                memberId: member.memberId,
                memberName: member.memberName,
                team: member.team,
                joinedMatchCount: member.joinedMatchCount,
                win: member.win,
                forceSpectate: member.forceSpectate,
                hideWin: member.hideWin,
                winRate: winRate,
            };
        });

        return result;
    }

    /**
     * 特定の試合数の観戦希望者を取得
     * @param messageId 登録メッセージID
     * @param matchNum 該当試合数
     * @returns 取得結果
     */
    static async getForceSpectate(messageId: string, matchNum: number): Promise<TeamMember[]> {
        let members: TeamDivider[] = [];
        try {
            members = await prisma.teamDivider.findMany({
                where: {
                    messageId: messageId,
                    matchNum: matchNum,
                    forceSpectate: true,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
        }

        const result = members.map((member) => {
            let winRate = 0;
            if (member.joinedMatchCount === 0) {
                winRate = 0;
            } else {
                winRate = member.win / member.joinedMatchCount;
            }
            return {
                messageId: member.messageId,
                memberId: member.memberId,
                memberName: member.memberName,
                team: member.team,
                joinedMatchCount: member.joinedMatchCount,
                win: member.win,
                forceSpectate: member.forceSpectate,
                hideWin: member.hideWin,
                winRate: winRate,
            };
        });

        return result;
    }

    /**
     * 特定の試合数の勝率順に並べた試合参加者を取得
     * @param messageId 登録メッセージID
     * @param matchNum 該当試合数
     * @param teamNum 1チームのメンバー数
     * @returns 取得結果
     */
    static async getParticipants(
        messageId: string,
        matchNum: number,
        teamNum: number,
    ): Promise<TeamMember[]> {
        let members: TeamDivider[] = [];
        try {
            members = await prisma.teamDivider.findMany({
                where: {
                    messageId: messageId,
                    matchNum: matchNum,
                    forceSpectate: false,
                },
                orderBy: {
                    joinedMatchCount: 'asc',
                },
                take: teamNum * 2,
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
        }

        const result = members.map((member) => {
            let winRate = 0;
            if (member.joinedMatchCount === 0) {
                winRate = 0;
            } else {
                winRate = member.win / member.joinedMatchCount;
            }
            return {
                messageId: member.messageId,
                memberId: member.memberId,
                memberName: member.memberName,
                team: member.team,
                joinedMatchCount: member.joinedMatchCount,
                win: member.win,
                forceSpectate: member.forceSpectate,
                hideWin: member.hideWin,
                winRate: winRate,
            };
        });

        return result;
    }

    /**
     * 特定の試合数のデータを削除する
     * @param messageId 登録メッセージID
     * @param matchNum 該当試合数
     */
    static async deleteMatchingResult(messageId: string, matchNum: number) {
        try {
            await prisma.teamDivider.deleteMany({
                where: {
                    messageId: messageId,
                    matchNum: matchNum,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
        }
    }
}
