import { validateEnv } from '@/config/env';

import type { Logger } from 'log4js';

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
 * ここに到達した時点でプロセスの状態は壊れているため、握り潰して動かし続けず、
 * ログを残してから落とす(systemd が再起動する)。Node の既定動作も同じく終了だが、
 * 既定では「何が落としたのか」が残らないため、ここで記録してから終了する。
 *
 * DB に依存しない経路(log4js)だけで書くこと。DB 障害そのものを記録できなくなる。
 */
function registerProcessErrorHandlers(logger: Logger) {
    let isExiting = false;

    const logAndExit = (label: string, error: unknown) => {
        if (isExiting) return;
        isExiting = true;

        logger.fatal(label, error);
        flushLogsThenExit();
    };

    process.on('unhandledRejection', (reason) => logAndExit('unhandled rejection', reason));
    process.on('uncaughtException', (error) => logAndExit('uncaught exception', error));
}

/**
 * 直前に出したログを書き切ってから終了する。
 *
 * 本番では stdout/stderr が systemd へのパイプであり、POSIX ではパイプへの書き込みは
 * 非同期になる。process.exit() は書き込み中のログを待たずに落とすため、そのまま
 * 呼ぶと肝心の fatal ログが消えてしまう(= このハンドラの存在意義が無くなる)。
 *
 * なお log4js.shutdown() ではこれを解決できない。console/stdout appender は
 * shutdown 関数を持たないため、shutdown() はコールバックを即座に呼ぶだけである。
 */
function flushLogsThenExit() {
    let pending = 2;
    const exitWhenFlushed = () => {
        pending -= 1;
        if (pending === 0) process.exit(1);
    };

    process.stdout.write('', exitWhenFlushed);
    process.stderr.write('', exitWhenFlushed);

    // 書き出しが完了しない場合でも必ず落とす
    setTimeout(() => process.exit(1), 3000);
}

void main().catch((error) => {
    // 環境変数の検証で落ちた場合はロガーがまだ使えないため、標準エラー出力に出す
    console.error('起動に失敗しました', error);
    process.exit(1);
});
