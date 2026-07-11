import { Attachment, EmbedBuilder, Guild, Message } from 'discord.js';

import { searchAPIMemberById } from './manager/member_manager.js';
import { placeHold } from '../../constant.js';
import { UniqueChannelService } from '../../db/unique_channel_service.js';
import { UniqueRoleService } from '../../db/unique_role_service.js';
import { ChannelKeySet } from '../constant/channel_key.js';
import { RoleKeySet } from '../constant/role_key.js';

export async function getDeveloperMention(guildId: string) {
    const developerRoleId = await UniqueRoleService.getRoleIdByKey(
        guildId,
        RoleKeySet.Developer.key,
    );
    if (exists(developerRoleId)) {
        return `<@&${developerRoleId}>`;
    } else {
        return '開発者ロールが設定されていないでし！\nサポートセンターまでお問い合わせくださいでし！\n';
    }
}

export async function composeEmbed(message: Message<true>, url: string) {
    const embed = new EmbedBuilder();
    if (exists(message.content) && isNotEmpty(message.content)) {
        embed.setDescription(message.content);
    }
    embed.setTimestamp(message.createdAt);
    // webhookの場合はauthorがないので、getAPIMemberは使用しない
    const member = await searchAPIMemberById(message.guild, message.author.id);
    if (exists(url)) {
        embed.setTitle('引用元へジャンプ');
        embed.setURL(url);
    }
    if (exists(member)) {
        embed.setAuthor({
            name: member.displayName,
            iconURL: member.displayAvatarURL(),
        });
    } else {
        embed.setAuthor({
            name: '不明なユーザー',
            iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png',
        });
    }
    embed.setFooter({
        text: message.channel.name,
        iconURL: message.guild.iconURL() ?? placeHold.error100x100,
    });
    if (message.attachments.size > 0) {
        message.attachments.forEach((attachment: Attachment) => {
            embed.setImage(attachment.proxyURL);
        });
    }
    return embed;
}

export function rgbToHex(r: number, g: number, b: number) {
    return [r, g, b]
        .map((x) => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        })
        .join('');
}

/**
 * 空文字チェック
 * @param str 文字列
 */
export function isEmpty(str: string) {
    return str === '';
}

/**
 * 空文字でないことをチェック
 * @param str 文字列
 */
export function isNotEmpty(str: string) {
    return !isEmpty(str);
}

/**
 * null, undefined のチェック
 * @param value チェックする値
 * @returns 値があれば true, なければ false を返す
 */
export function exists<Type>(value: Type | null | undefined): value is Type {
    return value !== null && value !== undefined;
}

/**
 * null, undefined のチェック
 * @param value チェックする値
 * @returns 値があれば false, なければ true を返す
 */
export function notExists<Type>(value: Type | null | undefined): value is null | undefined {
    return !exists(value);
}

/**
 * null, undefined のチェック, null or undefinedの場合例外を投げる
 * @param value チェックする値
 * @param target エラーに表示する変数名
 */
export function assertExistCheck<Type>(
    value: Type | null | undefined,
    target = 'value',
): asserts value is Type {
    if (notExists(value)) {
        throw new Error(`'${target}' should be specified.`);
    }
}

// オブジェクト型でどれか一つのプロパティを必須にする
export type RequireOne<T, K extends keyof T = keyof T> = K extends keyof T
    ? PartialRequire<T, K>
    : never;
type PartialRequire<O, K extends keyof O> = {
    [P in K]-?: O[P];
} & O;

/**
 * 型をマージする
 * Ex. Merge<Type1 & Type2>
 */
export type Merge<T> = {
    [K in keyof T]: T[K];
};

/**
 * メッセージから順番に取得したメンションを配列で返す
 * @param message メッセージ
 * @param idOnly 取得したメンションをIDで返す場合はtrue
 * @returns メンション文字列を格納した配列を返す
 */
export function getMentionsFromMessage(message: Message<true>, idOnly = false) {
    const content = message.content;
    const matched = content.match(/<@\d{18,19}>/g);
    const results = [];
    if (exists(idOnly) && exists(matched)) {
        for (const mention of matched) {
            const delete_lead = mention.slice(2); // remove <@
            const delete_backward = delete_lead.slice(0, -1); // remove >
            results.push(delete_backward);
        }
        return results;
    }
    return matched;
}

export function randomSelect<T>(array: T[], num: number) {
    const a = array;
    const t: (T | undefined)[] = [];
    const r: T[] = [];
    let l = a.length;
    let n = num < l ? num : l;
    while (n-- > 0) {
        const i = (Math.random() * l) | 0;
        r[n] = t[i] || a[i];
        --l;
        t[i] = t[l] || a[l];
    }
    return r;
}

/**
 * 指定した確率でtrueを返し、それ以外はfalseを返す
 * @param probability 確率(割合)
 * @returns boolean
 */
export function randomBool(probability: number) {
    const num = Math.random();
    if (num < probability) {
        return true;
    } else {
        return false;
    }
}

/*
 *  日数または月数を加算
 *
 *  dt: 基準となる Date オブジェクト
 *  dd: 日数または月数
 *   u: 'D': dd は日数
 *      'M': dd は月数
 *
 */
export function dateAdd(dt: Date, dd: number, u?: 'D' | 'M') {
    let y = dt.getFullYear();
    let m = dt.getMonth();
    const d = dt.getDate();
    const r = new Date(y, m, d);
    if (notExists(u) || u === 'D') {
        r.setDate(d + dd);
    } else if (u === 'M') {
        m += dd;
        y += m / 12;
        m %= 12;
        const e = new Date(y, m + 1, 0).getDate();
        r.setFullYear(y, m, d > e ? e : d);
    }
    return r;
}

export async function sleep(sec: number) {
    return new Promise((resolve) => setTimeout(resolve, sec * 1000));
}

/*
 *  経過年・月・日数の計算
 *
 *  date1: 開始年月日の Date オブジェクト
 *  date2: 終了年月日の Date オブジェクト
 *    u:  'Y': 経過年数を求める
 *        'M': 経過月数を求める
 *        'D': 経過日数を求める
 *       'YM': 1年に満たない月数
 *       'MD': 1ヶ月に満たない日数
 *       'YD': 1年に満たない日数
 *    f: true: 初日算入
 *      false: 初日不算入
 *
 */
export function dateDiff(
    date1: Date,
    date2?: Date,
    u?: 'Y' | 'M' | 'D' | 'YM' | 'MD' | 'YD',
    f?: boolean,
) {
    if (notExists(date2)) date2 = new Date();
    if (exists(f)) date1 = dateAdd(date1, -1, 'D');
    const y1 = date1.getFullYear();
    const m1 = date1.getMonth();
    const y2 = date2.getFullYear();
    const m2 = date2.getMonth();
    let dt3,
        r = 0;
    if (notExists(u) || u == 'D') {
        r = Math.floor((Number(date2) - Number(date1)) / (24 * 3600 * 1000));
    } else if (u === 'M') {
        r = y2 * 12 + m2 - (y1 * 12 + m1);
        dt3 = dateAdd(date1, r, 'M');
        if (dateDiff(dt3, date2, 'D') < 0) --r;
    } else if (u === 'Y') {
        r = Math.floor(dateDiff(date1, date2, 'M') / 12);
    } else if (u === 'YM') {
        r = dateDiff(date1, date2, 'M') % 12;
    } else if (u === 'MD') {
        r = dateDiff(date1, date2, 'M');
        dt3 = dateAdd(date1, r, 'M');
        r = dateDiff(dt3, date2, 'D');
    } else if (u === 'YD') {
        r = dateDiff(date1, date2, 'Y');
        dt3 = dateAdd(date1, r * 12, 'M');
        r = dateDiff(dt3, date2, 'D');
    }
    return r;
}
/*
 *  経過時間（分）の計算
 */
export function datetimeDiff(date1: Date, date2: Date) {
    const diff = date2.getTime() - date1.getTime();
    const diffMinutes = Math.abs(diff) / (60 * 1000);
    return diffMinutes;
}

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
    レイダース募集: '`/レイダース募集 recruit`',
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

export function rule2image(rule: string | undefined | null) {
    if (notExists(rule)) {
        return placeHold.error100x100;
    }

    switch (rule) {
        case 'ガチエリア':
            return 'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/splat_zones_icon.png';
        case 'ガチヤグラ':
            return 'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/tower_control_icon.png';
        case 'ガチホコバトル':
            return 'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/rainmaker_icon.png';
        case 'ガチアサリ':
            return 'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/clam_blitz_icon.png';
        default:
            return placeHold.error100x100;
    }
}
