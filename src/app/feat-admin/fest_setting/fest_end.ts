import { CategoryChannel, ChatInputCommandInteraction, Guild } from 'discord.js';

import { searchRoleById, unassginRoleFromMembers } from '@/app/common/manager/role_manager';
import { assertExistCheck, notExists } from '@/app/common/others';
import { RoleKeySet } from '@/app/constant/role_key';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { UniqueRoleService } from '@/db/unique_role_service';
import { log4js_obj } from '@/log4js_settings';

const logger = log4js_obj.getLogger('interaction');

export async function festEnd(
    interaction: ChatInputCommandInteraction<'cached'>,
    guild: Guild,
    categoryChannel: CategoryChannel,
) {
    // フェスカテゴリのチャンネルを非表示にする
    try {
        const channels = categoryChannel.children.cache;
        channels.each(async (channel) => {
            await channel.permissionOverwrites.edit(guild.roles.everyone, {
                ViewChannel: false,
            });
        });
        await interaction.editReply('フェス設定を`オフ`にしたでし！');
    } catch (error) {
        await sendErrorLogs(logger, error);
        await interaction.editReply('設定中にエラーが発生したでし！');
    }

    const unassignFestivalRole =
        interaction.options.getBoolean('フェスロールを外す', false) ?? false;

    if (!unassignFestivalRole) {
        return;
    }

    await interaction.followUp('フェスロールを外していくでし！');

    // フェスロールを外す
    try {
        const shiverId = await UniqueRoleService.getRoleIdByKey(
            guild.id,
            RoleKeySet.ShiverRecruit.key,
        );
        if (notExists(shiverId)) {
            return await interaction.followUp('`フウカ陣営`ロールは設定されていないでし！');
        }
        const shiverRole = await searchRoleById(guild, shiverId);
        assertExistCheck(shiverRole, 'shiverRole');
        const shiverCount = shiverRole.members.size;
        const success = await unassginRoleFromMembers(shiverId, shiverRole.members);
        if (success) {
            await interaction.followUp(`\`フウカ陣営\`ロールを外したでし！ \`[${shiverCount}]\``);
        } else {
            await interaction.followUp('`フウカ陣営`ロールを外すのに失敗したでし！');
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        await interaction.followUp('`フウカ陣営`ロールを外すのに失敗したでし！');
    }

    try {
        const fryeId = await UniqueRoleService.getRoleIdByKey(guild.id, RoleKeySet.FryeRecruit.key);
        if (notExists(fryeId)) {
            return await interaction.followUp('`ウツホ陣営`ロールは設定されていないでし！');
        }
        const fryeRole = await searchRoleById(guild, fryeId);
        assertExistCheck(fryeRole, 'fryeRole');
        const fryeCount = fryeRole.members.size;
        const success = await unassginRoleFromMembers(fryeId, fryeRole.members);
        if (success) {
            await interaction.followUp(`\`ウツホ陣営\`ロールを外したでし！ \`[${fryeCount}]\``);
        } else {
            await interaction.followUp('`ウツホ陣営`ロールを外すのに失敗したでし！');
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        await interaction.followUp('`ウツホ陣営`ロールを外すのに失敗したでし！');
    }

    try {
        const bigmanId = await UniqueRoleService.getRoleIdByKey(
            guild.id,
            RoleKeySet.BigmanRecruit.key,
        );
        if (notExists(bigmanId)) {
            return await interaction.followUp('`マンタロー陣営`ロールは設定されていないでし！');
        }
        const bigmanRole = await searchRoleById(guild, bigmanId);
        assertExistCheck(bigmanRole, 'bigmanRole');
        const bigmanCount = bigmanRole.members.size;
        const success = await unassginRoleFromMembers(bigmanId, bigmanRole.members);
        if (success) {
            await interaction.followUp(
                `\`マンタロー陣営\`ロールを外したでし！ \`[${bigmanCount}]\``,
            );
        } else {
            await interaction.followUp('`マンタロー陣営`ロールを外すのに失敗したでし！');
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        await interaction.followUp('`マンタロー陣営`ロールを外すのに失敗したでし！');
    }
}
