import fs from 'node:fs';

import Canvas from 'canvas';
import { describe, expect, it } from 'vitest';

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
    it('書記素ごとに分け、絵文字に印を付ける', () => {
        expect(toEmojiTextTokens('A👨‍👩‍👧🇯🇵\nB')).toEqual([
            { text: 'A', emoji: false },
            { text: '👨‍👩‍👧', emoji: true },
            { text: '🇯🇵', emoji: true },
            { text: '\n', emoji: false },
            { text: 'B', emoji: false },
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
});
