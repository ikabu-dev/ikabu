import { describe, expect, it, vi } from 'vitest';

import { randomBool, randomSelect } from '@/shared/random';

describe('random', () => {
    it('ランダム選択と確率判定を境界値で行う', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        expect(randomSelect(['a', 'b', 'c'], 5)).toEqual(['b', 'c', 'a']);
        expect(randomBool(0)).toBe(false);
        expect(randomBool(1)).toBe(true);
        vi.restoreAllMocks();
    });
});
