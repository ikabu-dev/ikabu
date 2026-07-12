import { describe, expect, it } from 'vitest';

import { dateAdd, dateDiff, datetimeDiff } from '@/shared/datetime/date_calc';

describe('date_calc', () => {
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
