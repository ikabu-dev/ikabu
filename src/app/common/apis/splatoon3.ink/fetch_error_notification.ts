const transientFetchErrorCodes = ['EAI_AGAIN', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'] as const;
const fetchErrorNotificationCooldownMs = 1000 * 60 * 30;
let lastTransientFetchErrorNotifiedAt = 0;

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

export function shouldNotifyFetchError(error: unknown) {
    if (!isTransientFetchError(error)) return true;

    const now = Date.now();
    if (now - lastTransientFetchErrorNotifiedAt >= fetchErrorNotificationCooldownMs) {
        lastTransientFetchErrorNotifiedAt = now;
        return true;
    }

    return false;
}
