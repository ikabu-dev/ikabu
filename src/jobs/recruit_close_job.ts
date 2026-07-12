import cron from 'cron';
import { Client } from 'discord.js';

import { recruitAutoClose } from '@/features/recruit/interactions/close_recruit/auto_close';
import { RecruitService } from '@/infra/db/repositories/recruit_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';

const logger = log4js_obj.getLogger('recruit');

/**
 * 期限切れの募集を〆る。
 *
 * 自動締切は2時間後という粒度の処理なので、1分間隔のスキャンで十分。
 */
export function startRecruitCloseJob(client: Client) {
    // 第4引数の true で生成と同時に開始する
    let isRunning = false;

    new cron.CronJob(
        '* * * * *',
        async () => {
            if (isRunning) return;
            isRunning = true;

            try {
                await closeExpiredRecruits(client);
            } catch (error) {
                await sendErrorLogs(logger, error);
            } finally {
                isRunning = false;
            }
        },
        null,
        true,
        'Asia/Tokyo',
    );
}

export async function closeExpiredRecruits(client: Client) {
    if (!client.isReady()) return;

    const expiredRecruits = await RecruitService.getRecruitsToClose(new Date());

    for (const recruit of expiredRecruits) {
        // Bot が抜けたサーバーの募集は、毎分リトライして失敗し続けるだけなので触らない
        const guild = client.guilds.cache.get(recruit.guildId);
        if (guild === undefined) continue;

        try {
            await recruitAutoClose(guild, recruit);
            logger.info(`recruit[${recruit.messageId}] has been closed automatically.`);
        } catch (error) {
            await sendErrorLogs(logger, error);
        }
    }
}
