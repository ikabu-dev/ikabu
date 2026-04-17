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
            initialDelayMs: 1000,
            maxRetries: 1,
        });

        expect(retry).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1000);
        await expect(retryPromise).resolves.toBe('ok');
        expect(retry).toHaveBeenCalledTimes(1);
    });

    it('retries with exponential backoff up to maxRetries times', async () => {
        vi.useFakeTimers();

        const temporaryError = Object.assign(new Error('getaddrinfo EAI_AGAIN splatoon3.ink'), {
            code: 'EAI_AGAIN',
        });
        const retry = vi
            .fn()
            .mockRejectedValueOnce(Object.assign(new Error('EAI_AGAIN'), { code: 'EAI_AGAIN' }))
            .mockRejectedValueOnce(Object.assign(new Error('EAI_AGAIN'), { code: 'EAI_AGAIN' }))
            .mockResolvedValue('ok');
        const retryPromise = retryOnTemporaryFetchError({
            error: temporaryError,
            retry,
            initialDelayMs: 1000,
            maxRetries: 3,
        });

        // attempt 0: wait 1000ms
        await vi.advanceTimersByTimeAsync(1000);
        // attempt 1: wait 2000ms
        await vi.advanceTimersByTimeAsync(2000);
        // attempt 2: wait 4000ms
        await vi.advanceTimersByTimeAsync(4000);
        await expect(retryPromise).resolves.toBe('ok');
        expect(retry).toHaveBeenCalledTimes(3);
    });

    it('throws after exhausting all retries', async () => {
        const temporaryError = Object.assign(new Error('getaddrinfo EAI_AGAIN splatoon3.ink'), {
            code: 'EAI_AGAIN',
        });
        const retry = vi
            .fn()
            .mockImplementation(() =>
                Promise.reject(Object.assign(new Error('EAI_AGAIN final'), { code: 'EAI_AGAIN' })),
            );

        await expect(
            retryOnTemporaryFetchError({
                error: temporaryError,
                retry,
                initialDelayMs: 0,
                maxRetries: 2,
            }),
        ).rejects.toThrow('EAI_AGAIN final');
        expect(retry).toHaveBeenCalledTimes(2);
    });

    it('does not retry non-temporary errors', async () => {
        const nonTemporaryError = new Error('unexpected parse error');
        const retry = vi.fn().mockResolvedValue('ok');

        await expect(
            retryOnTemporaryFetchError({
                error: nonTemporaryError,
                retry,
                initialDelayMs: 1000,
            }),
        ).rejects.toThrow('unexpected parse error');
        expect(retry).not.toHaveBeenCalled();
    });
});
