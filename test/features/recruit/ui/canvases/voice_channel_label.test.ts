import path from 'node:path';

import Canvas from 'canvas';
import { describe, expect, it } from 'vitest';

import { drawVoiceChannelName } from '@/features/recruit/ui/canvases/voice_channel_label';

Canvas.registerFont(path.resolve('./fonts/Splatfont.ttf'), { family: 'Splatfont' });

function createBackground() {
    const canvas = Canvas.createCanvas(720, 550);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2F3136';
    ctx.fillRect(0, 0, 720, 550);
    return { canvas, ctx };
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
        expect(icon).toEqual({ x: 30, y: 488, size: 38 });
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

        let hasWhite = false;
        for (let i = 0; i < actualPixels.length; i += 4) {
            if (
                actualPixels[i] === 255 &&
                actualPixels[i + 1] === 255 &&
                actualPixels[i + 2] === 255
            ) {
                hasWhite = true;
                break;
            }
        }
        expect(hasWhite).toBe(true);
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
        expect(icon.x).toBe(680 - textWidth - 7 - 34);
    });
});
