import { exists, notExists } from '../assert';

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
