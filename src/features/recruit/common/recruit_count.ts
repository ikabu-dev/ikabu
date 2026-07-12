import { RecruitCountService } from '@/infra/db/repositories/recruit_count_service';
import { exists } from '@/shared/assert';

// forEach(async ...) は返り値の Promise を捨てるため、呼び出し元が await しても
// カウントの更新完了が保証されず、例外も拾えない。逐次 await する。
export async function increaseRecruitCount(userIdList: string[]) {
    for (const userId of userIdList) {
        const previousCount = await RecruitCountService.getCountByUserId(userId);
        if (exists(previousCount)) {
            await RecruitCountService.saveRecruitCount(userId, previousCount.recruitCount + 1);
        } else {
            await RecruitCountService.saveRecruitCount(userId, 1);
        }
    }
}

export async function increaseJoinCount(userIdList: string[]) {
    for (const userId of userIdList) {
        const previousCount = await RecruitCountService.getCountByUserId(userId);
        if (exists(previousCount)) {
            await RecruitCountService.saveJoinCount(userId, previousCount.joinCount + 1);
        } else {
            await RecruitCountService.saveJoinCount(userId, 1);
        }
    }
}
