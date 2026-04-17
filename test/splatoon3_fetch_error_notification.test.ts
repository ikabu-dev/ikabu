import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    isTemporaryFetchError,
    retryOnTemporaryFetchError,
} from '../src/app/common/apis/splatoon3.ink/fetch_error_notification';

describe('splatoon3 fetch error notification', () => {
    beforeEach(() => {
        vi.useRealTimers();
    });

    it('detects temporary DNS errors', () => {
        const temporaryError = Object.assign(new Error('getaddrinfo EAI_AGAIN splatoon3.ink'), {
            code: 'EAI_AGAIN',
        });

        expect(isTemporaryFetchError(temporaryError)).toBe(true);
    });

    it('retries temporary fetch errors after delay', async () => {
        vi.useFakeTimers();

        const temporaryError = Object.assign(new Error('getaddrinfo EAI_AGAIN splatoon3.ink'), {
            code: 'EAI_AGAIN',
        });
        const retry = vi.fn().mockResolvedValue('ok');
        const retryPromise = retryOnTemporaryFetchError({
            error: temporaryError,
            retry,
            delayMs: 1000,
        });

        expect(retry).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1000);
        await expect(retryPromise).resolves.toBe('ok');
        expect(retry).toHaveBeenCalledTimes(1);
    });

    it('does not retry non-temporary errors', async () => {
        const nonTemporaryError = new Error('unexpected parse error');
        const retry = vi.fn().mockResolvedValue('ok');

        await expect(
            retryOnTemporaryFetchError({
                error: nonTemporaryError,
                retry,
                delayMs: 1000,
            }),
        ).rejects.toThrow('unexpected parse error');
        expect(retry).not.toHaveBeenCalled();
    });
});
