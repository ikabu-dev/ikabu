import { RecruitType } from '../../../../db/recruit_service';
import {
    checkFes,
    checkBigRun,
    checkTeamContest,
    getEventData,
    inFallbackMode,
} from '../../../common/apis/splatoon3.ink/splatoon3_ink';
import { Sp3Schedule } from '../../../common/apis/splatoon3.ink/types/schedule';
import { notExists } from '../../../common/others';
import { RecruitAlertTexts } from '../../alert_texts/alert_texts';
import { getFestPeriodAlertText } from '../../alert_texts/schedule_related_alerts';

type checkRecruitScheduleResponse = {
    canRecruit: boolean;
    recruitDateErrorMessage: string;
};

export async function checkRecruitSchedule(
    guildId: string,
    schedule: Sp3Schedule,
    type: number,
    recruitType: RecruitType,
): Promise<checkRecruitScheduleResponse> {
    switch (recruitType) {
        case RecruitType.FestivalRecruit:
            if (!checkFes(schedule, type) && !inFallbackMode) {
                // フェス期間外にフェス募集を建てようとした場合
                return {
                    canRecruit: false,
                    recruitDateErrorMessage: RecruitAlertTexts.NotDuringFest,
                };
            }
            break;

        case RecruitType.RegularRecruit:
        case RecruitType.AnarchyRecruit:
            if (checkFes(schedule, type) && !inFallbackMode) {
                // フェス期間中にナワバリ募集またはバンカラ募集を建てようとした場合
                return {
                    canRecruit: false,
                    recruitDateErrorMessage: await getFestPeriodAlertText(guildId),
                };
            }
            break;

        case RecruitType.EventRecruit:
            if (notExists(await getEventData(schedule)) && !inFallbackMode) {
                return {
                    canRecruit: false,
                    recruitDateErrorMessage: RecruitAlertTexts.NotDuringEvent,
                };
            }
            break;
        case RecruitType.SalmonRecruit:
        case RecruitType.BigRunRecruit:
        case RecruitType.TeamContestRecruit:
            return await checkSalmonGroupCondtion(schedule, type, recruitType);
        default:
            break;
    }
    return { canRecruit: true, recruitDateErrorMessage: '' };
}

async function checkSalmonGroupCondtion(
    schedule: Sp3Schedule,
    type: number,
    recruitType: RecruitType,
) {
    const isDuringBigRun = checkBigRun(schedule, type);
    const isDuringTeamContest = checkTeamContest(schedule, type);

    switch (recruitType) {
        case RecruitType.SalmonRecruit:
            if (isDuringBigRun) {
                // ビッグラン期間中に通常のサーモン募集を建てようとした場合
                return {
                    canRecruit: false,
                    recruitDateErrorMessage: RecruitAlertTexts.DuringBigRun,
                };
            } else if (isDuringTeamContest) {
                // チームコンテスト期間中に通常のサーモン募集を建てようとした場合
                return {
                    canRecruit: false,
                    recruitDateErrorMessage: RecruitAlertTexts.DuringTeamContest,
                };
            }
            break;
        case RecruitType.BigRunRecruit:
            if (!isDuringBigRun && !isDuringTeamContest) {
                // ビッグラン期間外にビッグラン募集を建てようとした場合
                return {
                    canRecruit: false,
                    recruitDateErrorMessage:
                        RecruitAlertTexts.NotDuringBigRun + '\n' + RecruitAlertTexts.UseRunCommand,
                };
            } else if (!isDuringBigRun && isDuringTeamContest) {
                // チームコンテスト期間中にビッグラン募集を建てようとした場合
                return {
                    canRecruit: false,
                    recruitDateErrorMessage: RecruitAlertTexts.DuringTeamContest,
                };
            }
            break;
        case RecruitType.TeamContestRecruit:
            if (!isDuringTeamContest && !isDuringBigRun) {
                // チームコンテスト期間外にチームコンテスト募集を建てようとした場合
                return {
                    canRecruit: false,
                    recruitDateErrorMessage:
                        RecruitAlertTexts.NotDuringTeamContest +
                        '\n' +
                        RecruitAlertTexts.UseRunCommand,
                };
            } else if (!isDuringTeamContest && isDuringBigRun) {
                // ビッグラン期間中にチームコンテスト募集を建てようとした場合
                return {
                    canRecruit: false,
                    recruitDateErrorMessage: RecruitAlertTexts.DuringBigRun,
                };
            }
            break;
        default:
            break;
    }
    return { canRecruit: true, recruitDateErrorMessage: '' };
}
