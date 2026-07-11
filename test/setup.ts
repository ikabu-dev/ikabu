import { vi } from 'vitest';

process.env.LOG4JS_CONFIG_PATH ??= 'config/log4js-console-config.json';
process.env.VOICE_TEXT_API_KEY ??= 'test';

vi.mock('@/app', () => ({
    client: { isReady: () => false },
}));
