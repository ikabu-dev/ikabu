import { prisma } from '@/infra/db/prisma';

export class StickyService {
    static async registerMessageId(
        guildId: string,
        channelId: string,
        key: string,
        messageId: string,
    ) {
        await prisma.sticky.upsert({
            where: {
                guildId_channelId_key: {
                    guildId: guildId,
                    channelId: channelId,
                    key: key,
                },
            },
            update: {
                messageId: messageId,
            },
            create: {
                guildId: guildId,
                channelId: channelId,
                key: key,
                messageId: messageId,
            },
        });
    }

    static async getMessageId(guildId: string, channelId: string, key: string) {
        const sticky = await prisma.sticky.findUnique({
            where: {
                guildId_channelId_key: {
                    guildId: guildId,
                    channelId: channelId,
                    key: key,
                },
            },
        });
        if (sticky) {
            return sticky.messageId;
        } else {
            return null;
        }
    }
}
