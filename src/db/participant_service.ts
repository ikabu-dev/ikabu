import { Member } from '@prisma/client';

import { dbCall } from './db_call.js';
import { prisma } from './prisma.js';
import { RecruitService } from './recruit_service.js';
import { log4js_obj } from '../log4js_settings.js';
const logger = log4js_obj.getLogger('database');

export type ParticipantMember = {
    member: Member;
    userId: string;
    joinedAt: Date;
    userType: number;
};
export class ParticipantService {
    static async registerParticipant(
        guildId: string,
        messageId: string,
        userId: string,
        userType: number,
        joinedAt: Date,
    ) {
        return dbCall(logger, undefined, async () => {
            await prisma.participant.upsert({
                where: {
                    guildId_messageId_userId: {
                        guildId: guildId,
                        messageId: messageId,
                        userId: userId,
                    },
                },
                update: {
                    userType: userType,
                    joinedAt: joinedAt,
                },
                create: {
                    guildId: guildId,
                    messageId: messageId,
                    userId: userId,
                    userType: userType,
                    joinedAt: joinedAt,
                },
            });
        });
    }

    static async registerParticipantFromMember(
        guildId: string,
        messageId: string,
        member: Member,
        userType: number,
    ) {
        return dbCall(logger, undefined, async () => {
            await prisma.participant.upsert({
                where: {
                    guildId_messageId_userId: {
                        guildId: guildId,
                        messageId: messageId,
                        userId: member.userId,
                    },
                },
                update: {
                    userType: userType,
                },
                create: {
                    guildId: guildId,
                    messageId: messageId,
                    userId: member.userId,
                    userType: userType,
                },
            });
        });
    }

    static async deleteParticipant(guildId: string, messageId: string, userId: string) {
        return dbCall(logger, undefined, async () => {
            await prisma.participant.delete({
                where: {
                    guildId_messageId_userId: {
                        guildId: guildId,
                        messageId: messageId,
                        userId: userId,
                    },
                },
            });
        });
    }

    static async deleteAllParticipant(guildId: string, messageId: string) {
        return dbCall(logger, undefined, async () => {
            await prisma.participant.deleteMany({
                where: {
                    guildId: guildId,
                    messageId: messageId,
                },
            });
        });
    }

    static async deleteUnuseParticipant() {
        return dbCall(logger, undefined, async () => {
            const messageIdList = await RecruitService.getAllMessageId();

            await prisma.participant.deleteMany({
                where: {
                    messageId: {
                        notIn: messageIdList,
                    },
                },
            });
        });
    }

    static async getParticipant(
        guildId: string,
        messageId: string,
        userId: string,
    ): Promise<ParticipantMember | null> {
        return dbCall(logger, null, async () => {
            const participant = await prisma.participant.findUnique({
                where: {
                    guildId_messageId_userId: {
                        guildId: guildId,
                        messageId: messageId,
                        userId: userId,
                    },
                },
                select: {
                    userId: true,
                    userType: true,
                    joinedAt: true,
                    member: true,
                },
            });
            return participant;
        });
    }

    static async getAllParticipants(
        guildId: string,
        messageId: string,
    ): Promise<ParticipantMember[]> {
        return dbCall(logger, [], async () => {
            const participants = await prisma.participant.findMany({
                where: {
                    guildId: guildId,
                    messageId: messageId,
                },
                select: {
                    userId: true,
                    userType: true,
                    joinedAt: true,
                    member: true,
                },
                orderBy: [
                    {
                        userType: 'asc',
                    },
                    {
                        joinedAt: 'asc',
                    },
                ],
            });

            return participants;
        });
    }
}
