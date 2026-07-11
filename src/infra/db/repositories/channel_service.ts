import { ChannelType } from 'discord.js';

import { prisma } from '@/infra/db/prisma';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';

const logger = log4js_obj.getLogger('database');

export class ChannelService {
    static async save(
        guildId: string,
        channelId: string,
        channelName: string,
        channelType: ChannelType,
        position: number,
        parentId?: string | null,
    ) {
        try {
            return await prisma.channel.upsert({
                where: {
                    guildId_channelId: {
                        guildId: guildId,
                        channelId: channelId,
                    },
                },
                update: {
                    guildId: guildId,
                    name: channelName,
                    type: channelType,
                    position: position,
                    parentId: parentId,
                },
                create: {
                    guildId: guildId,
                    channelId: channelId,
                    name: channelName,
                    type: channelType,
                    position: position,
                    parentId: parentId === undefined ? null : parentId,
                    isVCToolsEnabled: false,
                    isAdminChannel: false,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }

    static async setVCToolsEnabled(guildId: string, channelId: string, isVCToolsEnabled = true) {
        try {
            return await prisma.channel.update({
                where: {
                    guildId_channelId: {
                        guildId: guildId,
                        channelId: channelId,
                    },
                },
                data: {
                    isVCToolsEnabled: isVCToolsEnabled,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }

    static async setAdminChannel(guildId: string, channelId: string, isAdminChannel = true) {
        try {
            return await prisma.channel.update({
                where: {
                    guildId_channelId: {
                        guildId: guildId,
                        channelId: channelId,
                    },
                },
                data: {
                    isAdminChannel: isAdminChannel,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }

    static async delete(guildId: string, channelId: string) {
        try {
            return await prisma.channel.delete({
                where: {
                    guildId_channelId: {
                        guildId: guildId,
                        channelId: channelId,
                    },
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }

    static async getChannel(guildId: string, channelId: string) {
        try {
            return await prisma.channel.findUnique({
                where: {
                    guildId_channelId: {
                        guildId: guildId,
                        channelId: channelId,
                    },
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
            return null;
        }
    }

    static async getChannelsByCategoryId(guildId: string, categoryId: string) {
        try {
            return await prisma.channel.findMany({
                where: {
                    guildId: guildId,
                    parentId: categoryId,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
            return [];
        }
    }

    static async getAllGuildChannels(guildId: string) {
        try {
            return await prisma.channel.findMany({
                where: {
                    guildId: guildId,
                },
            });
        } catch (error) {
            await sendErrorLogs(logger, error);
            return [];
        }
    }

    static async getAllChannels() {
        try {
            return await prisma.channel.findMany();
        } catch (error) {
            await sendErrorLogs(logger, error);
            return [];
        }
    }
}
