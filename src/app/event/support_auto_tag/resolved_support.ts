import { ButtonInteraction, MessageFlags, PermissionsBitField } from 'discord.js';

import { recoveryThinkingButton, setButtonDisable } from '@/app/common/button_components';
import { getGuildByInteraction } from '@/app/common/manager/guild_manager';
import { searchAPIMemberById } from '@/app/common/manager/member_manager';
import { assertExistCheck, exists, notExists } from '@/app/common/others';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { log4js_obj } from '@/log4js_settings';

import { tagIdsEmbed } from './tag_ids_embed';

const logger = log4js_obj.getLogger('interaction');

export async function setResolvedTag(interaction: ButtonInteraction<'cached' | 'raw'>) {
    try {
        const guild = await getGuildByInteraction(interaction);
        const member = await searchAPIMemberById(guild, interaction.member.user.id);
        assertExistCheck(member, 'member');
        const channel = interaction.channel;

        if (notExists(channel) || !channel.isThread()) return;

        if (!member.permissions.has(PermissionsBitField.Flags.ManageThreads)) {
            return await interaction.reply({
                content: '権限がないでし！',
                flags: MessageFlags.Ephemeral,
            });
        }

        if (
            notExists(process.env.TAG_ID_SUPPORT_PROGRESS) ||
            notExists(process.env.TAG_ID_SUPPORT_RESOLVED)
        ) {
            const embed = tagIdsEmbed(channel);
            if (exists(embed)) {
                return await interaction.reply({ embeds: [embed] });
            } else {
                return await interaction.reply({
                    content: '想定されていないチャンネルでし！',
                    flags: MessageFlags.Ephemeral,
                });
            }
        }

        await interaction.update({
            components: setButtonDisable(interaction.message, interaction),
        });

        if (channel.archived) {
            await channel.setArchived(false); // スレッドがアーカイブされてるとタグ変更とロックが行えないため
        }

        const appliedTags = channel.appliedTags;
        const replace_index = appliedTags.indexOf(process.env.TAG_ID_SUPPORT_PROGRESS);
        appliedTags.splice(replace_index, 1, process.env.TAG_ID_SUPPORT_RESOLVED);
        await channel.setAppliedTags(appliedTags, '質問対応終了');
        await channel.setLocked(true);
        await channel.setArchived(true);

        await interaction.editReply({
            components: recoveryThinkingButton(interaction, 'クローズ済'),
        });
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
