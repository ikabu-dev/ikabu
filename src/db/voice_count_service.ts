import { dbCall } from './db_call.js';
import { prisma } from './prisma';
import { log4js_obj } from '../log4js_settings';
const logger = log4js_obj.getLogger('database');

export class VoiceCountService {
    static async saveVoiceCount(userId: string, totalSec: number) {
        return dbCall(logger, undefined, async () => {
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
        });
    }

    static async saveStartTime(userId: string, startTime: Date | null) {
        return dbCall(logger, undefined, async () => {
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
        });
    }

    static async getCountByUserId(userId: string) {
        return dbCall(logger, null, async () => {
            const counter = await prisma.voiceCount.findUnique({
                where: {
                    userId: userId,
                },
            });
            return counter;
        });
    }

    static async getInCallCount() {
        return dbCall(logger, [], async () => {
            const counter = await prisma.voiceCount.findMany({
                where: {
                    startTime: {
                        not: null,
                    },
                },
            });
            return counter;
        });
    }
}
