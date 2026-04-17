const temporaryFetchErrorCodes = ['EAI_AGAIN', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'] as const;
const temporaryFetchRetryDelayMs = 1000 * 60 * 3;

type FetchErrorWithCode = Error & { code?: string; errno?: string };

export function isTemporaryFetchError(error: unknown) {
    if (!(error instanceof Error)) return false;

    const fetchError = error as FetchErrorWithCode;
    const errorCode = fetchError.code ?? fetchError.errno;
    if (
        typeof errorCode === 'string' &&
        temporaryFetchErrorCodes.includes(errorCode as (typeof temporaryFetchErrorCodes)[number])
    ) {
        return true;
    }

    const lowerMessage = error.message.toLowerCase();
    return lowerMessage.includes('eai_again') || lowerMessage.includes('getaddrinfo');
}

function wait(delayMs: number) {
    return new Promise((resolve) => setTimeout(resolve, delayMs));
}

type RetryOnTemporaryFetchErrorParams<T> = {
    error: unknown;
    retry: () => Promise<T>;
    delayMs?: number;
};

export async function retryOnTemporaryFetchError<T>({
    error,
    retry,
    delayMs = temporaryFetchRetryDelayMs,
}: RetryOnTemporaryFetchErrorParams<T>) {
    if (!isTemporaryFetchError(error)) {
        throw error;
    }

    await wait(delayMs);
    return await retry();
}
