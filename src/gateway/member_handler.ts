import { Client, GuildMember, PartialGuildMember, User } from 'discord.js';

import { env } from '@/config/env';
import { setEnrollmentCount } from '@/features/enrollment_count/set_enrollment_count';
import { syncMemberAcrossGuilds, syncMemberOnUpdate } from '@/features/guild_sync/sync_member';
import { guildMemberAddEvent } from '@/features/onboarding/set_rookie';
import { sendRetireLog } from '@/features/retire_log/send_retire_log';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { assertExistCheck, notExists } from '@/shared/assert';

export async function handleGuildMemberAdd(client: Client, member: GuildMember) {
    try {
        const guild = await member.guild.fetch();
        if (notExists(client.user)) {
            throw new Error('client.user is null');
        }
        if (guild.id === env.serverId) {
            setEnrollmentCount(client.user, guild);
        }
        await guildMemberAddEvent(member); // 10分待つ可能性があるので最後に処理
    } catch (error) {
        const loggerMA = log4js_obj.getLogger('guildMemberAdd');
        await sendErrorLogs(loggerMA, error);
    }
}

export async function handleGuildMemberRemove(
    client: Client,
    member: GuildMember | PartialGuildMember,
) {
    const loggerMR = log4js_obj.getLogger('guildMemberRemove');
    try {
        const guild = await member.guild.fetch();

        const retireLogChannelExists = await sendRetireLog(member, guild);

        // 移行前は「退部ログチャンネルが未設定なら early return」だったため、
        // その場合は部員数の更新も行われていなかった。挙動を変えないためここで打ち切る。
        // (意図した仕様ではなさそうなので、別途修正を検討する)
        if (!retireLogChannelExists) return;

        if (guild.id === env.serverId) {
            assertExistCheck(client.user, 'client.user');
            setEnrollmentCount(client.user, guild);
        }
    } catch (error) {
        await sendErrorLogs(loggerMR, error);
    }
}

export async function handleGuildMemberUpdate(newMember: GuildMember) {
    const loggerMU = log4js_obj.getLogger('guildMemberUpdate');
    try {
        await syncMemberOnUpdate(newMember);
    } catch (error) {
        await sendErrorLogs(loggerMU, error);
    }
}

export async function handleUserUpdate(client: Client, newUser: User) {
    const loggerUU = log4js_obj.getLogger('userUpdate');
    try {
        await syncMemberAcrossGuilds(client, newUser);
    } catch (error) {
        await sendErrorLogs(loggerUU, error);
    }
}
