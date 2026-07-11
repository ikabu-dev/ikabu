import { prisma } from '@/infra/db/prisma';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
const logger = log4js_obj.getLogger('database');

export class StickyService {
    static async registerMessageId(
        guildId: string,
        channelId: string,
        key: string,
        messageId: string,
    ) {
        try {
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
        } catch (error) {
            await sendErrorLogs(logger, error);
        }
    }

    static async getMessageId(guildId: string, channelId: string, key: string) {
        try {
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
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }
}
