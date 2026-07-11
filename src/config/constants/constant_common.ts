// オブジェクトリテラルを列挙型として扱うための型
export type ObjectValueList<T extends Record<string | number | symbol, unknown>> = T[keyof T];
