import { describe, expect, it } from 'vitest';

import { assertExistCheck, exists, notExists } from '@/shared/assert';

describe('assert', () => {
    it('null と undefined の存在を判定し、存在しない値は例外にする', () => {
        expect(exists(0)).toBe(true);
        expect(exists(null)).toBe(false);
        expect(notExists(undefined)).toBe(true);
        expect(() => assertExistCheck(null, 'id')).toThrow("'id' should be specified.");
        expect(() => assertExistCheck('value')).not.toThrow();
    });
});
