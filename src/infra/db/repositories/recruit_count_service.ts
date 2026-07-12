import { prisma } from '@/infra/db/prisma';

export class RecruitCountService {
    static async saveRecruitCount(userId: string, count: number) {
        await prisma.recruitCount.upsert({
            where: {
                userId: userId,
            },
            update: {
                recruitCount: count,
            },
            create: {
                userId: userId,
                recruitCount: count,
                joinCount: 0,
            },
        });
    }

    static async saveJoinCount(userId: string, count: number) {
        await prisma.recruitCount.upsert({
            where: {
                userId: userId,
            },
            update: {
                joinCount: count,
            },
            create: {
                userId: userId,
                recruitCount: 0,
                joinCount: count,
            },
        });
    }

    static async getCountByUserId(userId: string) {
        const counter = await prisma.recruitCount.findUnique({
            where: {
                userId: userId,
            },
        });
        return counter;
    }
}
