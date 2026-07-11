import { describe, expect, it } from 'vitest';

import { dateformat, formatDatetime } from '@/shared/datetime/convert_datetime';

describe('formatDatetime', () => {
    it('UTC時刻を日本時間・日本語曜日で整形する', () => {
        expect(formatDatetime('2024-01-01T00:00:00.000Z', dateformat.ymdwhm)).toBe(
            '2024/1/1(月) 9:00',
        );
        expect(formatDatetime('2024-01-01T00:00:00.000Z', dateformat.hm)).toBe('9:00');
    });
});
