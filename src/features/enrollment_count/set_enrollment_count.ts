import { ActivityType, ClientUser, Guild } from 'discord.js';

/** 部員数を Bot のアクティビティ(ステータス)に表示する */
export function setEnrollmentCount(clientUser: ClientUser, guild: Guild) {
    clientUser.setActivity(`部員数: ${guild.memberCount}人`, {
        type: ActivityType.Custom,
    });
}
