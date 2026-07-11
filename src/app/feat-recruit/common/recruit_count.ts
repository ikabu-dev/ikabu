import { exists } from '@/app/common/others';
import { RecruitCountService } from '@/db/recruit_count_service';

export async function increaseRecruitCount(userIdList: string[]) {
    userIdList.forEach(async (userId) => {
        const previousCount = await RecruitCountService.getCountByUserId(userId);
        if (exists(previousCount)) {
            await RecruitCountService.saveRecruitCount(userId, previousCount.recruitCount + 1);
        } else {
            await RecruitCountService.saveRecruitCount(userId, 1);
        }
    });
}

export async function increaseJoinCount(userIdList: string[]) {
    userIdList.forEach(async (userId) => {
        const previousCount = await RecruitCountService.getCountByUserId(userId);
        if (exists(previousCount)) {
            await RecruitCountService.saveJoinCount(userId, previousCount.joinCount + 1);
        } else {
            await RecruitCountService.saveJoinCount(userId, 1);
        }
    });
}
