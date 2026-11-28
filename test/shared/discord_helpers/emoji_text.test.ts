import fs from 'node:fs';

import Canvas from 'canvas';
import { describe, expect, it, vi } from 'vitest';

import {
    EmojiTextToken,
    drawWrappedTextWithEmoji,
    findTwemojiSvgPath,
    isEmojiGrapheme,
    layoutEmojiTextLines,
    toEmojiTextTokens,
    twemojiFileNames,
} from '@/shared/discord_helpers/emoji_text';

const fakeMeasureText = (s: string) => [...s].length * 10;

function layout(text: string, maxLines = 4) {
    return layoutEmojiTextLines(toEmojiTextTokens(text), fakeMeasureText, {
        width: 30,
        maxLines,
        emojiWidth: 20,
    });
}

function joinLines(lines: EmojiTextToken[][]) {
    return lines.map((line) => line.map((token) => token.text).join(''));
}

describe('twemojiFileNames', () => {
    it('ZWJ を含まない絵文字は FE0F を除いた名前 1 つを返す', () => {
        expect(twemojiFileNames('🔉')).toEqual(['1f509']);
        expect(twemojiFileNames('#️⃣')).toEqual(['23-20e3']);
        expect(twemojiFileNames('🇯🇵')).toEqual(['1f1ef-1f1f5']);
    });

    it('ZWJ を含む絵文字は FE0F を残した名前、除いた名前の順に返す', () => {
        expect(twemojiFileNames('❤️‍🔥')).toEqual(['2764-fe0f-200d-1f525', '2764-200d-1f525']);
        expect(twemojiFileNames('👁️‍🗨️')).toEqual(['1f441-fe0f-200d-1f5e8-fe0f', '1f441-200d-1f5e8']);
    });
});

describe('findTwemojiSvgPath', () => {
    it('パッケージにあるファイル名の候補のパスを返す', () => {
        expect(findTwemojiSvgPath('❤️‍🔥')).toMatch(/2764-fe0f-200d-1f525\.svg$/);
        expect(findTwemojiSvgPath('👁️‍🗨️')).toMatch(/1f441-200d-1f5e8\.svg$/);
    });
});

describe('isEmojiGrapheme', () => {
    it('絵文字として表示するのが既定の文字と、FE0F の付いた記号を絵文字とみなす', () => {
        expect(isEmojiGrapheme('🔉')).toBe(true);
        expect(isEmojiGrapheme('✔️')).toBe(true);
    });

    it('表示の既定がテキストの記号と、ふつうの文字は絵文字とみなさない', () => {
        for (const grapheme of ['★', '✔', '♪', 'あ']) {
            expect(isEmojiGrapheme(grapheme)).toBe(false);
        }
    });
});

describe('toEmojiTextTokens', () => {
    it('書記素ごとに分け、絵文字に SVG のパスを付ける', () => {
        expect(toEmojiTextTokens('A👨‍👩‍👧🇯🇵\nB')).toEqual([
            { text: 'A', svgPath: null },
            { text: '👨‍👩‍👧', svgPath: expect.stringMatching(/1f468-200d-1f469-200d-1f467\.svg$/) },
            { text: '🇯🇵', svgPath: expect.stringMatching(/1f1ef-1f1f5\.svg$/) },
            { text: '\n', svgPath: null },
            { text: 'B', svgPath: null },
        ]);
    });
});

describe('layoutEmojiTextLines', () => {
    it('幅を超える文字から次の行にする', () => {
        expect(joinLines(layout('abcdefg'))).toEqual(['abc', 'def', 'g']);
    });

    it('絵文字は emojiWidth の幅として数える', () => {
        expect(joinLines(layout('ab🔉c'))).toEqual(['ab', '🔉c']);
    });

    it('改行で次の行にする', () => {
        expect(joinLines(layout('a\nb'))).toEqual(['a', 'b']);
    });

    it('行数を超えたら最終行の末尾に … を付けて省略する', () => {
        expect(joinLines(layout('abcdefghijkl', 3))).toEqual(['abc', 'def', 'ghi…']);
    });

    it('サロゲートペアの途中で折り返さない', () => {
        const lines = layout('𠮷𠮷𠮷𠮷');
        expect(joinLines(lines)).toEqual(['𠮷𠮷𠮷', '𠮷']);
        expect(lines.flat().every((token) => token.text === '𠮷')).toBe(true);
    });
});

describe('drawWrappedTextWithEmoji', () => {
    it('絵文字を Twemoji の画像で描く', async () => {
        const actualCanvas = Canvas.createCanvas(100, 60);
        await drawWrappedTextWithEmoji(actualCanvas.getContext('2d'), '🔉', {
            x: 10,
            y: 40,
            width: 200,
            lineHeight: 40,
            maxLines: 1,
            emojiSize: 30,
        });

        const svgPath = findTwemojiSvgPath('🔉');
        expect(svgPath).not.toBeNull();
        const svg = fs
            .readFileSync(svgPath as string, 'utf8')
            .replace('<svg ', '<svg width="72" height="72" ');
        const image = await Canvas.loadImage(Buffer.from(svg));
        const expectedCanvas = Canvas.createCanvas(100, 60);
        const gap = 30 * 0.08;
        expectedCanvas.getContext('2d').drawImage(image, 10 + gap, 40 - 30 * 0.85, 30, 30);

        const actual = actualCanvas.getContext('2d').getImageData(0, 0, 100, 60).data;
        const expected = expectedCanvas.getContext('2d').getImageData(0, 0, 100, 60).data;
        expect(actual.some((value) => value !== 0)).toBe(true);
        expect(Buffer.from(actual).equals(Buffer.from(expected))).toBe(true);
    });

    it('絵文字の画像は、x から絵文字 1 つ分の幅とベースラインの近くに収まる', async () => {
        const canvas = Canvas.createCanvas(100, 60);
        await drawWrappedTextWithEmoji(canvas.getContext('2d'), '🔉', {
            x: 10,
            y: 40,
            width: 200,
            lineHeight: 40,
            maxLines: 1,
            emojiSize: 30,
        });

        const data = canvas.getContext('2d').getImageData(0, 0, 100, 60).data;
        let left = Infinity;
        let right = -Infinity;
        let top = Infinity;
        let bottom = -Infinity;
        for (let py = 0; py < 60; py++) {
            for (let px = 0; px < 100; px++) {
                if (data[(py * 100 + px) * 4 + 3] !== 0) {
                    left = Math.min(left, px);
                    right = Math.max(right, px + 1);
                    top = Math.min(top, py);
                    bottom = Math.max(bottom, py + 1);
                }
            }
        }

        expect(left).toBeGreaterThanOrEqual(10);
        expect(right).toBeLessThanOrEqual(10 + 30 * 1.2);
        expect(top).toBeGreaterThanOrEqual(40 - 30);
        expect(bottom).toBeLessThanOrEqual(40 + 30 * 0.3);
        expect(right - left).toBeGreaterThanOrEqual(20);
        expect(bottom - top).toBeGreaterThanOrEqual(20);
    });

    it('読み込みに失敗した絵文字は文字として描き、次の呼び出しでは画像で描く', async () => {
        // キャッシュの影響を受けないよう、ほかのテストで読んでいない絵文字を使う
        const opts = { x: 10, y: 40, width: 200, lineHeight: 40, maxLines: 1, emojiSize: 30 };
        const font = '30px sans-serif';
        const pixelsOf = (canvas: Canvas.Canvas) =>
            Buffer.from(canvas.getContext('2d').getImageData(0, 0, 100, 60).data);

        const textCanvas = Canvas.createCanvas(100, 60);
        const textCtx = textCanvas.getContext('2d');
        textCtx.font = font;
        textCtx.fillText('🎮', 10, 40);
        const textPixels = pixelsOf(textCanvas);

        const readFile = vi
            .spyOn(fs.promises, 'readFile')
            .mockRejectedValueOnce(new Error('一時的な失敗'));
        try {
            const fallbackCanvas = Canvas.createCanvas(100, 60);
            const fallbackCtx = fallbackCanvas.getContext('2d');
            fallbackCtx.font = font;
            await drawWrappedTextWithEmoji(fallbackCtx, '🎮', opts);
            expect(pixelsOf(fallbackCanvas).equals(textPixels)).toBe(true);

            const imageCanvas = Canvas.createCanvas(100, 60);
            const imageCtx = imageCanvas.getContext('2d');
            imageCtx.font = font;
            await drawWrappedTextWithEmoji(imageCtx, '🎮', opts);
            const imagePixels = pixelsOf(imageCanvas);
            expect(imagePixels.some((value) => value !== 0)).toBe(true);
            expect(imagePixels.equals(textPixels)).toBe(false);
            expect(readFile).toHaveBeenCalledTimes(2);
        } finally {
            readFile.mockRestore();
        }
    });
});
