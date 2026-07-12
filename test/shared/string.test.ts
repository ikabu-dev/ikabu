import { describe, expect, it } from 'vitest';

import { isEmpty, isNotEmpty } from '@/shared/string';

describe('string', () => {
    it('空文字を判定する', () => {
        expect(isEmpty('')).toBe(true);
        expect(isNotEmpty(' ')).toBe(true);
    });
});
