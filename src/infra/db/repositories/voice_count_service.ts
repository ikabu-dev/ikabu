import { prisma } from '@/infra/db/prisma';

export class VoiceCountService {
    static async saveVoiceCount(userId: string, totalSec: number) {
        await prisma.voiceCount.upsert({
            where: {
                userId: userId,
            },
            update: {
                totalSec: totalSec,
            },
            create: {
                userId: userId,
                totalSec: totalSec,
            },
        });
    }

    static async saveStartTime(userId: string, startTime: Date | null) {
        await prisma.voiceCount.upsert({
            where: {
                userId: userId,
            },
            update: {
                startTime: startTime,
            },
            create: {
                userId: userId,
                startTime: startTime,
                totalSec: 0,
            },
        });
    }

    static async getCountByUserId(userId: string) {
        const counter = await prisma.voiceCount.findUnique({
            where: {
                userId: userId,
            },
        });
        return counter;
    }

    static async getInCallCount() {
        const counter = await prisma.voiceCount.findMany({
            where: {
                startTime: {
                    not: null,
                },
            },
        });
        return counter;
    }
}
