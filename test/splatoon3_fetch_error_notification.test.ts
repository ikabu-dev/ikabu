import { describe, expect, it, vi } from 'vitest';

import {
    isTransientFetchError,
    shouldNotifyFetchError,
} from '../src/app/common/apis/splatoon3.ink/fetch_error_notification';

describe('splatoon3 fetch error notification', () => {
    it('detects transient DNS errors', () => {
        const transientError = Object.assign(new Error('getaddrinfo EAI_AGAIN splatoon3.ink'), {
            code: 'EAI_AGAIN',
        });

        expect(isTransientFetchError(transientError)).toBe(true);
    });

    it('throttles transient fetch error notifications', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

        const transientError = Object.assign(new Error('getaddrinfo EAI_AGAIN splatoon3.ink'), {
            code: 'EAI_AGAIN',
        });

        expect(shouldNotifyFetchError(transientError)).toBe(true);
        expect(shouldNotifyFetchError(transientError)).toBe(false);

        vi.setSystemTime(new Date('2026-01-01T00:30:01Z'));
        expect(shouldNotifyFetchError(transientError)).toBe(true);

        vi.useRealTimers();
    });

    it('does not throttle non-transient errors', () => {
        const nonTransientError = new Error('unexpected parse error');

        expect(shouldNotifyFetchError(nonTransientError)).toBe(true);
        expect(shouldNotifyFetchError(nonTransientError)).toBe(true);
    });
});
