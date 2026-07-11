import { CacheType, ChatInputCommandInteraction } from 'discord.js';

import { assertExistCheck, exists } from '@/shared/assert';
import { randomSelect } from '@/shared/random';

export async function handlePick(interaction: ChatInputCommandInteraction<CacheType>) {
    const { options } = interaction;
    const pickNum = options.getInteger('ピックする数');
    const choices = options.getString('選択肢');

    assertExistCheck(choices, "options.getString('選択肢')");

    let strCmd = choices.replace(/　/g, ' ');
    strCmd = choices.replace(/\r?\n/g, ' ');
    const args = strCmd.split(/\s+/);

    // Math.random() * ( 最大値 - 最小値 ) + 最小値;
    let picked = args[Math.floor(Math.random() * args.length)];

    if (exists(pickNum)) {
        args.shift();
        picked = randomSelect(args, pickNum).join('\n');
    } else {
        picked = args[Math.floor(Math.random() * args.length)];
    }
    await interaction.reply({ content: picked + 'でし！' });
}
