import { CacheType, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { Combination } from 'js-combinatorics';

export async function handleKansen(interaction: ChatInputCommandInteraction<CacheType>) {
    const { options } = interaction;
    const numOfTimes = options.getInteger('回数') ?? 5;

    const resultList = [];
    const combination = new Combination(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], 2);
    let tmpSpectatorList = combination.toArray();
    if (numOfTimes > 20) {
        await interaction.reply({
            content: '20回以下じゃないとダメでし！',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }
    if (numOfTimes <= 0) {
        await interaction.reply({
            content: '1以上じゃないとダメでし！',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    // 'インタラクションに失敗'が出ないようにするため
    await interaction.deferReply();

    for (let i = 0; i < numOfTimes; i++) {
        // next spectatorsが一人になったらリストを再生成
        let baseNum;
        let selectedComb: string[];
        if (tmpSpectatorList.length <= 1) {
            baseNum = 0;
            selectedComb = tmpSpectatorList[baseNum];
            resultList.push(i + 1 + '回目：' + selectedComb);
            tmpSpectatorList = combination.toArray();
        } else {
            baseNum = Math.floor(Math.random() * tmpSpectatorList.length);
            selectedComb = tmpSpectatorList[baseNum];

            resultList.push(i + 1 + '回目：' + selectedComb);

            // now spectators をnext spectatorsから取り除く
            tmpSpectatorList = tmpSpectatorList.filter(function excludePrevSpectator(
                players: string[],
            ) {
                if (players[0] != selectedComb[0]) {
                    return players;
                }
            });
            tmpSpectatorList = tmpSpectatorList.filter(function excludePrevSpectator(
                players: string[],
            ) {
                if (players[1] != selectedComb[0]) {
                    return players;
                }
            });
            tmpSpectatorList = tmpSpectatorList.filter(function excludePrevSpectator(
                players: string[],
            ) {
                if (players[0] != selectedComb[1]) {
                    return players;
                }
            });
            tmpSpectatorList = tmpSpectatorList.filter(function excludePrevSpectator(
                players: string[],
            ) {
                if (players[1] != selectedComb[1]) {
                    return players;
                }
            });
        }
    }

    const emb = new EmbedBuilder()
        .setColor(0xf02d7d)
        .addFields([{ name: '観戦の人', value: resultList.join('\n') }]);
    await interaction.editReply({ embeds: [emb] });
}
