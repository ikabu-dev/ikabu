import Canvas from 'canvas';

import { SalmonInfo } from '@/app/common/apis/splatoon3.ink/splatoon3_ink.js';
import { fillTextWithStroke } from '@/app/common/canvas_components';
import { dateformat, formatDatetime } from '@/app/common/convert_datetime';
import { placeHold } from '@/constant.js';

import {
    RecruitCanvasOptions,
    RecruitCardLayout,
    SalmonRuleLayout,
    createCanvasContext,
    drawRecruitCard,
    drawSalmonRuleCanvas,
} from './canvas_base.js';

const SALMON_ICON_URL =
    'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/salmon_black_icon.png';
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
const RULE_LAYOUT: SalmonRuleLayout = {
    dateLabelY: 80,
    dateY: 145,
    weaponLabelY: 245,
    weaponPositions: [
        { x: 50, y: 280, width: 110, height: 110 },
        { x: 190, y: 280, width: 110, height: 110 },
        { x: 50, y: 410, width: 110, height: 110 },
        { x: 190, y: 410, width: 110, height: 110 },
    ],
    stageLabelX: 350,
    stageLabelY: 245,
    stageX: 150,
    stageY: 300,
    stageImage: { x: 370, y: 340, width: 308, height: 176 },
};
export type RecruitSalmonCanvasOptions = RecruitCanvasOptions & { subTitle?: string };
export async function recruitSalmonCanvas(options: RecruitSalmonCanvasOptions) {
    const { canvas, ctx } = createCanvasContext();
    await drawRecruitCard(ctx, options, RECRUIT_LAYOUT, async (context) => {
        const icon = await Canvas.loadImage(SALMON_ICON_URL);
        context.drawImage(icon, 22, 32, 82, 60);
        fillTextWithStroke(context, 'SALMON', '51px Splatfont', '#000000', '#FF9900', 3, 115, 80);
        fillTextWithStroke(context, 'RUN', '51px Splatfont', '#000000', '#00FF00DA', 3, 350, 80);
        if (typeof options.subTitle === 'string')
            fillTextWithStroke(
                context,
                options.subTitle,
                '49px Splatfont',
                '#000000',
                '#FFD900FB',
                3,
                510,
                80,
            );
    });
    return canvas.toBuffer();
}
export async function ruleSalmonCanvas(data: SalmonInfo | null) {
    const datetime = data
        ? formatDatetime(data.startTime, dateformat.mdwhm) +
          ' - ' +
          formatDatetime(data.endTime, dateformat.mdwhm)
        : 'えらー';
    return drawSalmonRuleCanvas(data, datetime, placeHold.error100x100, RULE_LAYOUT);
}
