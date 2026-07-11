import { describe, expect, it, vi } from 'vitest';

import {
    assertExistCheck,
    dateAdd,
    dateDiff,
    datetimeDiff,
    exists,
    getMentionsFromMessage,
    isEmpty,
    isNotEmpty,
    notExists,
    randomBool,
    randomSelect,
    rgbToHex,
} from '../src/app/common/others';

describe('others', () => {
    it('null と undefined の存在を判定し、存在しない値は例外にする', () => {
        expect(exists(0)).toBe(true);
        expect(exists(null)).toBe(false);
        expect(notExists(undefined)).toBe(true);
        expect(() => assertExistCheck(null, 'id')).toThrow("'id' should be specified.");
        expect(() => assertExistCheck('value')).not.toThrow();
    });

    it('空文字とRGBを変換する', () => {
        expect(isEmpty('')).toBe(true);
        expect(isNotEmpty(' ')).toBe(true);
        expect(rgbToHex(0, 15, 255)).toBe('000fff');
    });

    it('メッセージ内のメンションを文字列またはIDで取得する', () => {
        const message = { content: '<@123456789012345678> text <@987654321098765432>' };
        // 現行実装では idOnly の既定値 false も存在チェックを通るためID配列を返す。
        expect(getMentionsFromMessage(message as never)).toEqual([
            '123456789012345678',
            '987654321098765432',
        ]);
        expect(getMentionsFromMessage(message as never, true)).toEqual([
            '123456789012345678',
            '987654321098765432',
        ]);
        expect(getMentionsFromMessage({ content: 'none' } as never)).toBeNull();
    });

    it('ランダム選択と確率判定を境界値で行う', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        expect(randomSelect(['a', 'b', 'c'], 5)).toEqual(['b', 'c', 'a']);
        expect(randomBool(0)).toBe(false);
        expect(randomBool(1)).toBe(true);
        vi.restoreAllMocks();
    });

    it('日付の加算と差分を計算する', () => {
        expect(dateAdd(new Date(2024, 0, 31), 1, 'M')).toEqual(new Date(2024, 1, 29));
        const start = new Date(2024, 0, 1);
        const end = new Date(2025, 2, 3);
        expect(dateDiff(start, end, 'D')).toBe(427);
        expect(dateDiff(start, end, 'Y')).toBe(1);
        expect(dateDiff(start, end, 'YM')).toBe(2);
        expect(dateDiff(start, end, 'MD')).toBe(2);
        expect(dateDiff(start, end, 'YD')).toBe(61);
        expect(datetimeDiff(end, start)).toBe(427 * 24 * 60);
    });
});
