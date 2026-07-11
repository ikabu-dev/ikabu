import Canvas from 'canvas';

import { MatchInfo } from '@/app/common/apis/splatoon3.ink/splatoon3_ink.js';
import { fillTextWithStroke } from '@/app/common/canvas_components';
import { dateformat, formatDatetime } from '@/app/common/convert_datetime';

import {
    RecruitCanvasOptions,
    RecruitCardLayout,
    createCanvasContext,
    drawRecruitCard,
    drawStageRuleCanvas,
} from './canvas_base.js';

const REGULAR_ICON_URL =
    'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/regular_icon.png';
const RECRUIT_LAYOUT: RecruitCardLayout = {
    recruiterAvatar: { x: 40, y: 120, radius: 40 },
    participantCount: 7,
    participantAvatar: (index) =>
        index < 3
            ? { x: (index + 1) * 100 + 40, y: 120, radius: 40 }
            : { x: (index - 3) * 100 + 40, y: 220, radius: 40 },
    squid: { x: 75, y: 155, width: 75, height: 75 },
    channel: { font: '33px "Splatfont"', x: 680, y: 70, align: 'right' },
    recruitCount: { font: '41px "Splatfont"', x: 490, y: 185 },
    remaining: { font: '43px "Splatfont"', x: 560, y: 248 },
    conditionTitle: { font: '43px "Splatfont"', x: 35, y: 360 },
    condition: {
        font: '31px "Genshin", "SEGUI"',
        width: 603,
        lineHeight: 40,
        maxLines: 3,
        x: 65,
        y: 415,
    },
    channelBeforeRecruitCount: true,
};
export type RecruitRegularCanvasOptions = RecruitCanvasOptions;
export async function recruitRegularCanvas(options: RecruitRegularCanvasOptions) {
    const { canvas, ctx } = createCanvasContext();
    await drawRecruitCard(ctx, options, RECRUIT_LAYOUT, async (context) => {
        const icon = await Canvas.loadImage(REGULAR_ICON_URL);
        context.drawImage(icon, 25, 25, 75, 75);
        fillTextWithStroke(
            context,
            'レギュラーマッチ',
            '51px Splatfont',
            '#000000',
            '#B3FF00',
            3,
            115,
            80,
        );
    });
    return canvas.toBuffer();
}
export async function ruleRegularCanvas(regularData: MatchInfo | null) {
    return drawStageRuleCanvas(regularData, {
        date: regularData ? formatDatetime(regularData.startTime, dateformat.ymdw) : 'えらー',
        time: regularData
            ? formatDatetime(regularData.startTime, dateformat.hm) +
              ' - ' +
              formatDatetime(regularData.endTime, dateformat.hm)
            : 'えらー',
        rule: regularData?.rule ?? 'えらー',
        stage1: regularData?.stage1 ?? 'えらー',
        stage2: regularData?.stage2 ?? 'えらー',
    });
}
