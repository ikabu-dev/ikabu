import Canvas from 'canvas';

import { EventMatchInfo } from '@/app/common/apis/splatoon3.ink/splatoon3_ink';
import { fillTextWithStroke } from '@/app/common/canvas_components';
import { dateformat, formatDatetime } from '@/app/common/convert_datetime';

import {
    RecruitCanvasOptions,
    RecruitCardLayout,
    createCanvasContext,
    drawRecruitCard,
    drawStageRuleCanvas,
} from './canvas_base';

const EVENT_ICON_URL =
    'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/event_icon.png';
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
export type RecruitEventCanvasOptions = RecruitCanvasOptions;
export async function recruitEventCanvas(options: RecruitEventCanvasOptions) {
    const { canvas, ctx } = createCanvasContext();
    await drawRecruitCard(ctx, options, RECRUIT_LAYOUT, async (context) => {
        const icon = await Canvas.loadImage(EVENT_ICON_URL);
        context.drawImage(icon, 19, 19, 77, 77);
        fillTextWithStroke(
            context,
            'イベントマッチ',
            '51px Splatfont',
            '#000000',
            '#FF2F82',
            3,
            112,
            80,
        );
    });
    return canvas.toBuffer();
}
export async function ruleEventCanvas(eventData: EventMatchInfo | null) {
    return drawStageRuleCanvas(
        eventData,
        {
            date: eventData ? formatDatetime(eventData.startTime, dateformat.ymdw) : 'えらー',
            time: eventData
                ? formatDatetime(eventData.startTime, dateformat.hm) +
                  ' - ' +
                  formatDatetime(eventData.endTime, dateformat.hm)
                : 'えらー',
            rule: eventData?.rule ?? 'えらー',
            stage1: eventData?.stage1 ?? 'えらー',
            stage2: eventData?.stage2 ?? 'えらー',
        },
        (context) => {
            context.save();
            context.textAlign = 'right';
            fillTextWithStroke(
                context,
                eventData?.title ?? 'えらー',
                '38px Splatfont',
                '#FFE02EFB',
                '#2D3130',
                1,
                690,
                65,
            );
            context.restore();
        },
    );
}
