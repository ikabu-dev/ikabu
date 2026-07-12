import { validateEnv } from '@/config/env';

async function main() {
    // 環境変数の検証は、アプリのモジュールを読み込む「前」に行う。
    // log4js の設定や読み上げ機能は import された時点で環境変数を assert するため、
    // 先に import してしまうと、検証にたどり着く前にクラッシュしてしまう。
    // そのため logger すら、検証を通ってから動的に読み込む。
    validateEnv();

    const { log4js_obj } = await import('@/infra/logging/log4js');
    const { bootstrap } = await import('@/bootstrap');

    try {
        await bootstrap();
    } catch (error) {
        log4js_obj.getLogger().fatal('起動に失敗しました', error);
        process.exit(1);
    }
}

// 拾いそこねた例外(unhandledRejection / uncaughtException)は、Node の既定動作に任せる。
// 既定でスタックトレースを stderr に出して exit(1) するため、systemd が再起動する。
// ハンドラを自前で登録しても、ログを stderr に出して落とす以上のことはできない。

void main().catch((error) => {
    // 環境変数の検証で落ちた場合はロガーがまだ使えないため、標準エラー出力に出す
    console.error('起動に失敗しました', error);
    process.exit(1);
});
