import { dbCall } from './db_call.js';
import { prisma } from './prisma.js';
import { ObjectValueList } from '../app/constant/constant_common.js';
import { log4js_obj } from '../log4js_settings';
const logger = log4js_obj.getLogger('database');

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
    ) {
        return dbCall(logger, undefined, async () => {
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
                },
            });
        });
    }

    static async deleteRecruit(guildId: string, messageId: string) {
        return dbCall(logger, undefined, async () => {
            await prisma.recruit.delete({
                where: {
                    guildId_messageId: {
                        guildId: guildId,
                        messageId: messageId,
                    },
                },
            });
        });
    }

    static async updateRecruitNum(guildId: string, messageId: string, recruitNum: number) {
        return dbCall(logger, undefined, async () => {
            await prisma.recruit.update({
                where: {
                    guildId_messageId: {
                        guildId: guildId,
                        messageId: messageId,
                    },
                },
                data: {
                    recruitNum: recruitNum,
                },
            });
        });
    }

    static async updateCondition(guildId: string, messageId: string, condition: string) {
        return dbCall(logger, undefined, async () => {
            await prisma.recruit.update({
                where: {
                    guildId_messageId: {
                        guildId: guildId,
                        messageId: messageId,
                    },
                },
                data: {
                    condition: condition,
                },
            });
        });
    }

    static async getRecruit(guildId: string, messageId: string) {
        return dbCall(logger, null, async () => {
            const recruit = await prisma.recruit.findUnique({
                where: {
                    guildId_messageId: {
                        guildId: guildId,
                        messageId: messageId,
                    },
                },
            });
            return recruit;
        });
    }

    static async getRecruitByEventId(guildId: string, eventId: string) {
        return dbCall(logger, null, async () => {
            const recruit = await prisma.recruit.findFirst({
                where: {
                    guildId: guildId,
                    eventId: eventId,
                },
            });
            return recruit;
        });
    }

    static async getRecruitsByRecruitType(guildId: string, recruitType: number) {
        return dbCall(logger, [], async () => {
            const recruits = await prisma.recruit.findMany({
                where: {
                    guildId: guildId,
                    recruitType: recruitType,
                },
            });
            return recruits;
        });
    }

    static async getRecruitsByChannelId(guildId: string, channelId: string) {
        return dbCall(logger, [], async () => {
            const recruits = await prisma.recruit.findMany({
                where: {
                    guildId: guildId,
                    channelId: channelId,
                },
            });
            return recruits;
        });
    }

    static async getAllMessageId() {
        return dbCall(logger, [], async () => {
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
        });
    }
}
