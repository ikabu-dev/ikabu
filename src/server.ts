import { validateEnv } from '@/config/env';
import { log4js_obj } from '@/infra/logging/log4js';

const logger = log4js_obj.getLogger();

async function main() {
    // 環境変数の検証は、アプリのモジュールを読み込む「前」に行う。
    // 一部のモジュール(読み上げ機能など)は import された時点で環境変数を assert するため、
    // 先に bootstrap を import してしまうと、検証にたどり着く前にクラッシュしてしまう。
    validateEnv();

    const { bootstrap } = await import('@/bootstrap');
    await bootstrap();
}

void main().catch((error) => {
    logger.fatal('起動に失敗しました', error);
    process.exit(1);
});
