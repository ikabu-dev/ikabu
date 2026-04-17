import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    isTransientFetchError,
    retryOnTransientFetchError,
} from '../src/app/common/apis/splatoon3.ink/fetch_error_notification';

describe('splatoon3 fetch error notification', () => {
    beforeEach(() => {
        vi.useRealTimers();
    });

    it('detects transient DNS errors', () => {
        const transientError = Object.assign(new Error('getaddrinfo EAI_AGAIN splatoon3.ink'), {
            code: 'EAI_AGAIN',
        });

        expect(isTransientFetchError(transientError)).toBe(true);
    });

    it('retries transient fetch errors after delay', async () => {
        vi.useFakeTimers();

        const transientError = Object.assign(new Error('getaddrinfo EAI_AGAIN splatoon3.ink'), {
            code: 'EAI_AGAIN',
        });
        const retry = vi.fn().mockResolvedValue('ok');
        const retryPromise = retryOnTransientFetchError({
            error: transientError,
            retry,
            delayMs: 1000,
        });

        expect(retry).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1000);
        await expect(retryPromise).resolves.toBe('ok');
        expect(retry).toHaveBeenCalledTimes(1);
    });

    it('does not retry non-transient errors', async () => {
        const nonTransientError = new Error('unexpected parse error');
        const retry = vi.fn().mockResolvedValue('ok');

        await expect(
            retryOnTransientFetchError({
                error: nonTransientError,
                retry,
                delayMs: 1000,
            }),
        ).rejects.toThrow('unexpected parse error');
        expect(retry).not.toHaveBeenCalled();
    });
});
