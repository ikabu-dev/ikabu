/**
 * MIT License
 * Copyright (c) 2020 noriokun4649
 */

import { Readable } from 'stream';

import conf from 'config-reloadable';
import { SHA256 } from 'crypto-js';
import { ChatInputCommandInteraction, Message } from 'discord.js';

import { env } from '@/config/env';
import VoiceTextApi, { VoiceTextApiParams } from '@/infra/external/voice-text/voice_text';
import { assertExistCheck, exists, notExists } from '@/shared/assert';
import { searchDBMemberById } from '@/shared/discord_helpers/member_manager';

const config = conf();
interface VoiceTypes {
    [key: string]: string;
}

const voiceLists1: VoiceTypes = {
    hikari: 'ひかり（女性）',
    haruka: 'はるか（女性）',
    takeru: 'たける（男性）',
    santa: 'サンタ',
    bear: '凶暴なクマ',
    show: 'ショウ（男性）',
};

interface ModeTypes {
    [key: string]: string;
}

const modeList1: ModeTypes = {
    1: 'HOYA VoiceText API',
};
const pitchList = [70, 80, 90, 100, 110, 120, 130, 140, 150, 160];
const speedList = [70, 80, 90, 100, 110, 120, 130, 140, 150, 160];
let autoRestart = true;
let readMe = false;
let apiType = '1';
let voiceType = 'haruka';
let speed = 100;
let pitch = 100;

const voiceTextApiKey = env.voiceTextApiKey;
assertExistCheck(voiceTextApiKey, 'VOICE_TEXT_API_KEY');
readConfig();
let voicePattern1 = voiceType; //初期時のよみあげ音声
const mode = Number(apiType);
const voiceText = new VoiceTextApi(voiceTextApiKey); //Voice Text API key

function readConfig() {
    autoRestart = config.get('AutoRestart');
    if (typeof autoRestart !== 'boolean') throw new Error('Require a boolean type.');
    readMe = config.get('ReadMe');
    if (typeof readMe !== 'boolean') throw new Error('Require a boolean type.');
    apiType = config.get('Defalut.apiType');
    if (!modeList1[apiType]) throw new Error('Unknown api.');
    voiceType = config.get('Defalut.voiceType');
    if (!voiceLists1[voiceType]) throw new Error('Unknown voice.');
    return true;
}

export async function modeApi(msg: Message<true>) {
    if (mode === 1) {
        // ユーザーによって音声変える
        const member = await searchDBMemberById(msg.guild, msg.author.id);
        const displayNameSha256 = exists(member) ? SHA256(member.displayName) : SHA256('default');
        const numberOnly = displayNameSha256.toString().replace(/[^0-9]/g, '');

        const selectPitch = Number(numberOnly.substr(1, 1));
        const selectSpeed = Number(numberOnly.substr(2, 1));
        const replacedMessage = await messageReplace(msg);
        if (replacedMessage.length == 0) {
            return null;
        }
        pitch = pitchList[selectPitch];
        speed = speedList[selectSpeed];
        const voiceTextParams: VoiceTextApiParams = {
            format: 'wav',
            text: replacedMessage,
            speaker: voicePattern1,
            pitch: pitch,
            speed: speed,
        };
        return await voiceText.fetchBuffer(voiceTextParams);
    } else {
        throw Error(`不明なAPIが選択されています:${mode}`);
    }
}

export function bufferToStream(buffer: Uint8Array) {
    const hwm = 1024 * 1024;
    const stream = new Readable({ highWaterMark: hwm });
    stream.push(buffer);
    stream.push(null);
    return stream;
}

async function messageReplace(message: Message<true>) {
    const w_replace = (str: string) => {
        const judge = /.*[wWｗＷ]+$/g;
        if (str.match(judge)) {
            const pat = /[wWｗＷ]+/g;
            return str.replace(pat, 'わらあた');
        }
        return str;
    };

    const url_delete = (str: string) => {
        const pat = /(https?:\/\/[\x21-\x7e]+)/g;
        return str.replace(pat, ' URL省略。');
    };

    const emoji_delete = (str: string) => {
        const pat = /(<:\w*:\d*>)/g;
        return str.replace(pat, '');
    };

    const role_mention_replace = (str: string): string => {
        const [matchAllElement] = str.matchAll(/<@&(\d*)>/g);
        if (notExists(matchAllElement)) return str;
        for (let i = 0; i < [matchAllElement].length; i++) {
            const role = message.mentions.roles.get([matchAllElement][i][1]);
            if (exists(role)) {
                str = str.replace([matchAllElement][i][0], '@' + role.name);
            }
        }
        return role_mention_replace(str);
    };

    const nickname_mention_replace = (str: string): string => {
        const [matchAllElement] = str.matchAll(/<@!(\d*)>/g);
        if (notExists(matchAllElement)) return str;
        for (let i = 0; i < [matchAllElement].length; i++) {
            const user = message.mentions.users.get([matchAllElement][i][1]);
            if (exists(user)) {
                str = str.replace([matchAllElement][i][0], '@' + user.displayName);
            }
        }
        return nickname_mention_replace(str);
    };

    const mention_replace = (str: string): string => {
        const [matchAllElement] = str.matchAll(/<@(\d*)>/g);
        if (notExists(matchAllElement)) return str;
        for (let i = 0; i < [matchAllElement].length; i++) {
            const user = message.mentions.users.get([matchAllElement][i][1]);
            if (exists(user)) {
                str = str.replace([matchAllElement][i][0], '@' + user.displayName);
            }
        }
        return mention_replace(str);
    };

    const channel_replace = async (str: string): Promise<string> => {
        const [matchAllElement] = str.matchAll(/<#(\d*)>/g);
        if (notExists(matchAllElement)) return str;
        for (let i = 0; i < [matchAllElement].length; i++) {
            const channel = await message.guild.channels.fetch([matchAllElement][i][1]);
            if (exists(channel)) {
                str = str.replace([matchAllElement][i][0], channel.name);
            }
        }
        return await channel_replace(str);
    };

    const over150_cut = (str: string) => {
        if (str.length > 150) {
            const str150 = str.substr(0, 145) + '以下略';
            return str150;
        } else {
            return str;
        }
    };

    const url_deleted = url_delete(`${message.content}`);
    const emoji_deleted = emoji_delete(url_deleted);
    const w_replaced = w_replace(emoji_deleted);
    const mention_replaced = mention_replace(w_replaced);
    const nickname_replaced = nickname_mention_replace(mention_replaced);
    const role_mention_replaced = role_mention_replace(nickname_replaced);
    const channel_replaced = await channel_replace(role_mention_replaced);

    const yomiage_message = over150_cut(channel_replaced);
    return yomiage_message;
}

export async function setting(interaction: ChatInputCommandInteraction<'cached'>) {
    const { options } = interaction;

    const type = options.getString('音声の種類', true);
    voicePattern1 = type;
    const voiceMessage = `読み上げ音声を${voiceLists1[type]}に設定したでし`;

    await interaction.editReply(voiceMessage);
}
