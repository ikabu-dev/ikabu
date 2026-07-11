import { stringify } from 'querystring';

import fetch from 'node-fetch';

export interface VoiceTextApiParams {
    text: string;
    speaker?: string;
    format?: string;
    emotion?: string;
    emotion_level?: number;
    pitch?: number;
    speed?: number;
    volume?: number;
}

export default class VoiceTextApi {
    private readonly _hostname = 'api.voicetext.jp';
    private readonly _endpoint = 'v1/tts';
    private readonly _apitoken: string;

    constructor(token: string) {
        this._apitoken = token;
    }

    private validate(param: VoiceTextApiParams) {
        if (typeof param.text !== 'string' || param.text.length < 1 || param.text.length > 200) {
            throw new Error('Invalid text parameter');
        }

        const validSpeakers = ['hikari', 'haruka', 'takeru', 'santa', 'bear', 'show'];
        if (param.speaker && !validSpeakers.includes(param.speaker)) {
            throw new Error('Invalid speaker parameter');
        }

        const validFormats = ['wav', 'ogg', 'mp3'];
        if (param.format && !validFormats.includes(param.format)) {
            throw new Error('Invalid format parameter');
        }

        const validEmotions = ['happiness', 'anger', 'sadness'];
        if (param.emotion && !validEmotions.includes(param.emotion)) {
            throw new Error('Invalid emotion parameter');
        }

        if (param.emotion_level && (param.emotion_level < 1 || param.emotion_level > 4)) {
            throw new Error('Invalid emotion_level parameter');
        }

        if (param.pitch && (param.pitch < 50 || param.pitch > 200)) {
            throw new Error('Invalid pitch parameter');
        }

        if (param.speed && (param.speed < 50 || param.speed > 400)) {
            throw new Error('Invalid speed parameter');
        }

        if (param.volume && (param.volume < 50 || param.volume > 200)) {
            throw new Error('Invalid volume parameter');
        }

        return param;
    }

    private getQueryText(param: VoiceTextApiParams) {
        const validParam = this.validate(param);
        const convertedParam = this.convertToQueryParams(validParam);
        return stringify(convertedParam);
    }

    private getRequestUri(param: VoiceTextApiParams) {
        return `https://${this._hostname}/${this._endpoint}?${this.getQueryText(param)}`;
    }

    private fetch(param: VoiceTextApiParams) {
        return fetch(this.getRequestUri(param), {
            method: 'post',
            headers: {
                Authorization: `Basic ${Buffer.from(`${this._apitoken}:`).toString('base64')}`,
            },
        });
    }

    async fetchBuffer(param: VoiceTextApiParams) {
        const res = await this.fetch(param);
        const array = await res.arrayBuffer();
        return new Uint8Array(array);
    }

    async stream(param: VoiceTextApiParams) {
        const res = await this.fetch(param);
        return res.body;
    }

    private convertToQueryParams(
        param: VoiceTextApiParams,
    ): Record<string, string | number | boolean> {
        const result: Record<string, string | number | boolean> = {};
        for (const key in param) {
            if (param[key as keyof VoiceTextApiParams] !== undefined) {
                result[key] = param[key as keyof VoiceTextApiParams] as string | number | boolean;
            }
        }
        return result;
    }
}
