import { ChannelType } from 'discord.js';

import { dbCall } from './db_call.js';
import { prisma } from './prisma';
import { log4js_obj } from '../log4js_settings';

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
        return dbCall(logger, null, async () => {
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
        });
    }

    static async setVCToolsEnabled(guildId: string, channelId: string, isVCToolsEnabled = true) {
        return dbCall(logger, null, async () => {
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
        });
    }

    static async setAdminChannel(guildId: string, channelId: string, isAdminChannel = true) {
        return dbCall(logger, null, async () => {
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
        });
    }

    static async delete(guildId: string, channelId: string) {
        return dbCall(logger, null, async () => {
            return await prisma.channel.delete({
                where: {
                    guildId_channelId: {
                        guildId: guildId,
                        channelId: channelId,
                    },
                },
            });
        });
    }

    static async getChannel(guildId: string, channelId: string) {
        return dbCall(logger, null, async () => {
            return await prisma.channel.findUnique({
                where: {
                    guildId_channelId: {
                        guildId: guildId,
                        channelId: channelId,
                    },
                },
            });
        });
    }

    static async getChannelsByCategoryId(guildId: string, categoryId: string) {
        return dbCall(logger, [], async () => {
            return await prisma.channel.findMany({
                where: {
                    guildId: guildId,
                    parentId: categoryId,
                },
            });
        });
    }

    static async getAllGuildChannels(guildId: string) {
        return dbCall(logger, [], async () => {
            return await prisma.channel.findMany({
                where: {
                    guildId: guildId,
                },
            });
        });
    }

    static async getAllChannels() {
        return dbCall(logger, [], async () => {
            return await prisma.channel.findMany();
        });
    }
}
