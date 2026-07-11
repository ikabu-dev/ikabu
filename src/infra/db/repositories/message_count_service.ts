import { prisma } from '@/infra/db/prisma';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
const logger = log4js_obj.getLogger('database');

export class MessageCountService {
    static async save(userId: string, count: number) {
        try {
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
        } catch (error) {
            await sendErrorLogs(logger, error);
        }
    }

    static async getMemberByUserId(userId: string) {
        try {
            const member = await prisma.messageCount.findUnique({
                where: {
                    userId: userId,
                },
            });
            return member;
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }
}
