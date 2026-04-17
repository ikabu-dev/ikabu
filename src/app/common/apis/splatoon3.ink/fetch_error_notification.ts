const temporaryFetchErrorCodes = ['EAI_AGAIN', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'] as const;
const DEFAULT_INITIAL_DELAY_MS = 1000 * 60;
const DEFAULT_MAX_RETRIES = 3;

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
    initialDelayMs?: number;
    maxRetries?: number;
};

export async function retryOnTemporaryFetchError<T>({
    error,
    retry,
    initialDelayMs = DEFAULT_INITIAL_DELAY_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
}: RetryOnTemporaryFetchErrorParams<T>) {
    if (!isTemporaryFetchError(error)) {
        throw error;
    }

    let lastError: unknown = error;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        await wait(initialDelayMs * 2 ** attempt);
        try {
            return await retry();
        } catch (e) {
            lastError = e;
            if (!isTemporaryFetchError(e)) throw e;
        }
    }
    throw lastError;
}
