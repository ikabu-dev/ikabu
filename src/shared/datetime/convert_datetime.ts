import format from 'date-fns/format';
import ja from 'date-fns/locale/ja';
import { formatInTimeZone } from 'date-fns-tz';
export const dateformat = {
    ymdwhm: 'yyyy/M/d(E) H:mm',
    ymdw: 'yyyy/M/d(E)',
    mdwhm: 'M/d(E) H:mm',
    hm: 'H:mm',
};

export function formatDatetime(datetime: string | number | Date, formatString: string) {
    const timezone = formatInTimeZone(datetime, 'Asia/Tokyo', dateformat.ymdwhm);
    const locale = format(new Date(timezone), formatString, { locale: ja });
    return locale;
}
