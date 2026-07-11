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
