import { EmbedBuilder, Guild } from 'discord.js';

import { ChannelKeySet } from '@/config/constants/channel_key';
import { UniqueChannelService } from '@/infra/db/repositories/unique_channel_service';

export function getCloseEmbed() {
    const embed = new EmbedBuilder();
    embed.setDescription(`↑の募集 〆`);
    return embed;
}

const recruit_command = {
    プラベ募集: '`/プラベ募集 recruit` or `/プラベ募集 button`',
    イベマ募集: '`/イベマ募集 event`',
    ナワバリ募集: '`/ナワバリ募集 now` or `/ナワバリ募集 next`',
    バンカラ募集: '`/バンカラ募集 now` or `/バンカラ募集 next`',
    フェス募集: '`/〇〇陣営 now` or `/〇〇陣営 next`',
    サーモン募集: '`/サーモンラン募集 run`',
    レイダース募集: '`/レイダース募集 raiders`',
    別ゲー募集:
        '`/別ゲー募集 apex` or `/別ゲー募集 overwatch` or `/別ゲー募集 mhw` or `/別ゲー募集 valo` or `/別ゲー募集 other`',
};

export async function getCommandHelpEmbed(guild: Guild, channelName: string) {
    let commandMessage;
    switch (channelName) {
        case 'プラベ募集':
            commandMessage = recruit_command.プラベ募集;
            break;
        case 'イベマ募集':
            commandMessage = recruit_command.イベマ募集;
            break;
        case 'ナワバリ募集':
            commandMessage = recruit_command.ナワバリ募集;
            break;
        case 'バンカラ募集':
            commandMessage = recruit_command.バンカラ募集;
            break;
        case 'フウカ募集':
        case 'ウツホ募集':
        case 'マンタロー募集':
            commandMessage = recruit_command.フェス募集;
            break;
        case 'サーモン募集':
            commandMessage = recruit_command.サーモン募集;
            break;
        case 'レイダース募集':
            commandMessage = recruit_command.レイダース募集;
            break;
        case '別ゲー募集':
            commandMessage = recruit_command.別ゲー募集;
            break;

        default:
            break;
    }

    const recruitHelpChannelId = await UniqueChannelService.getChannelIdByKey(
        guild.id,
        ChannelKeySet.RecruitHelp.key,
    );
    const embed = new EmbedBuilder();
    embed.setDescription(
        '募集コマンドは ' +
            `${commandMessage}` +
            `\n詳しくは <#${recruitHelpChannelId}> を確認するでし！`,
    );
    return embed;
}
