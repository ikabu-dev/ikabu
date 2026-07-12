import { Logger } from 'log4js';

import { validateEnv } from '@/config/env';

async function main() {
    // 環境変数の検証は、アプリのモジュールを読み込む「前」に行う。
    // log4js の設定や読み上げ機能は import された時点で環境変数を assert するため、
    // 先に import してしまうと、検証にたどり着く前にクラッシュしてしまう。
    // そのため logger すら、検証を通ってから動的に読み込む。
    validateEnv();

    const { log4js_obj } = await import('@/infra/logging/log4js');
    const { bootstrap } = await import('@/bootstrap');

    registerProcessErrorHandlers(log4js_obj.getLogger());

    try {
        await bootstrap();
    } catch (error) {
        log4js_obj.getLogger().fatal('起動に失敗しました', error);
        process.exit(1);
    }
}

/**
 * 拾いそこねた例外の最終防衛線。
 *
 * Node は未処理の Promise 拒否をプロセス終了として扱うため、これが無いと
 * どこか一箇所の await 漏れがそのまま Bot の停止になる。ここで受けておけば、
 * 少なくとも「何が落としたのか」がログに残る。
 *
 * DB に依存しない経路(log4js)だけで書くこと。DB 障害そのものを記録できなくなる。
 */
function registerProcessErrorHandlers(logger: Logger) {
    process.on('unhandledRejection', (reason) => {
        logger.error('unhandled rejection', reason);
    });

    process.on('uncaughtException', (error) => {
        logger.fatal('uncaught exception', error);
    });
}

void main().catch((error) => {
    // 環境変数の検証で落ちた場合はロガーがまだ使えないため、標準エラー出力に出す
    console.error('起動に失敗しました', error);
    process.exit(1);
});
