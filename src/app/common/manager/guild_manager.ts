import { Interaction } from 'discord.js';

import { notExists } from '@/shared/assert';

export async function getGuildByInteraction(interaction: Interaction<'cached' | 'raw'>) {
    let guild = interaction.guild;
    if (notExists(guild)) {
        guild = await interaction.client.guilds.fetch(interaction.guildId);
    }

    return guild;
}
