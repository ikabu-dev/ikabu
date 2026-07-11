import { ChatInputCommandInteraction } from 'discord.js';

import { notExists } from '@/app/common/others';

export async function handleVoicePick(interaction: ChatInputCommandInteraction<'cached'>) {
    if (notExists(interaction.channel)) return;

    // 'インタラクションに失敗'が出ないようにするため
    await interaction.deferReply();

    const member = interaction.member;

    const { options } = interaction;
    // 発言したヒトが接続してるボイチャから数字分のヒトをランダム抽出
    // 数字なしの場合は１人をランダム抽出

    if (!interaction.channel.isVoiceBased()) {
        return await interaction.editReply('そのコマンドはボイスチャンネルでのみ使用可能でし！');
    }

    if (notExists(member.voice.channel) || member.voice.channel.id !== interaction.channel.id) {
        return await interaction.editReply('このチャンネルに接続してないでし！');
    }

    const pickNum = options.getInteger('ピックする人数') ?? 1;

    if (pickNum > member.voice.channel.members.size) {
        return await interaction.editReply('接続中の人数よりも多い数を指定してるでし！');
    } else if (pickNum < 1) {
        return await interaction.editReply('0人未満で選択することはできないでし！');
    }

    const pickedMembers = member.voice.channel.members.random(pickNum);

    await interaction.editReply({ content: `${pickedMembers}` });
}
