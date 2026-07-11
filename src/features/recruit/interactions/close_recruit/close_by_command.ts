import { ChatInputCommandInteraction } from 'discord.js';

import { createNewRecruitButton } from '@/features/recruit/ui/buttons/create_recruit_buttons';
import { getCloseEmbed, getCommandHelpEmbed } from '@/features/recruit/ui/recruit_embeds';
import { assertExistCheck } from '@/shared/assert';

export async function closeCommand(interaction: ChatInputCommandInteraction<'cached'>) {
    assertExistCheck(interaction.channel, 'channel');
    const embed = getCloseEmbed();
    const channelName = interaction.channel.name;
    await interaction.reply({
        embeds: [embed, await getCommandHelpEmbed(interaction.guild, channelName)],
        components: [createNewRecruitButton(channelName)],
    });
}
