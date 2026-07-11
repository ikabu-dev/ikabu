/**
 * 環境変数へのアクセス点。
 *
 * `/環境変数設定` コマンドで実行中に .env と process.env が書き換わるため、
 * 値はモジュール読み込み時にキャッシュせず、参照のたびに process.env から読む。
 */
function raw(key: string): string | undefined {
    return process.env[key];
}

export const env = {
    get discordBotId(): string | undefined {
        return raw('DISCORD_BOT_ID');
    },
    get discordBotToken(): string | undefined {
        return raw('DISCORD_BOT_TOKEN');
    },
    get serverId(): string | undefined {
        return raw('SERVER_ID');
    },
    get log4jsConfigPath(): string | undefined {
        return raw('LOG4JS_CONFIG_PATH');
    },
    get slashCommandRegisterMode(): string | undefined {
        return raw('SLASH_COMMAND_REGISTER_MODE');
    },
    get buttonLogWebhookUrl(): string | undefined {
        return raw('BUTTON_LOG_WEBHOOK_URL');
    },
    get commandLogWebhookUrl(): string | undefined {
        return raw('COMMAND_LOG_WEBHOOK_URL');
    },
    get voiceTextApiKey(): string | undefined {
        return raw('VOICE_TEXT_API_KEY');
    },
    get howToRecruitUrl(): string | undefined {
        return raw('HOW_TO_RECRUIT_URL');
    },
    get questionnaireUrl(): string | undefined {
        return raw('QUESTIONNAIRE_URL');
    },
    get questionnaireRookieUrl(): string | undefined {
        return raw('QUESTIONNAIRE_ROOKIE_URL');
    },
    get recruitLoadingEmojiId(): string | undefined {
        return raw('RECRUIT_LOADING_EMOJI_ID');
    },
    get tagIdSupportProgress(): string | undefined {
        return raw('TAG_ID_SUPPORT_PROGRESS');
    },
    get tagIdSupportResolved(): string | undefined {
        return raw('TAG_ID_SUPPORT_RESOLVED');
    },
    get databaseUrl(): string | undefined {
        return raw('DATABASE_URL');
    },
    get nodeEnv(): string | undefined {
        return raw('NODE_ENV');
    },
    get port(): string | undefined {
        return raw('PORT');
    },
};

/**
 * これが無いと Bot が正しく起動できない環境変数。
 * bootstrap がこれを検証し、欠けていれば起動前に落とす。
 */
const REQUIRED_ENV_KEYS = [
    'DISCORD_BOT_TOKEN',
    'DISCORD_BOT_ID',
    'SERVER_ID',
    'LOG4JS_CONFIG_PATH',
    // 読み上げ機能が import 時に assert しているため、無いとプロセスが起動しない
    'VOICE_TEXT_API_KEY',
] as const;

/**
 * 必須の環境変数が揃っているか検証する。
 * 揃っていない状態で起動すると、コマンド登録の失敗などが実行中に初めて表面化するため、
 * 起動時に気づけるようにする。
 */
export function validateEnv(): void {
    const missing = REQUIRED_ENV_KEYS.filter((key) => {
        const value = raw(key);
        return value === undefined || value === '';
    });

    if (missing.length > 0) {
        throw new Error(`必須の環境変数が設定されていません: ${missing.join(', ')}`);
    }
}

/**
 * キーが実行時に決まる場合の参照。
 * アンケートURL(QUESTIONNAIRE_URL / QUESTIONNAIRE_ROOKIE_URL)のように
 * ボタンのパラメータからキーが渡されるケースでのみ使う。
 */
export function getEnvByKey(key: string): string | undefined {
    return raw(key);
}

/**
 * `/環境変数設定` コマンドによる実行中の環境変数削除。
 * process.env を直接変更する唯一の経路。
 */
export function deleteRuntimeEnv(key: string): void {
    delete process.env[key];
}
