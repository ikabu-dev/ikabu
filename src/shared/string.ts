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
