import path from 'node:path';

import Canvas from 'canvas';
import { describe, expect, it, vi } from 'vitest';

import { drawVoiceChannelName } from '@/features/recruit/ui/canvases/voice_channel_label';

Canvas.registerFont(path.resolve('./fonts/Splatfont.ttf'), { family: 'Splatfont' });

function createBackground() {
    const canvas = Canvas.createCanvas(720, 550);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2F3136';
    ctx.fillRect(0, 0, 720, 550);
    return { canvas, ctx };
}

function hasWhitePixel(pixels: Uint8ClampedArray) {
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] === 255 && pixels[i + 1] === 255 && pixels[i + 2] === 255) {
            return true;
        }
    }
    return false;
}

describe('drawVoiceChannelName', () => {
    it('左揃えではアイコンを x に置く', async () => {
        const { ctx } = createBackground();
        const icon = await drawVoiceChannelName(ctx, 'alfa', {
            fontSize: 37,
            x: 30,
            y: 520,
            align: 'left',
        });
        expect(icon.x).toBe(30);
        expect(icon.size).toBeGreaterThanOrEqual(37 * 0.9);
        expect(icon.size).toBeLessThanOrEqual(37 * 1.2);
        expect(Math.abs(icon.y + icon.size - 520)).toBeLessThanOrEqual(37 * 0.3);
    });

    it('アイコンに vc_icon.svg を縁取りなしで描く', async () => {
        const actual = createBackground();
        const icon = await drawVoiceChannelName(actual.ctx, null, {
            fontSize: 37,
            x: 30,
            y: 520,
            align: 'left',
        });

        const expected = createBackground();
        const image = await Canvas.loadImage(path.resolve('./images/recruit/vc_icon.svg'));
        expected.ctx.drawImage(image, icon.x, icon.y, icon.size, icon.size);

        const actualPixels = actual.ctx.getImageData(icon.x, icon.y, icon.size, icon.size).data;
        const expectedPixels = expected.ctx.getImageData(icon.x, icon.y, icon.size, icon.size).data;
        expect(Buffer.from(actualPixels).equals(Buffer.from(expectedPixels))).toBe(true);
        expect(hasWhitePixel(actualPixels)).toBe(true);
    });

    it('右揃えではアイコンを文字列の左に置く', async () => {
        const { ctx } = createBackground();
        ctx.font = '33px "Splatfont"';
        const textWidth = ctx.measureText('VC指定なし').width;

        const icon = await drawVoiceChannelName(ctx, null, {
            fontSize: 33,
            x: 680,
            y: 70,
            align: 'right',
        });
        const textLeft = 680 - textWidth;
        const iconRight = icon.x + icon.size;
        expect(iconRight).toBeLessThanOrEqual(textLeft);
        expect(textLeft - iconRight).toBeLessThanOrEqual(33 * 0.5);
    });

    it('アイコンの読み込みに失敗したときは文字だけを描き、次の呼び出しでは読み直す', async () => {
        // ほかのテストが読み込んだアイコンのキャッシュを避けるため、モジュールを読み直す
        vi.resetModules();
        const { drawVoiceChannelName: drawFresh } =
            await import('@/features/recruit/ui/canvases/voice_channel_label');
        const opts = { fontSize: 37, x: 30, y: 520, align: 'left' } as const;
        const loadImage = vi
            .spyOn(Canvas, 'loadImage')
            .mockRejectedValueOnce(new Error('一時的な失敗'));
        try {
            const first = createBackground();
            const icon = await drawFresh(first.ctx, null, opts);
            expect(
                hasWhitePixel(first.ctx.getImageData(icon.x, icon.y, icon.size, icon.size).data),
            ).toBe(false);

            const second = createBackground();
            await drawFresh(second.ctx, null, opts);
            expect(
                hasWhitePixel(second.ctx.getImageData(icon.x, icon.y, icon.size, icon.size).data),
            ).toBe(true);
            expect(loadImage).toHaveBeenCalledTimes(2);
        } finally {
            loadImage.mockRestore();
        }
    });
});
