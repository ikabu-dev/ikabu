import { dbCall } from './db_call.js';
import { prisma } from './prisma';
import { log4js_obj } from '../log4js_settings';
const logger = log4js_obj.getLogger('database');

export class MessageCountService {
    static async save(userId: string, count: number) {
        return dbCall(logger, undefined, async () => {
            await prisma.messageCount.upsert({
                where: {
                    userId: userId,
                },
                update: {
                    count: count,
                },
                create: {
                    userId: userId,
                    count: count,
                },
            });
        });
    }

    static async getMemberByUserId(userId: string) {
        return dbCall(logger, null, async () => {
            const member = await prisma.messageCount.findUnique({
                where: {
                    userId: userId,
                },
            });
            return member;
        });
    }
}
