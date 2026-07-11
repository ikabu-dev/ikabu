import { notExists } from '@/app/common/others';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { log4js_obj } from '@/log4js_settings';

import { updateLocale } from './schedule_fetcher';
import { Sp3Locale } from './types/locale';

const logger = log4js_obj.getLogger();
const undefinedText = 'そーりー・あんでふぁいんど';

async function localeText(
    locale: Sp3Locale,
    id: string,
    key: 'stages' | 'rules',
    fetch: boolean,
): Promise<string> {
    try {
        const values = locale[key];
        if (notExists(values[id])) {
            return fetch ? localeText(await updateLocale(), id, key, false) : undefinedText;
        }
        return values[id].name;
    } catch (error) {
        await sendErrorLogs(logger, error);
        return undefinedText;
    }
}

export const stage2txt = (locale: Sp3Locale, id: string, fetch = true) =>
    localeText(locale, id, 'stages', fetch);
export const rule2txt = (locale: Sp3Locale, id: string, fetch = true) =>
    localeText(locale, id, 'rules', fetch);

export async function event2txt(
    locale: Sp3Locale,
    id: string,
    fetch = true,
): Promise<{ title: string; description: string; regulation: string }> {
    const result = { title: undefinedText, description: undefinedText, regulation: undefinedText };
    try {
        if (notExists(locale.events[id]))
            return fetch ? event2txt(await updateLocale(), id, false) : result;
        return {
            title: locale.events[id].name,
            description: locale.events[id].desc,
            regulation: locale.events[id].regulation,
        };
    } catch (error) {
        await sendErrorLogs(logger, error);
        return result;
    }
}
