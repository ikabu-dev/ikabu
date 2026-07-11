import { prisma } from '@/infra/db/prisma';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';

const logger = log4js_obj.getLogger('database');

export class FriendCodeService {
    static async save(userId: string, code: string, url: string | null) {
        try {
            await prisma.friendCode.upsert({
                where: {
                    userId: userId,
                },
                update: {
                    code: code,
                    url: url,
                },
                create: {
                    userId: userId,
                    code: code,
                    url: url,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
        }
    }

    static async getFriendCodeObjByUserId(userId: string) {
        try {
            const friendCode = await prisma.friendCode.findUnique({
                where: {
                    userId: userId,
                },
            });

            return friendCode;
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }
}
