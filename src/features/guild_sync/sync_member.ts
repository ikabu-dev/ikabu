import { Client, GuildMember, User } from 'discord.js';

import { updateGuildRoles } from '@/features/guild_sync/store_role';
import { MemberService } from '@/infra/db/repositories/member_service';
import { assertExistCheck, notExists } from '@/shared/assert';
import { searchAPIMemberById } from '@/shared/discord_helpers/member_manager';

/** メンバー情報が更新されたとき、ロール一覧と DB のメンバー情報を同期する */
export async function syncMemberOnUpdate(newMember: GuildMember) {
    const guild = await newMember.guild.fetch();
    await updateGuildRoles(guild);

    const userId = newMember.user.id;

    // 不完全なメンバーの場合を想定して、メンバー情報を取得し直す
    const member = (await searchAPIMemberById(guild, userId)) ?? newMember;

    assertExistCheck(member.joinedAt, 'joinedAt');

    // DBのメンバー情報を更新(ない場合は作成)。失敗すれば throw され、境界で通知される
    await MemberService.saveMemberFromGuildMember(member);
}

/** ユーザー情報が更新されたとき、そのユーザーが所属する全ギルドの DB 情報を同期する */
export async function syncMemberAcrossGuilds(client: Client, user: User) {
    const userId = user.id;

    const guildIdList = await MemberService.getMemberGuildIdsByUserId(userId);
    for (const guildId of guildIdList) {
        const guild = await client.guilds.fetch(guildId);

        const member = await searchAPIMemberById(guild, userId);

        // 他鯖のテーブルには存在するが、実際には鯖から抜けている場合
        if (notExists(member)) continue;

        // DBのメンバー情報を更新(ない場合は作成)。失敗すれば throw され、境界で通知される
        await MemberService.saveMemberFromGuildMember(member);
    }
}
