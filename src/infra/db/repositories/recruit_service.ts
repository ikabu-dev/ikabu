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
        // スケジュール終了時刻を持つ募集のみ設定する。null の場合、定期ジョブは
        // 作成から RECRUIT_FALLBACK_TTL_DAYS 経過をもって締切扱いにする(スキャン対象外にはならない)
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
     * closeAt 側は通常運用の自動締切そのものなので上限を設けずに全件返す。
     * TTL 側(closeAt: null の掃除)だけ 1回に返す件数の上限を設ける。
     * 作成日時が古い(=期限をより過ぎている)行から優先して拾い、溢れた分は次のスキャンで拾う。
     * この上限に達したかどうかは ttlScanCapped で呼び出し側に伝える。
     */
    static async getRecruitsToClose(now: Date) {
        const ttlThreshold = new Date(
            now.getTime() - RECRUIT_FALLBACK_TTL_DAYS * 24 * 60 * 60 * 1000,
        );

        const closeAtRecruits = await prisma.recruit.findMany({
            where: { closeAt: { not: null, lte: now } },
        });

        // 上限ちょうどで割り切れた(=溢れが無い)ケースを誤って capped 扱いしないよう、
        // 上限+1件を取得し、実際に溢れていたかを件数で判定する。
        const ttlRecruitsWithExtra = await prisma.recruit.findMany({
            where: { closeAt: null, createdAt: { lte: ttlThreshold } },
            orderBy: { createdAt: 'asc' },
            take: RECRUIT_CLOSE_SCAN_LIMIT + 1,
        });
        const ttlScanCapped = ttlRecruitsWithExtra.length > RECRUIT_CLOSE_SCAN_LIMIT;
        const ttlRecruits = ttlScanCapped
            ? ttlRecruitsWithExtra.slice(0, RECRUIT_CLOSE_SCAN_LIMIT)
            : ttlRecruitsWithExtra;

        return {
            recruits: [...closeAtRecruits, ...ttlRecruits],
            ttlScanCapped,
        };
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
