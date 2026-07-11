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

const ANARCHY_ICON_URL =
    'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/anarchy_icon.png';
const RULE_ICON_X = 570;
const RULE_ICON_Y = 10;
const RULE_ICON_WIDTH = 120;
const RULE_ICON_HEIGHT = 120;
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
export type RecruitAnarchyCanvasOptions = RecruitCanvasOptions & { rank: string | null };

export async function recruitAnarchyCanvas(options: RecruitAnarchyCanvasOptions) {
    const { canvas, ctx } = createCanvasContext();
    await drawRecruitCard(
        ctx,
        options,
        RECRUIT_LAYOUT,
        async (context) => {
            const icon = await Canvas.loadImage(ANARCHY_ICON_URL);
            context.drawImage(icon, 18, 15, 86, 86);
            fillTextWithStroke(
                context,
                'バンカラマッチ',
                '51px Splatfont',
                '#000000',
                '#F14400',
                3,
                115,
                80,
            );
        },
        (context) => {
            context.save();
            context.textAlign = 'right';
            fillTextWithStroke(
                context,
                '募集ウデマエ: ' + (options.rank ?? 'ERROR'),
                '38px "Splatfont"',
                '#FFFFFF',
                '#2D3130',
                1,
                690,
                520,
            );
            context.restore();
        },
    );
    return canvas.toBuffer();
}

export async function ruleAnarchyCanvas(anarchyData: MatchInfo | null, ruleIconURL: string) {
    return drawStageRuleCanvas(
        anarchyData,
        {
            date: anarchyData ? formatDatetime(anarchyData.startTime, dateformat.ymdw) : 'えらー',
            time: anarchyData
                ? formatDatetime(anarchyData.startTime, dateformat.hm) +
                  ' - ' +
                  formatDatetime(anarchyData.endTime, dateformat.hm)
                : 'えらー',
            rule: anarchyData?.rule ?? 'えらー',
            stage1: anarchyData?.stage1 ?? 'えらー',
            stage2: anarchyData?.stage2 ?? 'えらー',
        },
        undefined,
        async (context) => {
            const image = await Canvas.loadImage(ruleIconURL);
            context.save();
            context.drawImage(
                image,
                0,
                0,
                image.width,
                image.height,
                RULE_ICON_X,
                RULE_ICON_Y,
                RULE_ICON_WIDTH,
                RULE_ICON_HEIGHT,
            );
            context.restore();
        },
    );
}
