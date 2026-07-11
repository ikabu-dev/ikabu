import fs from 'fs';

import { stringify } from 'csv-stringify/sync';
import {
    AttachmentBuilder,
    ChatInputCommandInteraction,
    GuildMember,
    PermissionsBitField,
    Role,
    User,
} from 'discord.js';

import { ErrorTexts } from '@/config/constants/error_texts';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { assertExistCheck, exists, notExists } from '@/shared/assert';
import { getGuildByInteraction } from '@/shared/discord_helpers/guild_manager';
import { searchAPIMemberById } from '@/shared/discord_helpers/member_manager';
import {
    createRole,
    searchRoleById,
    searchRoleIdByName,
    setColorToRole,
    unassginRoleFromMembers,
} from '@/shared/discord_helpers/role_manager';

const logger = log4js_obj.getLogger('RoleManager');

export async function handleCreateRole(interaction: ChatInputCommandInteraction<'cached' | 'raw'>) {
    // 'インタラクションに失敗'が出ないようにするため
    await interaction.deferReply();
    const { options } = interaction;

    const guild = await getGuildByInteraction(interaction);
    const member = await searchAPIMemberById(guild, interaction.member.user.id);
    assertExistCheck(member, 'member');

    if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return await interaction.editReply('ロールを管理する権限がないでし！');
    }

    try {
        const roleName = options.getString('ロール名', true);
        let colorInput = options.getString('ロールカラー');

        if (exists(await searchRoleIdByName(guild, roleName))) {
            return await interaction.followUp(
                'その名前のロールはもうあるでし！\n別のロール名を使うでし！',
            );
        }

        if (notExists(colorInput)) {
            await interaction.followUp('色はこっちで決めさせてもらうでし！');
        } else if (!colorInput.match('^#([\\da-fA-F]{6})$')) {
            await interaction.followUp(
                '`' +
                    colorInput +
                    '`はカラーコードじゃないでし！\n`[ex]: #5d4efd, #111`\n色はこっちで決めさせてもらうでし！',
            );
            colorInput = null;
        }

        const roleId = await createRole(guild, roleName);

        await guild.roles.fetch();

        const role = await searchRoleById(guild, roleId);
        assertExistCheck(role);
        const colorCode = await setColorToRole(guild, role, colorInput);
        await role.setHoist(true);

        await interaction.followUp(
            'ロール名`' +
                role.name +
                '`を作ったでし！\nロールIDは`' +
                roleId +
                '`、カラーコードは`' +
                colorCode +
                '`でし！',
        );
    } catch (error) {
        await sendErrorLogs(logger, error);
        await interaction.followUp(ErrorTexts.UndefinedError);
    }
}

export async function handleDeleteRole(interaction: ChatInputCommandInteraction<'cached' | 'raw'>) {
    // 'インタラクションに失敗'が出ないようにするため
    await interaction.deferReply();
    const { options } = interaction;

    const guild = await getGuildByInteraction(interaction);
    const member = await searchAPIMemberById(guild, interaction.member.user.id);
    assertExistCheck(member, 'member');

    if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return await interaction.editReply('ロールを管理する権限がないでし！');
    }

    let roleIdList = [];
    const role1 = options.getMentionable('ロール名1', true);
    const role2 = options.getMentionable('ロール名2');
    const role3 = options.getMentionable('ロール名3');

    if (!(role1 instanceof GuildMember) && !(role1 instanceof Role) && !(role1 instanceof User))
        return;
    roleIdList.push(role1.id);
    if (exists(role2)) {
        if (!(role2 instanceof GuildMember) && !(role2 instanceof Role) && !(role2 instanceof User))
            return;
        roleIdList.push(role2.id);
    }
    if (exists(role3)) {
        if (!(role3 instanceof GuildMember) && !(role3 instanceof Role) && !(role3 instanceof User))
            return;
        roleIdList.push(role3.id);
    }

    await interaction.editReply('指定されたIDのロールを削除中でし！\nちょっと待つでし！');

    const removed = [];

    removed.push(['ロールID', 'ロール名']);

    await interaction.editReply('0% 完了');

    roleIdList = Array.from(new Set(roleIdList));

    try {
        // i = index
        // removed[i][0] = deleted role (id)
        // removed[i][1] = deleted role (name)
        for (const i in roleIdList) {
            let roleName;
            const role = await searchRoleById(guild, roleIdList[i]);
            // if role ID is not found, consider as an error.
            if (notExists(role)) {
                roleName = 'NOT_FOUND!';
            } else {
                roleName = role.name;
                await role.delete();
                await guild.roles.fetch();
            }
            removed.push([roleIdList[i], roleName]);
            const progress = `${((+i + 1) / roleIdList.length) * 100}`;
            await interaction.editReply(parseInt(progress, 10) + '% 完了');
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        await interaction.editReply('ロール削除中にエラーでし！');
    }

    const csvString = stringify(removed);
    fs.writeFileSync('./temp/temp.csv', csvString);
    const attachment = new AttachmentBuilder('./temp/temp.csv', {
        name: 'removed_role.csv',
    });

    await interaction.followUp({
        content:
            '操作が完了したでし！\nしゃべると長くなるから下に削除したロールをまとめておいたでし！',
        files: [attachment],
    });
}

export async function handleAssignRole(interaction: ChatInputCommandInteraction<'cached' | 'raw'>) {
    // 'インタラクションに失敗'が出ないようにするため
    await interaction.deferReply();
    const { options } = interaction;

    const guild = await getGuildByInteraction(interaction);
    const member = await searchAPIMemberById(guild, interaction.member.user.id);
    assertExistCheck(member, 'member');

    if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return await interaction.editReply('ロールを管理する権限がないでし！');
    }

    try {
        const targetRole = options.getMentionable('ターゲットロール', true);
        const assignRole = options.getMentionable('割当ロール', true);
        if (!(targetRole instanceof Role)) {
            return await interaction.editReply('ロールを指定するでし！');
        }

        if (!(assignRole instanceof Role)) {
            return await interaction.editReply('割当ロールが見つからないでし！');
        }
        const assignRoleId = assignRole.id;

        const targets = targetRole.members;

        for (const target of targets) {
            await target[1].roles.add(assignRoleId);
        }

        await interaction.editReply(
            '`' + targetRole.name + '`のメンバーに`' + assignRole.name + '`のロールつけたでし！',
        );
    } catch (error) {
        await sendErrorLogs(logger, error);
        await interaction.editReply(ErrorTexts.UndefinedError);
    }
}

export async function handleUnassignRole(
    interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
) {
    // 'インタラクションに失敗'が出ないようにするため
    await interaction.deferReply();
    const { options } = interaction;

    const guild = await getGuildByInteraction(interaction);
    const member = await searchAPIMemberById(guild, interaction.member.user.id);
    assertExistCheck(member, 'member');

    if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return await interaction.editReply('ロールを管理する権限がないでし！');
    }

    try {
        const targetRole = options.getMentionable('ターゲットロール', true);
        const unAssignRole = options.getMentionable('解除ロール', true);

        if (!(targetRole instanceof Role)) {
            return await interaction.editReply('ロールを指定するでし！');
        }

        if (!(unAssignRole instanceof Role)) {
            return await interaction.editReply('割当ロールが見つからないでし！');
        }
        const unAssignRoleId = unAssignRole.id;

        const success = await unassginRoleFromMembers(unAssignRoleId, targetRole.members);

        if (success) {
            return await interaction.editReply(
                '`' +
                    targetRole.name +
                    '`のメンバーから`' +
                    unAssignRole.name +
                    '`のロールを削除したでし！',
            );
        } else {
            return await interaction.editReply('ロールの解除に失敗したでし!');
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        await interaction.editReply(ErrorTexts.UndefinedError);
    }
}
