import cron from 'cron';
import { Client } from 'discord.js';

import { RECRUIT_CLOSE_SCAN_LIMIT } from '@/config/constants/recruit';
import { recruitAutoClose } from '@/features/recruit/interactions/close_recruit/auto_close';
import { ParticipantService } from '@/infra/db/repositories/participant_service';
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

    const { recruits: expiredRecruits, ttlScanCapped } = await RecruitService.getRecruitsToClose(
        new Date(),
    );

    if (ttlScanCapped) {
        // 黙って切り捨てない。溢れた分は次の tick で拾う
        logger.info(
            `TTL scan limit reached. closing up to ${RECRUIT_CLOSE_SCAN_LIMIT} TTL-expired recruits in this tick.`,
        );
    }

    for (const recruit of expiredRecruits) {
        const guild = client.guilds.cache.get(recruit.guildId);

        // Bot が抜けたサーバーでは Discord 側を掃除しようがないので、DB の行だけ消す。
        // 残すと closeAt が過去のまま毎分スキャンに載り続ける。
        if (guild === undefined) {
            try {
                await RecruitService.deleteRecruit(recruit.guildId, recruit.messageId);
                await ParticipantService.deleteAllParticipant(recruit.guildId, recruit.messageId);
                logger.info(`recruit[${recruit.messageId}] has been deleted. [bot has left]`);
            } catch (error) {
                await sendErrorLogs(logger, error);
            }
            continue;
        }

        try {
            await recruitAutoClose(guild, recruit);
            logger.info(`recruit[${recruit.messageId}] has been closed automatically.`);
        } catch (error) {
            await sendErrorLogs(logger, error);
        }
    }
}
