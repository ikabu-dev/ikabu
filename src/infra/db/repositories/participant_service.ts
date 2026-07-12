import { Member } from '@prisma/client';

import { prisma } from '@/infra/db/prisma';
import { RecruitService } from '@/infra/db/repositories/recruit_service';

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
    }

    static async registerParticipantFromMember(
        guildId: string,
        messageId: string,
        member: Member,
        userType: number,
    ) {
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
    }

    /**
     * 参加者を削除する。
     *
     * キャンセルボタンの二重クリックなどで対象行が既に無いのは正常系のため、
     * 0件マッチで throw しない deleteMany を使う。
     */
    static async deleteParticipant(guildId: string, messageId: string, userId: string) {
        await prisma.participant.deleteMany({
            where: {
                guildId: guildId,
                messageId: messageId,
                userId: userId,
            },
        });
    }

    static async deleteAllParticipant(guildId: string, messageId: string) {
        await prisma.participant.deleteMany({
            where: {
                guildId: guildId,
                messageId: messageId,
            },
        });
    }

    static async deleteUnuseParticipant() {
        // getAllMessageId() が DB エラー時に throw することで、ここに到達しない。
        // 空配列は「募集が1件も存在しない」という正当な状態のみを意味する
        // （notIn: [] は全行にマッチするため、DBエラーを握り潰してはならない）。
        const messageIdList = await RecruitService.getAllMessageId();

        await prisma.participant.deleteMany({
            where: {
                messageId: {
                    notIn: messageIdList,
                },
            },
        });
    }

    static async getParticipant(
        guildId: string,
        messageId: string,
        userId: string,
    ): Promise<ParticipantMember | null> {
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
    }

    static async getAllParticipants(
        guildId: string,
        messageId: string,
    ): Promise<ParticipantMember[]> {
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
    }
}
