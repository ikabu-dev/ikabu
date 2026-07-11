import { sendErrorLogs } from '../app/logs/error/send_error_logs.js';

import type { Logger } from 'log4js';

export async function dbCall<T>(logger: Logger, fallback: T, fn: () => Promise<T>): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        await sendErrorLogs(logger, error);
        return fallback;
    }
}
