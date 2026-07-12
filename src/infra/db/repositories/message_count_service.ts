import { prisma } from '@/infra/db/prisma';

export class MessageCountService {
    static async save(userId: string, count: number) {
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
    }

    static async getMemberByUserId(userId: string) {
        const member = await prisma.messageCount.findUnique({
            where: {
                userId: userId,
            },
        });
        return member;
    }
}
