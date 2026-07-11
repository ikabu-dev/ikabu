import Canvas from 'canvas';

import { SalmonInfo } from '@/app/common/apis/splatoon3.ink/splatoon3_ink.js';
import { createRoundRect, fillTextWithStroke } from '@/app/common/canvas_components';
import { dateformat, formatDatetime } from '@/app/common/convert_datetime';
import { exists } from '@/app/common/others.js';
import { placeHold } from '@/constant.js';

import {
    RecruitCanvasOptions,
    RecruitCardLayout,
    createCanvasContext,
    drawCanvasBackground,
    drawRecruitCard,
} from './canvas_base.js';

const BIG_RUN_LOGO_URL =
    'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/BIGRUN_logo.png';
const BIG_RUN_ILLUST_URL =
    'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/BIGRUN_illust.png';
const BIG_RUN_FOOTER_URL =
    'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/BIGRUN_footer.png';
const RECRUIT_LAYOUT: RecruitCardLayout = {
    recruiterAvatar: { x: 40, y: 120, radius: 50 },
    participantCount: 4,
    participantAvatar: (index) => ({ x: index * 118 + 158, y: 120, radius: 50 }),
    squid: { x: 90, y: 172, width: 75, height: 75 },
    channel: { font: '37px "Splatfont"', x: 30, y: 520 },
    recruitCount: { font: '39px "Splatfont"', x: 525, y: 155 },
    remaining: { font: '42px "Splatfont"', x: 605, y: 218 },
    conditionTitle: { font: '43px "Splatfont"', x: 35, y: 290 },
    condition: {
        font: '30px "Genshin", "SEGUI"',
        width: 600,
        lineHeight: 40,
        maxLines: 4,
        x: 65,
        y: 345,
    },
};
export type RecruitBigRunCanvasOptions = RecruitCanvasOptions;
export async function recruitBigRunCanvas(options: RecruitBigRunCanvasOptions) {
    const { canvas, ctx } = createCanvasContext();
    await drawRecruitCard(ctx, options, RECRUIT_LAYOUT, async (context) => {
        const logo = await Canvas.loadImage(BIG_RUN_LOGO_URL);
        context.drawImage(logo, 25, 32, 400, 60);
    });
    return canvas.toBuffer();
}

export async function ruleBigRunCanvas(data: SalmonInfo | null) {
    const { canvas: ruleCanvas, ctx: ruleCtx } = createCanvasContext();
    const errorWeaponImage = await Canvas.loadImage(placeHold.error100x100);
    const datetime = data
        ? formatDatetime(data.startTime, dateformat.mdwhm) +
          ' - ' +
          formatDatetime(data.endTime, dateformat.mdwhm)
        : 'えらー';
    const stage = data ? data.stage : 'えらー';
    const weapon1Image = data ? await Canvas.loadImage(data.weapon1) : errorWeaponImage;
    const weapon2Image = data ? await Canvas.loadImage(data.weapon2) : errorWeaponImage;
    const weapon3Image = data ? await Canvas.loadImage(data.weapon3) : errorWeaponImage;
    const weapon4Image = data ? await Canvas.loadImage(data.weapon4) : errorWeaponImage;
    drawCanvasBackground(ruleCtx);
    fillTextWithStroke(ruleCtx, '日時', '32px Splatfont', '#FFFFFF', '#2D3130', 1, 35, 60);
    const dateWidth = ruleCtx.measureText(datetime).width;
    fillTextWithStroke(
        ruleCtx,
        datetime,
        '37px Splatfont',
        '#FFFFFF',
        '#2D3130',
        1,
        (650 - dateWidth) / 2,
        120,
    );
    fillTextWithStroke(ruleCtx, '武器', '32px Splatfont', '#FFFFFF', '#2D3130', 1, 35, 180);
    ruleCtx.drawImage(weapon1Image, 50, 205, 85, 85);
    ruleCtx.drawImage(weapon2Image, 150, 205, 85, 85);
    ruleCtx.drawImage(weapon3Image, 50, 305, 85, 85);
    ruleCtx.drawImage(weapon4Image, 150, 305, 85, 85);
    fillTextWithStroke(ruleCtx, 'ステージ', '33px Splatfont', '#FFFFFF', '#2D3130', 1, 310, 180);
    const stageWidth = ruleCtx.measureText(stage).width;
    fillTextWithStroke(
        ruleCtx,
        stage,
        '38px Splatfont',
        '#FFFFFF',
        '#2D3130',
        1,
        110 + (700 - stageWidth) / 2,
        235,
    );
    const illust = await Canvas.loadImage(BIG_RUN_ILLUST_URL);
    ruleCtx.drawImage(illust, 380, 240, 330, 160);
    ruleCtx.save();
    ruleCtx.beginPath();
    ruleCtx.rect(240, 410, 250, 135);
    if (exists(data) && exists(data.stageImage)) {
        ruleCtx.clip();
        const stageImage = await Canvas.loadImage(data.stageImage);
        ruleCtx.drawImage(stageImage, 240, 410, 250, 135);
    } else {
        ruleCtx.fillStyle = '#000000';
        ruleCtx.fill();
    }
    ruleCtx.restore();
    ruleCtx.save();
    ruleCtx.beginPath();
    createRoundRect(ruleCtx, 1, 1, 718, 548, 30);
    ruleCtx.clip();
    const footer = await Canvas.loadImage(BIG_RUN_FOOTER_URL);
    ruleCtx.drawImage(footer, -5, 400, 730, 160);
    ruleCtx.restore();
    return ruleCanvas.toBuffer();
}
