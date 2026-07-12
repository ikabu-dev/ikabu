import { describe, expect, it } from 'vitest';

import { rgbToHex } from '@/shared/color';

describe('color', () => {
    it('RGB値を16進数文字列に変換する', () => {
        expect(rgbToHex(0, 15, 255)).toBe('000fff');
    });
});
