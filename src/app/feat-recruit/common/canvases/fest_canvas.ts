import Canvas from 'canvas';

import { MatchInfo } from '@/app/common/apis/splatoon3.ink/splatoon3_ink';
import { fillTextWithStroke } from '@/app/common/canvas_components';
import { dateformat, formatDatetime } from '@/app/common/convert_datetime';

import {
    RecruitCanvasOptions,
    RecruitCardLayout,
    createCanvasContext,
    drawRecruitCard,
    drawStageRuleCanvas,
} from './canvas_base';

const FEST_ICON_URL =
    'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/fes_icon.png';
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
export type RecruitFestCanvasOptions = RecruitCanvasOptions & { team: string; color: string };
export async function recruitFestCanvas(options: RecruitFestCanvasOptions) {
    const { canvas, ctx } = createCanvasContext();
    await drawRecruitCard(ctx, options, RECRUIT_LAYOUT, async (context) => {
        const icon = await Canvas.loadImage(FEST_ICON_URL);
        context.drawImage(icon, 17, 20, 85, 85);
        fillTextWithStroke(
            context,
            'フェスマッチ',
            '51px Splatfont',
            '#000000',
            options.color,
            3,
            115,
            80,
        );
        context.save();
        context.textAlign = 'right';
        fillTextWithStroke(
            context,
            options.team,
            '48px Splatfont',
            options.color,
            '#222222',
            1.7,
            690,
            80,
        );
        context.restore();
    });
    return canvas.toBuffer();
}
export async function ruleFestCanvas(fesData: MatchInfo | null) {
    return drawStageRuleCanvas(fesData, {
        date: fesData ? formatDatetime(fesData.startTime, dateformat.ymdw) : 'えらー',
        time: fesData
            ? formatDatetime(fesData.startTime, dateformat.hm) +
              ' - ' +
              formatDatetime(fesData.endTime, dateformat.hm)
            : 'えらー',
        rule: fesData?.rule ?? 'えらー',
        stage1: fesData?.stage1 ?? 'えらー',
        stage2: fesData?.stage2 ?? 'えらー',
    });
}
