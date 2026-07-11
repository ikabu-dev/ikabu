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
