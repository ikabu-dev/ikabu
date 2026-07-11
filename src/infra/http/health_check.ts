import http from 'http';

import { env } from '@/config/env';
import { client } from '@/infra/discord/client';
import { log4js_obj } from '@/infra/logging/log4js';

const logger = log4js_obj.getLogger();

/**
 * 死活監視(Uptime Robot)用のエンドポイント。
 *
 * Discord への接続が生きているかを実際に見て返す。
 * 以前は常に 200 を返していたため、Bot が Discord から切断されていても
 * 監視側は正常と判断してしまっていた。
 */
export function startHealthCheckServer() {
    // env.port は文字列なので明示的に数値へ変換する
    // (Node は数値文字列もポートとして解釈するが、型が string | number のままだと紛らわしい)
    const port = env.port ? Number(env.port) : 3000;

    http.createServer((_request, response) => {
        if (client.isReady()) {
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.end('Discord bot is active now \n');
        } else {
            response.writeHead(503, { 'Content-Type': 'text/plain' });
            response.end('Discord bot is not connected \n');
        }
    }).listen(port);

    logger.info(`health check server listening on port ${port}`);
}
