import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    isTemporaryFetchError,
    withTemporaryFetchRetry,
} from '../src/app/common/fetch_retry';

// テスト用に短い待機時間を使用
const ONE_SECOND_MS = 1000;

// EAI_AGAIN コードを持つ一時的エラーを生成
function createTemporaryError(message = 'EAI_AGAIN') {
    return Object.assign(new Error(message), { code: 'EAI_AGAIN' });
}

describe('splatoon3 fetch error notification', () => {
    beforeEach(() => {
        vi.useRealTimers();
    });

    it('一時的なDNSエラーを検出する', () => {
        const error = Object.assign(new Error('getaddrinfo EAI_AGAIN splatoon3.ink'), {
            code: 'EAI_AGAIN',
        });

        expect(isTemporaryFetchError(error)).toBe(true);
    });

    it('初回成功時はリトライなしで結果を返す', async () => {
        const fn = vi.fn().mockResolvedValue('ok');

        await expect(withTemporaryFetchRetry(fn)).resolves.toBe('ok');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('一時的なfetchエラーはexponential backoffでリトライする', async () => {
        vi.useFakeTimers();
        // Arrange: 2回失敗、3回目で成功するモック
        const fn = vi
            .fn()
            .mockRejectedValueOnce(createTemporaryError())
            .mockRejectedValueOnce(createTemporaryError())
            .mockResolvedValue('ok');

        // Act: リトライ戦略を起動
        // ※ Promiseをawaitせず変数に保持し、仮想時間を進めながら非同期処理を進める
        const retryPromise = withTemporaryFetchRetry(fn, {
            initialDelayMs: ONE_SECOND_MS,
            maxRetries: 3,
        });

        // 1回目失敗後の待機: initialDelayMs * 2^0 = 1秒
        await vi.advanceTimersByTimeAsync(ONE_SECOND_MS);
        // 2回目失敗後の待機: initialDelayMs * 2^1 = 2秒
        await vi.advanceTimersByTimeAsync(ONE_SECOND_MS * 2);

        // Assert: 3回呼ばれて最終的に成功
        await expect(retryPromise).resolves.toBe('ok');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('全リトライ失敗時は最後のエラーをthrowする', async () => {
        // Arrange: 毎回新しいPromiseを返して常に失敗するモック
        // ※ mockRejectedValue は同一Promiseを再利用し unhandled rejection が発生するため
        //    mockImplementation で毎回新しいPromiseを生成する
        const fn = vi
            .fn()
            .mockImplementation(() => Promise.reject(createTemporaryError('EAI_AGAIN final')));

        // Act & Assert: 初回+2回リトライ = 計3回呼ばれてエラー
        await expect(
            withTemporaryFetchRetry(fn, {
                initialDelayMs: 0,
                maxRetries: 2,
            }),
        ).rejects.toThrow('EAI_AGAIN final');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('一時的でないエラーはリトライせずそのままthrowする', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('予期しないパースエラー'));

        // 一時的エラーではないためリトライせず即エラー
        await expect(
            withTemporaryFetchRetry(fn, { initialDelayMs: ONE_SECOND_MS, maxRetries: 3 }),
        ).rejects.toThrow('予期しないパースエラー');
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
