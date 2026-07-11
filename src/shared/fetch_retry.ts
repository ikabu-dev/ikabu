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

type WithTemporaryFetchRetryOptions = {
    initialDelayMs?: number;
    maxRetries?: number;
};

export async function withTemporaryFetchRetry<T>(
    fn: () => Promise<T>,
    {
        initialDelayMs = DEFAULT_INITIAL_DELAY_MS,
        maxRetries = DEFAULT_MAX_RETRIES,
    }: WithTemporaryFetchRetryOptions = {},
): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (e) {
            lastError = e;
            if (!isTemporaryFetchError(e)) throw e;
            if (attempt >= maxRetries) break;
            await wait(initialDelayMs * 2 ** attempt);
        }
    }
    throw lastError;
}
