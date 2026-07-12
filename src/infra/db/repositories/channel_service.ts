import { Channel } from '@prisma/client';
import { ChannelType } from 'discord.js';

import { prisma } from '@/infra/db/prisma';

export class ChannelService {
    static async save(
        guildId: string,
        channelId: string,
        channelName: string,
        channelType: ChannelType,
        position: number,
        parentId?: string | null,
    ) {
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
    }

    // update() は対象行が無いと P2025 で throw するため、冪等に扱いたいここでは updateMany を使う。
    // ただし updateMany は更新した行そのものを返さない（{count} のみ）ので、
    // 呼び出し側が Channel レコード（type / channelId）を参照できるよう findUnique で取り直して返す。
    // 戻り値の null は「そのチャンネルが DB に存在しない」ことを表す（DB 障害は throw される）。
    static async setVCToolsEnabled(
        guildId: string,
        channelId: string,
        isVCToolsEnabled = true,
    ): Promise<Channel | null> {
        await prisma.channel.updateMany({
            where: {
                guildId: guildId,
                channelId: channelId,
            },
            data: {
                isVCToolsEnabled: isVCToolsEnabled,
            },
        });

        return await prisma.channel.findUnique({
            where: {
                guildId_channelId: {
                    guildId: guildId,
                    channelId: channelId,
                },
            },
        });
    }

    // setVCToolsEnabled と同じ理由で updateMany + findUnique の組み合わせにしている。
    static async setAdminChannel(
        guildId: string,
        channelId: string,
        isAdminChannel = true,
    ): Promise<Channel | null> {
        await prisma.channel.updateMany({
            where: {
                guildId: guildId,
                channelId: channelId,
            },
            data: {
                isAdminChannel: isAdminChannel,
            },
        });

        return await prisma.channel.findUnique({
            where: {
                guildId_channelId: {
                    guildId: guildId,
                    channelId: channelId,
                },
            },
        });
    }

    static async delete(guildId: string, channelId: string): Promise<void> {
        await prisma.channel.deleteMany({
            where: {
                guildId: guildId,
                channelId: channelId,
            },
        });
    }

    static async getChannel(guildId: string, channelId: string) {
        return await prisma.channel.findUnique({
            where: {
                guildId_channelId: {
                    guildId: guildId,
                    channelId: channelId,
                },
            },
        });
    }

    static async getChannelsByCategoryId(guildId: string, categoryId: string) {
        return await prisma.channel.findMany({
            where: {
                guildId: guildId,
                parentId: categoryId,
            },
        });
    }

    static async getAllGuildChannels(guildId: string) {
        return await prisma.channel.findMany({
            where: {
                guildId: guildId,
            },
        });
    }

    static async getAllChannels() {
        return await prisma.channel.findMany();
    }
}
