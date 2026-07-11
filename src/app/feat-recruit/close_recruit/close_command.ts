import { ChatInputCommandInteraction } from 'discord.js';

import { getCloseEmbed, getCommandHelpEmbed } from '@/app/feat-recruit/common/recruit_embeds';
import { assertExistCheck } from '@/shared/assert';

import { createNewRecruitButton } from '../create_recruit/common/create_recruit_buttons';

export async function closeCommand(interaction: ChatInputCommandInteraction<'cached'>) {
    assertExistCheck(interaction.channel, 'channel');
    const embed = getCloseEmbed();
    const channelName = interaction.channel.name;
    await interaction.reply({
        embeds: [embed, await getCommandHelpEmbed(interaction.guild, channelName)],
        components: [createNewRecruitButton(channelName)],
    });
}
