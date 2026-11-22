import path from 'path';

import Canvas, { CanvasRenderingContext2D, Image } from 'canvas';

import { log4js_obj } from '@/infra/logging/log4js';
import { fillTextWithStroke } from '@/shared/discord_helpers/canvas_components';

const logger = log4js_obj.getLogger('VoiceChannelLabel');

let vcIconImage: Promise<Image> | undefined;

function loadVcIcon(): Promise<Image> {
    // フォントと同じく、カレントディレクトリがリポジトリのルートであることを前提にしている
    vcIconImage ??= Canvas.loadImage(path.resolve('./images/recruit/vc_icon.svg')).catch(
        (error: unknown) => {
            // 一度の失敗を残すと、再起動するまで全種類の募集画像のアイコンが読めなくなる
            vcIconImage = undefined;
            throw error;
        },
    );
    return vcIconImage;
}

/**
 * 募集 Canvas に VC 名をスピーカーのアイコン付きで描く
 * @param ctx Canvas Context
 * @param channelName VC 名。null なら「VC指定なし」と描く
 * @param opts.fontSize 文字の大きさ (px)
 * @param opts.x align が left ならアイコンの左端、right なら文字列の右端の x 座標
 * @param opts.y 文字列のベースラインの y 座標
 * @param opts.align 揃える向き
 * @returns アイコンを置く左上の位置と一辺 (読み込みに失敗して描かなかった場合も同じ値)
 */
export async function drawVoiceChannelName(
    ctx: CanvasRenderingContext2D,
    channelName: string | null,
    opts: { fontSize: number; x: number; y: number; align: 'left' | 'right' },
): Promise<{ x: number; y: number; size: number }> {
    const text = channelName ?? 'VC指定なし';
    const font = `${opts.fontSize}px "Splatfont"`;
    const iconSize = Math.round(opts.fontSize * 1.03);
    const gap = Math.round(opts.fontSize * 0.22);
    const iconY = opts.y - Math.round(opts.fontSize * 0.86);

    let iconX: number;
    if (opts.align === 'left') {
        iconX = opts.x;
        fillTextWithStroke(
            ctx,
            text,
            font,
            '#FFFFFF',
            '#2D3130',
            1,
            iconX + iconSize + gap,
            opts.y,
        );
    } else {
        ctx.save();
        ctx.font = font;
        const textWidth = ctx.measureText(text).width;
        ctx.textAlign = 'right';
        fillTextWithStroke(ctx, text, font, '#FFFFFF', '#2D3130', 1, opts.x, opts.y);
        ctx.restore();
        iconX = opts.x - textWidth - gap - iconSize;
    }

    try {
        ctx.drawImage(await loadVcIcon(), iconX, iconY, iconSize, iconSize);
    } catch (error) {
        // アイコンが読めなくても募集画像は作れるよう、アイコンを省いて文字だけにする
        logger.warn('VC のアイコンを読めないため省いて描く', error);
    }
    return { x: iconX, y: iconY, size: iconSize };
}
