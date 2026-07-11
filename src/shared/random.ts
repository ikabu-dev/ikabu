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
