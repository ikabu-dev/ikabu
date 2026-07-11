import { Member } from '@prisma/client';
import { ButtonInteraction, EmbedBuilder, MessageFlags } from 'discord.js';

import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { assertExistCheck, notExists } from '@/shared/assert';
import { getGuildByInteraction } from '@/shared/discord_helpers/guild_manager';
import { searchDBMemberById } from '@/shared/discord_helpers/member_manager';

const logger = log4js_obj.getLogger('interaction');

export async function sendRadioRequest(interaction: ButtonInteraction<'cached' | 'raw'>) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const guild = await getGuildByInteraction(interaction);
        const sender = await searchDBMemberById(guild, interaction.member.user.id);

        const channel = interaction.channel;

        if (notExists(channel) || !channel.isVoiceBased()) return;

        assertExistCheck(sender, 'storedMember');

        const members = channel.members;

        if (members.size < 1) {
            await interaction.editReply({ content: 'そのVCには誰もいないでし！' });
            return;
        }

        let mentions = '';
        for (const member of members) {
            mentions += `<@${member[1].id}>`;
        }

        await channel.send({
            content: mentions,
            embeds: [createRadioRequestEmbed(sender)],
        });
        await interaction.deleteReply();
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}

function createRadioRequestEmbed(member: Member) {
    const embed = new EmbedBuilder();
    embed.setAuthor({ name: member.displayName, iconURL: member.iconUrl });
    embed.setImage(
        'https://raw.githubusercontent.com/shngmsw/ikabu/stg/images/stamp/radio_request.png',
    );
    embed.setTimestamp();
    return embed;
}
