import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';

import { RoleKeySet } from '@/config/constants/role_key';
import { MemberService } from '@/infra/db/repositories/member_service';
import { UniqueRoleService } from '@/infra/db/repositories/unique_role_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { exists, notExists } from '@/shared/assert';
import { searchDBMemberById } from '@/shared/discord_helpers/member_manager';

const logger = log4js_obj.getLogger('interaction');

export async function joinedAtFixer(interaction: ChatInputCommandInteraction<'cached'>) {
    try {
        const guild = interaction.guild;
        const member = interaction.member;

        const developerRoleId = await UniqueRoleService.getRoleIdByKey(
            guild.id,
            RoleKeySet.Developer.key,
        );

        if (notExists(developerRoleId)) {
            return await interaction.reply('開発者ロールが設定されていないでし！');
        } else if (!member.roles.cache.has(developerRoleId)) {
            return await interaction.reply('開発者のみが実行できるコマンドでし！');
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const targetUser = interaction.options.getUser('ユーザー', true);
        const year = interaction.options.getInteger('年', true);
        const month = interaction.options.getInteger('月', true);
        const day = interaction.options.getInteger('日', true);
        const hour = interaction.options.getInteger('時', true);
        const minute = interaction.options.getInteger('分', true);
        const second = interaction.options.getInteger('秒', false) ?? 0;
        const isForceSet = interaction.options.getBoolean('強制設定', false) ?? false;

        const targetDBMember = await searchDBMemberById(guild, targetUser.id);

        if (notExists(targetDBMember)) {
            return await interaction.editReply('対象ユーザーが見つからなかったでし！');
        }

        const newDate = new Date(year, month - 1, day, hour, minute, second);

        if (
            !isForceSet &&
            exists(targetDBMember.joinedAt) &&
            targetDBMember.joinedAt.getTime() < newDate.getTime()
        ) {
            return await interaction.editReply(
                '現在の参加日時よりも後の日時を指定することはできないでし！',
            );
        }

        await MemberService.updateJoinedAt(guild.id, targetDBMember.userId, newDate);

        return await interaction.editReply(
            '参加日時を更新したでし！\n`' +
                newDate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) +
                '`',
        );
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
