import { Message } from 'discord.js';

const kujis = ['大吉', '中吉', '小吉', '吉', '凶', '大凶', '末吉'];
export async function handleOmikuji(msg: Message<true>) {
    const kuji = kujis[Math.floor(Math.random() * kujis.length)];
    await msg.reply('`' + kuji + '`でし！');
}
