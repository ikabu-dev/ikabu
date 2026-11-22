import fs from 'fs';
import path from 'path';

import Canvas, { CanvasRenderingContext2D, Image } from 'canvas';

import { log4js_obj } from '@/infra/logging/log4js';

const logger = log4js_obj.getLogger('EmojiText');

/** 書記素 1 つ (改行は '\n') と、それを描く Twemoji の SVG のパス。文字として描くなら null */
export type EmojiTextToken = { text: string; svgPath: string | null };

// フォント (path.resolve('./fonts/...')) と同じく、カレントディレクトリがリポジトリのルートであることを前提にしている
const TWEMOJI_SVG_DIR = path.resolve('./node_modules/@twemoji/svg');

// ★ ♪ ✔ のように表示の既定がテキストの記号は、FE0F が付かない限りフォントで描く
const EMOJI_GRAPHEME_PATTERN =
    /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F|\p{Regional_Indicator}|\u20E3/u;

const graphemeSegmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
const svgPathCache = new Map<string, string | null>();
const svgImageCache = new Map<string, Promise<Image>>();

/**
 * 書記素を絵文字として扱うかどうかを返す
 * @param grapheme 書記素 1 つ
 */
export function isEmojiGrapheme(grapheme: string): boolean {
    return EMOJI_GRAPHEME_PATTERN.test(grapheme);
}

/**
 * Twemoji の SVG のファイル名 (拡張子なし) の候補を、試す順に返す
 * @param grapheme 書記素 1 つ
 */
export function twemojiFileNames(grapheme: string): string[] {
    const codePoints = Array.from(grapheme).map((char) => (char.codePointAt(0) ?? 0).toString(16));
    const withoutFe0f = codePoints.filter((codePoint) => codePoint !== 'fe0f').join('-');

    // Twemoji のファイル名は、ZWJ を含まない絵文字では FE0F を必ず除く。
    // ZWJ の列では FE0F が残るもの (2764-fe0f-200d-1f525) と残らないもの (1f441-200d-1f5e8) があるため、両方を試す
    if (!codePoints.includes('200d')) {
        return [withoutFe0f];
    }
    const withFe0f = codePoints.join('-');
    return withFe0f === withoutFe0f ? [withFe0f] : [withFe0f, withoutFe0f];
}

/**
 * 書記素に対応する Twemoji の SVG のパスを返す。パッケージにない場合は null
 * @param grapheme 書記素 1 つ
 */
export function findTwemojiSvgPath(grapheme: string): string | null {
    const cached = svgPathCache.get(grapheme);
    if (cached !== undefined) {
        return cached;
    }

    let found: string | null = null;
    for (const fileName of twemojiFileNames(grapheme)) {
        const svgPath = path.join(TWEMOJI_SVG_DIR, `${fileName}.svg`);
        if (fs.existsSync(svgPath)) {
            found = svgPath;
            break;
        }
    }
    svgPathCache.set(grapheme, found);
    return found;
}

/**
 * 文字列を書記素に分け、Twemoji の画像で描くものに SVG のパスを付ける
 * @param text 文字列
 */
export function toEmojiTextTokens(text: string): EmojiTextToken[] {
    return Array.from(graphemeSegmenter.segment(text), ({ segment }) => {
        if (segment === '\n' || segment === '\r\n') {
            return { text: '\n', svgPath: null };
        }
        return {
            text: segment,
            svgPath: isEmojiGrapheme(segment) ? findTwemojiSvgPath(segment) : null,
        };
    });
}

/**
 * トークンを幅に合わせて折り返し、行数を超えた分を省略する
 * @param tokens toEmojiTextTokens で分けたトークン
 * @param measureText テキストの描画幅を返す関数
 * @param opts.width 1 行の最大幅
 * @param opts.maxLines 最大行数。超えた場合は最終行の末尾に '…' を付ける
 * @param opts.emojiWidth 絵文字 1 つが占める幅
 */
export function layoutEmojiTextLines(
    tokens: EmojiTextToken[],
    measureText: (text: string) => number,
    opts: { width: number; maxLines: number; emojiWidth: number },
): EmojiTextToken[][] {
    // 絵文字を含まない入力では、従来の折り返し (measureText(行 + 文字) > width) と同じ位置で折り返す
    const lineWidth = (line: EmojiTextToken[]) => {
        const emojiCount = line.filter((token) => token.svgPath !== null).length;
        const text = line
            .filter((token) => token.svgPath === null)
            .map((token) => token.text)
            .join('');
        return emojiCount * opts.emojiWidth + measureText(text);
    };

    const lines: EmojiTextToken[][] = [[]];
    for (const token of tokens) {
        if (token.svgPath === null && token.text === '\n') {
            lines.push([]);
            continue;
        }
        const current = lines[lines.length - 1];
        if (lineWidth([...current, token]) > opts.width) {
            lines.push([token]);
        } else {
            current.push(token);
        }
    }

    if (lines.length > opts.maxLines) {
        const visible = lines.slice(0, opts.maxLines);
        visible[opts.maxLines - 1].push({ text: '…', svgPath: null });
        return visible;
    }
    return lines;
}

function loadTwemojiImage(svgPath: string): Promise<Image> {
    let image = svgImageCache.get(svgPath);
    if (image === undefined) {
        // Twemoji の SVG は viewBox だけで width と height を持たず、そのままでは node-canvas が読めないため足す
        image = fs.promises
            .readFile(svgPath, 'utf8')
            .then((svg) =>
                Canvas.loadImage(Buffer.from(svg.replace('<svg ', '<svg width="72" height="72" '))),
            );
        svgImageCache.set(svgPath, image);
        // 一時的な失敗を残すと、再起動するまで同じ絵文字の描画が失敗し続ける
        image.catch(() => svgImageCache.delete(svgPath));
    }
    return image;
}

/**
 * 絵文字を Twemoji の画像で描きながら、文字列を折り返して描く。
 * 文字は呼び出し元が設定した ctx.font と ctx.fillStyle で描く
 * @param ctx Canvas Context
 * @param text 文字列
 * @param opts.x 左端の x 座標
 * @param opts.y 1 行目のベースラインの y 座標
 * @param opts.width 1 行の最大幅
 * @param opts.lineHeight 行の間隔
 * @param opts.maxLines 最大行数
 * @param opts.emojiSize 絵文字の画像の一辺
 */
export async function drawWrappedTextWithEmoji(
    ctx: CanvasRenderingContext2D,
    text: string,
    opts: {
        x: number;
        y: number;
        width: number;
        lineHeight: number;
        maxLines: number;
        emojiSize: number;
    },
): Promise<void> {
    const gap = opts.emojiSize * 0.08;
    const emojiWidth = opts.emojiSize + gap * 2;
    const lines = layoutEmojiTextLines(toEmojiTextTokens(text), (t) => ctx.measureText(t).width, {
        width: opts.width,
        maxLines: opts.maxLines,
        emojiWidth,
    });

    for (const [j, line] of lines.entries()) {
        const baseline = opts.y + opts.lineHeight * j;
        let cx = opts.x;
        let pendingText = '';
        const flushText = () => {
            if (pendingText === '') {
                return;
            }
            ctx.fillText(pendingText, cx, baseline);
            cx += ctx.measureText(pendingText).width;
            pendingText = '';
        };

        for (const token of line) {
            if (token.svgPath === null) {
                pendingText += token.text;
                continue;
            }
            let image: Image;
            try {
                image = await loadTwemojiImage(token.svgPath);
            } catch (error) {
                // 絵文字 1 つが読めないだけで募集画像の生成ごと失敗させないよう、文字として描く。
                // 折り返しは画像の幅で計算済みなので、この行の幅は少しずれる
                logger.warn(`絵文字の画像を読めないため文字で描く: ${token.text}`, error);
                pendingText += token.text;
                continue;
            }
            flushText();
            ctx.drawImage(
                image,
                cx + gap,
                baseline - opts.emojiSize * 0.85,
                opts.emojiSize,
                opts.emojiSize,
            );
            cx += emojiWidth;
        }
        flushText();
    }
}
