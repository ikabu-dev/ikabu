import { ObjectValueList } from '@/config/constants/constant_common';
import { RECRUIT_CLOSE_SCAN_LIMIT, RECRUIT_FALLBACK_TTL_DAYS } from '@/config/constants/recruit';
import { prisma } from '@/infra/db/prisma';

export const RecruitType = {
    None: 0,
    PrivateRecruit: 1,
    RegularRecruit: 2,
    AnarchyRecruit: 3,
    EventRecruit: 4,
    SalmonRecruit: 5,
    FestivalRecruit: 6,
    BigRunRecruit: 7,
    TeamContestRecruit: 8,
    OtherGameRecruit: 10,
    RaidersRecruit: 11,
} as const;
export type RecruitType = ObjectValueList<typeof RecruitType>;
export function isRecruitType(value: number): value is RecruitType {
    return Object.values(RecruitType).some((v) => v === value);
}

export class RecruitService {
    static async registerRecruit(
        guildId: string,
        channelId: string,
        messageId: string,
        authorId: string,
        recruitNum: number,
        condition: string,
        vcName: string | null,
        eventId: string | null,
        recruitType: number,
        option?: string | null,
        // 自動締切を行う募集のみ。null なら定期ジョブのスキャン対象にならない
        closeAt?: Date | null,
        buttonMessageId?: string | null,
    ) {
        await prisma.recruit.create({
            data: {
                guildId: guildId,
                channelId: channelId,
                messageId: messageId,
                authorId: authorId,
                recruitNum: recruitNum,
                condition: condition,
                vcName: vcName,
                eventId: eventId,
                recruitType: recruitType,
                option: option,
                closeAt: closeAt,
                buttonMessageId: buttonMessageId,
            },
        });
    }

    /**
     * 締切の期限を過ぎた募集を返す。
     *
     * 期限は closeAt。closeAt を持たない募集(バイト・レイダース・プラベ・別ゲー)は
     * スケジュール終了時刻が無いため、作成から RECRUIT_FALLBACK_TTL_DAYS 経過を期限とみなす。
     * つまり期限は closeAt ?? createdAt + TTL。
     *
     * 1回に返す件数には上限を設ける。溢れた分は次のスキャンで拾う。
     */
    static async getRecruitsToClose(now: Date) {
        const ttlThreshold = new Date(
            now.getTime() - RECRUIT_FALLBACK_TTL_DAYS * 24 * 60 * 60 * 1000,
        );

        return await prisma.recruit.findMany({
            where: {
                OR: [
                    { closeAt: { not: null, lte: now } },
                    { closeAt: null, createdAt: { lte: ttlThreshold } },
                ],
            },
            orderBy: { createdAt: 'asc' },
            take: RECRUIT_CLOSE_SCAN_LIMIT,
        });
    }

    /**
     * 募集を削除する。
     *
     * 〆ボタン・自動締切ジョブ・キャンセル・sticky の掃除が競合して
     * 二重削除になるのは正常系のため、0件マッチで throw しない deleteMany を使う。
     */
    static async deleteRecruit(guildId: string, messageId: string) {
        await prisma.recruit.deleteMany({
            where: {
                guildId: guildId,
                messageId: messageId,
            },
        });
    }

    static async updateRecruitNum(guildId: string, messageId: string, recruitNum: number) {
        await prisma.recruit.updateMany({
            where: {
                guildId: guildId,
                messageId: messageId,
            },
            data: {
                recruitNum: recruitNum,
            },
        });
    }

    static async updateCondition(guildId: string, messageId: string, condition: string) {
        await prisma.recruit.updateMany({
            where: {
                guildId: guildId,
                messageId: messageId,
            },
            data: {
                condition: condition,
            },
        });
    }

    /**
     * 募集にボタンメッセージIDを紐付ける。
     *
     * プラベ・別ゲーはボタンを募集登録の後に送るため、登録時点では ID が無い。
     * 自動〆はこの ID からボタンメッセージを引いて無効化する。
     */
    static async updateButtonMessageId(
        guildId: string,
        messageId: string,
        buttonMessageId: string,
    ) {
        await prisma.recruit.updateMany({
            where: {
                guildId: guildId,
                messageId: messageId,
            },
            data: {
                buttonMessageId: buttonMessageId,
            },
        });
    }

    static async getRecruit(guildId: string, messageId: string) {
        const recruit = await prisma.recruit.findUnique({
            where: {
                guildId_messageId: {
                    guildId: guildId,
                    messageId: messageId,
                },
            },
        });
        return recruit;
    }

    static async getRecruitByEventId(guildId: string, eventId: string) {
        const recruit = await prisma.recruit.findFirst({
            where: {
                guildId: guildId,
                eventId: eventId,
            },
        });
        return recruit;
    }

    static async getRecruitsByRecruitType(guildId: string, recruitType: number) {
        const recruits = await prisma.recruit.findMany({
            where: {
                guildId: guildId,
                recruitType: recruitType,
            },
        });
        return recruits;
    }

    static async getRecruitsByChannelId(guildId: string, channelId: string) {
        const recruits = await prisma.recruit.findMany({
            where: {
                guildId: guildId,
                channelId: channelId,
            },
        });
        return recruits;
    }

    static async getAllMessageId() {
        const recruits = await prisma.recruit.findMany({
            select: {
                messageId: true,
            },
            distinct: ['messageId'],
        });

        const result = recruits.map((recruit) => {
            return recruit.messageId;
        });

        return result;
    }
}
