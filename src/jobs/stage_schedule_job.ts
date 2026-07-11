import cron from 'cron';
import { Client } from 'discord.js';

import { env } from '@/config/env';
import { subscribeSplatEventMatch } from '@/features/stage_info/event_match_register';
import { stageInfo } from '@/features/stage_info/stageinfo';
import { inFallbackMode } from '@/infra/external/splatoon3-ink/splatoon3_ink';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';

const logger = log4js_obj.getLogger();

/**
 * スプラトゥーンのスケジュール更新に合わせて2時間毎に実行する。
 */
export function startStageScheduleJob(client: Client) {
    // 第4引数の true で生成と同時に開始する
    new cron.CronJob(
        '1 1-23/2 * * *',
        async () => {
            logger.info('cron job started');

            try {
                const guild = await client.guilds.fetch(env.serverId || '');

                if (!inFallbackMode) {
                    // イベントマッチのイベント作成
                    await subscribeSplatEventMatch(guild);
                }
                // ステージ情報の送信
                await stageInfo(guild);
            } catch (error) {
                await sendErrorLogs(logger, 'schedule job failed: \n' + error);
            }

            logger.info('cron job finished');
        },
        null,
        true,
        'Asia/Tokyo',
    );
}
