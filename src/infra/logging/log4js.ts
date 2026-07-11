import log4js from 'log4js';

import { env } from '@/config/env';
if (env.log4jsConfigPath === undefined) {
    throw new Error('LOG4JS_CONFIG_PATH is empty');
} else {
    const log4js_path: string = env.log4jsConfigPath;
    log4js.configure(log4js_path);
}
export const log4js_obj = log4js;
