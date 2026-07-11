import { dbCall } from './db_call.js';
import { prisma } from './prisma';
import { log4js_obj } from '../log4js_settings';

const logger = log4js_obj.getLogger('database');

export class FriendCodeService {
    static async save(userId: string, code: string, url: string | null) {
        return dbCall(logger, undefined, async () => {
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
        });
    }

    static async getFriendCodeObjByUserId(userId: string) {
        return dbCall(logger, null, async () => {
            const friendCode = await prisma.friendCode.findUnique({
                where: {
                    userId: userId,
                },
            });

            return friendCode;
        });
    }
}
