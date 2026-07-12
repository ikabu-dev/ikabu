import { prisma } from '@/infra/db/prisma';

export class FriendCodeService {
    static async save(userId: string, code: string, url: string | null) {
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
    }

    static async getFriendCodeObjByUserId(userId: string) {
        const friendCode = await prisma.friendCode.findUnique({
            where: {
                userId: userId,
            },
        });

        return friendCode;
    }
}
