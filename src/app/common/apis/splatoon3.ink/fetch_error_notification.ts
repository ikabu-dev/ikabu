const transientFetchErrorCodes = ['EAI_AGAIN', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'] as const;
const transientFetchRetryDelayMs = 1000 * 60 * 3;

type FetchErrorWithCode = Error & { code?: string; errno?: string };

export function isTransientFetchError(error: unknown) {
    if (!(error instanceof Error)) return false;

    const fetchError = error as FetchErrorWithCode;
    const errorCode = fetchError.code ?? fetchError.errno;
    if (
        typeof errorCode === 'string' &&
        transientFetchErrorCodes.includes(errorCode as (typeof transientFetchErrorCodes)[number])
    ) {
        return true;
    }

    const lowerMessage = error.message.toLowerCase();
    return lowerMessage.includes('eai_again') || lowerMessage.includes('getaddrinfo');
}

function wait(delayMs: number) {
    return new Promise((resolve) => setTimeout(resolve, delayMs));
}

type RetryOnTransientFetchErrorParams<T> = {
    error: unknown;
    retry: () => Promise<T>;
    delayMs?: number;
};

export async function retryOnTransientFetchError<T>({
    error,
    retry,
    delayMs = transientFetchRetryDelayMs,
}: RetryOnTransientFetchErrorParams<T>) {
    if (!isTransientFetchError(error)) {
        throw error;
    }

    await wait(delayMs);
    return await retry();
}
