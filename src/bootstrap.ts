import { env, validateEnv } from '@/config/env';
import { registerDiscordEvents } from '@/gateway/events';
import { client } from '@/infra/discord/client';
import { startHealthCheckServer } from '@/infra/http/health_check';
import { log4js_obj } from '@/infra/logging/log4js';
import { startStageScheduleJob } from '@/jobs/stage_schedule_job';

const logger = log4js_obj.getLogger();

/**
 * 起動シーケンス。
 *
 * 以前は app/index.ts の import 副作用として login やイベント登録が走っていたため、
 * 「何がどの順で起きるのか」がコードから読めなかった。ここに一本化する。
 */
export async function bootstrap() {
    // 1. 設定が揃っているかを最初に確認する(欠けていればここで落ちる)
    validateEnv();

    // 2. Discord のイベントと機能を結びつける(login 前に済ませる)
    registerDiscordEvents(client);

    // 3. 定期実行ジョブを登録する
    startStageScheduleJob(client);

    // 4. 死活監視のエンドポイントを立てる
    startHealthCheckServer();

    // 5. Discord に接続する。以降 clientReady が発火して初期化が走る
    await client.login(env.discordBotToken);

    logger.info('bootstrap finished');
}
