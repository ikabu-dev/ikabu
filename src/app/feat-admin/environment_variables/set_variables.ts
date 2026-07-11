import * as fs from 'fs/promises';
import path from 'path';

import { AttachmentBuilder, ChatInputCommandInteraction } from 'discord.js';

import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { log4js_obj } from '@/log4js_settings';
import { assertExistCheck } from '@/shared/assert';

const ENV_FILE_PATH = path.resolve('./', '.env');

const logger = log4js_obj.getLogger('interaction');

export async function setVariables(interaction: ChatInputCommandInteraction<'cached' | 'raw'>) {
    try {
        const options = interaction.options;
        const key = options.getString('key', true);
        const value = options.getString('value', true);

        // .envファイル更新
        await setEnvValue(key, value);

        const env_file = new AttachmentBuilder('./.env', { name: 'env.txt' });

        // dotenv更新 (override trueにしないと上書きされない)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('dotenv').config({ override: true });

        await interaction.deleteReply();
        assertExistCheck(interaction.channel, 'channel');
        await interaction.channel.send({
            content: '設定したでし！',
            files: [env_file],
        });
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}

/**
 * 既存のkeyの値を更新、なければ新しく「key=value」の行を作成
 * @param {string} key 更新または作成するkey
 * @param {string} value 設定する値
 */
async function setEnvValue(key: string, value: string) {
    try {
        const envFile = await fs.readFile(ENV_FILE_PATH, 'utf-8');
        const envVars = envFile.split(/\r\n|\n|\r/);
        const targetLine = envVars.find((line: string) => line.split('=')[0] === key);
        if (targetLine !== undefined) {
            const targetLineIndex = envVars.indexOf(targetLine);
            // keyとvalueを置き換え
            envVars.splice(targetLineIndex, 1, `${key}=${value}`);
        } else {
            // 新しくkeyとvalueを設定
            envVars.push(`${key}=${value}`);
        }
        envVars.sort();
        // ファイル書き込み
        await fs.writeFile(ENV_FILE_PATH, envVars.join('\n'));
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
