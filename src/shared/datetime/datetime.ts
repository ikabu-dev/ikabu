/**
 * 対象の日付が対象期間中かどうかチェックする
 * @param date 対象の日付
 * @param startDate 対象期間開始日
 * @param endDate 対象期間終了日
 * @returns 期間内であればtrue, 期間外ならfalseを返す
 */
export function isDateWithinRange(date: Date, startDate: Date, endDate: Date) {
    if (date.getTime() - startDate.getTime() < 0) {
        return false;
    } else if (endDate.getTime() - date.getTime() < 0) {
        return false;
    } else {
        return true;
    }
}
