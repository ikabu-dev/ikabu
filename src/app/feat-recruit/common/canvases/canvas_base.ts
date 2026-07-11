import path from 'path';

import { Member } from '@prisma/client';
import Canvas, { CanvasRenderingContext2D } from 'canvas';

import { createRoundRect, drawArcImage, fillTextWithStroke } from '@/app/common/canvas_components';
import { notExists } from '@/app/common/others';
import { modalRecruit } from '@/constant';

Canvas.registerFont(path.resolve('./fonts/Splatfont.ttf'), { family: 'Splatfont' });
Canvas.registerFont(path.resolve('./fonts/GenShinGothic-P-Medium.ttf'), { family: 'Genshin' });
Canvas.registerFont(path.resolve('./fonts/GenShinGothic-P-Bold.ttf'), { family: 'Genshin-Bold' });
Canvas.registerFont(path.resolve('./fonts/SEGUISYM.TTF'), { family: 'SEGUI' });

export const BLANK_AVATAR_URL =
    'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/blank_avatar.png';

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 550;
const BACKGROUND_X = 1;
const BACKGROUND_Y = 1;
const BACKGROUND_WIDTH = 718;
const BACKGROUND_HEIGHT = 548;
const BACKGROUND_RADIUS = 30;
const BACKGROUND_COLOR = '#2F3136';
const BACKGROUND_BORDER_COLOR = '#FFFFFF';
const BACKGROUND_BORDER_WIDTH = 4;
const AVATAR_BORDER_COLOR = '#1e1f23';
const AVATAR_BORDER_WIDTH = 9;
const TEXT_COLOR = '#FFFFFF';
const TEXT_STROKE_COLOR = '#2D3130';

export type RecruitCanvasOptions = {
    opCode: number;
    remaining: number;
    count: number;
    recruiter: Member;
    users: (Member | null)[];
    condition: string;
    channelName: string | null;
};

export type RecruitCardLayout = {
    recruiterAvatar: { x: number; y: number; radius: number };
    participantCount: number;
    participantAvatar: (index: number) => { x: number; y: number; radius: number };
    squid: { x: number; y: number; width: number; height: number };
    channel: { font: string; x: number; y: number; align?: CanvasTextAlign };
    recruitCount: { font: string; x: number; y: number };
    remaining: { font: string; x: number; y: number };
    conditionTitle: { font: string; x: number; y: number };
    condition: {
        font: string;
        width: number;
        lineHeight: number;
        maxLines: number;
        x: number;
        y: number;
    };
    channelBeforeRecruitCount?: boolean;
};

export function createCanvasContext() {
    const canvas = Canvas.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    return { canvas, ctx: canvas.getContext('2d') };
}

export function drawCanvasBackground(ctx: CanvasRenderingContext2D) {
    createRoundRect(
        ctx,
        BACKGROUND_X,
        BACKGROUND_Y,
        BACKGROUND_WIDTH,
        BACKGROUND_HEIGHT,
        BACKGROUND_RADIUS,
    );
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fill();
    ctx.strokeStyle = BACKGROUND_BORDER_COLOR;
    ctx.lineWidth = BACKGROUND_BORDER_WIDTH;
    ctx.stroke();
}

async function drawAvatar(
    ctx: CanvasRenderingContext2D,
    imageUrl: string,
    x: number,
    y: number,
    radius: number,
) {
    const image = await Canvas.loadImage(imageUrl);
    ctx.save();
    drawArcImage(ctx, image, x, y, radius);
    ctx.strokeStyle = AVATAR_BORDER_COLOR;
    ctx.lineWidth = AVATAR_BORDER_WIDTH;
    ctx.stroke();
    ctx.restore();
}

export async function drawRecruiterAvatar(
    ctx: CanvasRenderingContext2D,
    recruiter: Member,
    position: { x: number; y: number; radius: number },
) {
    await drawAvatar(
        ctx,
        recruiter.iconUrl ?? modalRecruit.placeHold,
        position.x,
        position.y,
        position.radius,
    );
}

export async function drawParticipantAvatars(
    ctx: CanvasRenderingContext2D,
    options: Pick<RecruitCanvasOptions, 'count' | 'users'>,
    layout: Pick<RecruitCardLayout, 'participantCount' | 'participantAvatar'>,
) {
    const memberIcons = options.users
        .filter((user): user is Member => user !== null)
        .map((user) => user.iconUrl ?? modalRecruit.placeHold);

    for (let i = 0; i < layout.participantCount; i++) {
        if (options.count >= i + 2) {
            const position = layout.participantAvatar(i);
            await drawAvatar(
                ctx,
                memberIcons[i] ?? BLANK_AVATAR_URL,
                position.x,
                position.y,
                position.radius,
            );
        }
    }
}

function drawChannelName(
    ctx: CanvasRenderingContext2D,
    channelName: string | null,
    layout: RecruitCardLayout['channel'],
) {
    const channelString = notExists(channelName) ? '🔉 VC指定なし' : '🔉 ' + channelName;
    if (layout.align) {
        ctx.save();
        ctx.textAlign = layout.align;
    }
    fillTextWithStroke(
        ctx,
        channelString,
        layout.font,
        TEXT_COLOR,
        TEXT_STROKE_COLOR,
        1,
        layout.x,
        layout.y,
    );
    if (layout.align) ctx.restore();
}

function drawRecruitCount(
    ctx: CanvasRenderingContext2D,
    opCode: number,
    remaining: number,
    layout: Pick<RecruitCardLayout, 'squid' | 'recruitCount' | 'remaining'>,
) {
    return (async () => {
        const squid = await Canvas.loadImage(
            'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/squid.png',
        );
        ctx.drawImage(
            squid,
            0,
            0,
            squid.width,
            squid.height,
            layout.squid.x,
            layout.squid.y,
            layout.squid.width,
            layout.squid.height,
        );
        fillTextWithStroke(
            ctx,
            '募集人数',
            layout.recruitCount.font,
            TEXT_COLOR,
            TEXT_STROKE_COLOR,
            1,
            layout.recruitCount.x,
            layout.recruitCount.y,
        );

        const remainingString =
            opCode === 0 || opCode === 2
                ? remaining > 0
                    ? '@' + remaining
                    : '満員'
                : opCode === 1
                  ? '受付終了'
                  : 'ERROR!';
        ctx.save();
        ctx.textAlign = 'center';
        fillTextWithStroke(
            ctx,
            remainingString,
            layout.remaining.font,
            TEXT_COLOR,
            TEXT_STROKE_COLOR,
            1,
            layout.remaining.x,
            layout.remaining.y,
        );
        ctx.restore();
    })();
}

function drawCondition(
    ctx: CanvasRenderingContext2D,
    condition: string,
    layout: Pick<RecruitCardLayout, 'conditionTitle' | 'condition'>,
) {
    fillTextWithStroke(
        ctx,
        '参加条件',
        layout.conditionTitle.font,
        TEXT_COLOR,
        TEXT_STROKE_COLOR,
        1,
        layout.conditionTitle.x,
        layout.conditionTitle.y,
    );
    ctx.font = layout.condition.font;
    const columns = [''];
    let line = 0;
    const normalizedCondition = condition.replace(/\\n/g, '\n');
    for (let i = 0; i < normalizedCondition.length; i++) {
        const char = normalizedCondition.charAt(i);
        if (char === '\n') {
            line++;
            columns[line] = '';
        } else if (ctx.measureText(columns[line] + char).width > layout.condition.width) {
            line++;
            columns[line] = char;
        } else {
            columns[line] += char;
        }
    }
    if (columns.length > layout.condition.maxLines) columns[layout.condition.maxLines - 1] += '…';
    for (let i = 0; i < columns.length; i++) {
        if (i < layout.condition.maxLines)
            ctx.fillText(
                columns[i],
                layout.condition.x,
                layout.condition.y + layout.condition.lineHeight * i,
            );
    }
}

export async function drawRecruitCard(
    ctx: CanvasRenderingContext2D,
    options: RecruitCanvasOptions,
    layout: RecruitCardLayout,
    drawHeader: (ctx: CanvasRenderingContext2D) => Promise<void> | void,
    drawExtra?: (ctx: CanvasRenderingContext2D) => Promise<void> | void,
) {
    drawCanvasBackground(ctx);
    await drawHeader(ctx);
    await drawRecruiterAvatar(ctx, options.recruiter, layout.recruiterAvatar);
    await drawParticipantAvatars(ctx, options, layout);
    if (layout.channelBeforeRecruitCount) drawChannelName(ctx, options.channelName, layout.channel);
    await drawRecruitCount(ctx, options.opCode, options.remaining, layout);
    drawCondition(ctx, options.condition, layout);
    if (!layout.channelBeforeRecruitCount)
        drawChannelName(ctx, options.channelName, layout.channel);
    await drawExtra?.(ctx);
    await drawRecruitStamp(ctx, options.opCode);
}

export async function drawRecruitStamp(ctx: CanvasRenderingContext2D, opCode: number) {
    if (opCode === 2) {
        ctx.save();
        ctx.translate(220, -110);
        ctx.rotate((25 * Math.PI) / 180);
        const stamp = await Canvas.loadImage(
            'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/canceled_stamp.png',
        );
        ctx.drawImage(stamp, 0, 0, stamp.width, stamp.height, 0, 0, 600, 600);
        ctx.restore();
    } else if (opCode === 1) {
        ctx.save();
        const stamp = await Canvas.loadImage(
            'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/closed_stamp.png',
        );
        ctx.drawImage(stamp, 0, 0, stamp.width, stamp.height, 130, 80, 500, 340);
        ctx.restore();
    }
}

export type MatchRuleData = {
    startTime: Date;
    endTime: Date;
    rule?: string | null;
    stage1?: string | null;
    stage2?: string | null;
    stageImage1?: string | null;
    stageImage2?: string | null;
};

export async function drawStageRuleCanvas(
    data: MatchRuleData | null,
    values: { date: string; time: string; rule: string; stage1: string; stage2: string },
    drawHeader?: (ctx: CanvasRenderingContext2D) => Promise<void> | void,
    drawAfterStages?: (ctx: CanvasRenderingContext2D) => Promise<void> | void,
) {
    const { canvas, ctx } = createCanvasContext();
    drawCanvasBackground(ctx);
    await drawHeader?.(ctx);
    fillTextWithStroke(ctx, 'ルール', '33px Splatfont', TEXT_COLOR, TEXT_STROKE_COLOR, 1, 35, 80);
    const ruleWidth = ctx.measureText(values.rule).width;
    fillTextWithStroke(
        ctx,
        values.rule,
        '45px Splatfont',
        TEXT_COLOR,
        TEXT_STROKE_COLOR,
        1,
        (320 - ruleWidth) / 2,
        145,
    );
    fillTextWithStroke(ctx, '日時', '32px Splatfont', TEXT_COLOR, TEXT_STROKE_COLOR, 1, 35, 220);
    const dateWidth = ctx.measureText(values.date).width;
    fillTextWithStroke(
        ctx,
        values.date,
        '35px Splatfont',
        TEXT_COLOR,
        TEXT_STROKE_COLOR,
        1,
        (350 - dateWidth) / 2,
        270,
    );
    const timeWidth = ctx.measureText(values.time).width;
    fillTextWithStroke(
        ctx,
        values.time,
        '35px Splatfont',
        TEXT_COLOR,
        TEXT_STROKE_COLOR,
        1,
        15 + (350 - timeWidth) / 2,
        320,
    );
    fillTextWithStroke(
        ctx,
        'ステージ',
        '33px Splatfont',
        TEXT_COLOR,
        TEXT_STROKE_COLOR,
        1,
        35,
        390,
    );
    ctx.save();
    ctx.textAlign = 'center';
    fillTextWithStroke(
        ctx,
        values.stage1,
        '32px Splatfont',
        TEXT_COLOR,
        TEXT_STROKE_COLOR,
        1,
        190,
        440,
    );
    fillTextWithStroke(
        ctx,
        values.stage2,
        '32px Splatfont',
        TEXT_COLOR,
        TEXT_STROKE_COLOR,
        1,
        190,
        490,
    );
    ctx.restore();
    await drawStagePair(ctx, data?.stageImage1, data?.stageImage2);
    await drawAfterStages?.(ctx);
    createRoundRect(
        ctx,
        BACKGROUND_X,
        BACKGROUND_Y,
        BACKGROUND_WIDTH,
        BACKGROUND_HEIGHT,
        BACKGROUND_RADIUS,
    );
    ctx.clip();
    return canvas.toBuffer();
}

async function drawStagePair(
    ctx: CanvasRenderingContext2D,
    stageImage1?: string | null,
    stageImage2?: string | null,
) {
    const positions = [
        { x: 370, y: 130 },
        { x: 370, y: 340 },
    ];
    const urls = stageImage1 && stageImage2 ? [stageImage1, stageImage2] : [null, null];
    for (let i = 0; i < positions.length; i++) {
        ctx.save();
        ctx.beginPath();
        createRoundRect(ctx, positions[i].x, positions[i].y, 308, 176, 10);
        const url = urls[i];
        if (url) {
            ctx.clip();
            const image = await Canvas.loadImage(url);
            ctx.drawImage(image, positions[i].x, positions[i].y, 308, 176);
        } else {
            ctx.fillStyle = '#000000';
            ctx.fill();
        }
        ctx.strokeStyle = BACKGROUND_BORDER_COLOR;
        ctx.lineWidth = 6.0;
        ctx.stroke();
        ctx.restore();
    }
}

export type SalmonRuleData = {
    startTime: Date;
    endTime: Date;
    stage: string;
    stageImage?: string;
    weapon1: string;
    weapon2: string;
    weapon3: string;
    weapon4: string;
};

export type SalmonRuleLayout = {
    dateLabelY: number;
    dateY: number;
    weaponLabelY: number;
    weaponPositions: { x: number; y: number; width: number; height: number }[];
    stageLabelX: number;
    stageLabelY: number;
    stageX: number;
    stageY: number;
    stageImage: { x: number; y: number; width: number; height: number };
    drawExtra?: (ctx: CanvasRenderingContext2D) => Promise<void> | void;
};

export async function drawSalmonRuleCanvas(
    data: SalmonRuleData | null,
    datetime: string,
    errorWeaponUrl: string,
    layout: SalmonRuleLayout,
) {
    const { canvas, ctx } = createCanvasContext();
    const errorWeaponImage = await Canvas.loadImage(errorWeaponUrl);
    const weaponImages = data
        ? await Promise.all(
              [data.weapon1, data.weapon2, data.weapon3, data.weapon4].map((url) =>
                  Canvas.loadImage(url),
              ),
          )
        : [errorWeaponImage, errorWeaponImage, errorWeaponImage, errorWeaponImage];
    const stage = data ? data.stage : 'えらー';
    drawCanvasBackground(ctx);
    fillTextWithStroke(
        ctx,
        '日時',
        '32px Splatfont',
        TEXT_COLOR,
        TEXT_STROKE_COLOR,
        1,
        35,
        layout.dateLabelY,
    );
    const dateWidth = ctx.measureText(datetime).width;
    fillTextWithStroke(
        ctx,
        datetime,
        '37px Splatfont',
        TEXT_COLOR,
        TEXT_STROKE_COLOR,
        1,
        (650 - dateWidth) / 2,
        layout.dateY,
    );
    fillTextWithStroke(
        ctx,
        '武器',
        '32px Splatfont',
        TEXT_COLOR,
        TEXT_STROKE_COLOR,
        1,
        35,
        layout.weaponLabelY,
    );
    weaponImages.forEach((image, index) => {
        const position = layout.weaponPositions[index];
        ctx.drawImage(image, position.x, position.y, position.width, position.height);
    });
    fillTextWithStroke(
        ctx,
        'ステージ',
        '33px Splatfont',
        TEXT_COLOR,
        TEXT_STROKE_COLOR,
        1,
        layout.stageLabelX,
        layout.stageLabelY,
    );
    const stageWidth = ctx.measureText(stage).width;
    fillTextWithStroke(
        ctx,
        stage,
        '38px Splatfont',
        TEXT_COLOR,
        TEXT_STROKE_COLOR,
        1,
        layout.stageX + (700 - stageWidth) / 2,
        layout.stageY,
    );
    const stagePosition = layout.stageImage;
    ctx.save();
    ctx.beginPath();
    createRoundRect(
        ctx,
        stagePosition.x,
        stagePosition.y,
        stagePosition.width,
        stagePosition.height,
        10,
    );
    if (data?.stageImage) {
        ctx.clip();
        const image = await Canvas.loadImage(data.stageImage);
        ctx.drawImage(
            image,
            stagePosition.x,
            stagePosition.y,
            stagePosition.width,
            stagePosition.height,
        );
    } else {
        ctx.fillStyle = '#000000';
        ctx.fill();
    }
    ctx.strokeStyle = BACKGROUND_BORDER_COLOR;
    ctx.lineWidth = 6.0;
    ctx.stroke();
    ctx.restore();
    await layout.drawExtra?.(ctx);
    createRoundRect(
        ctx,
        BACKGROUND_X,
        BACKGROUND_Y,
        BACKGROUND_WIDTH,
        BACKGROUND_HEIGHT,
        BACKGROUND_RADIUS,
    );
    ctx.clip();
    return canvas.toBuffer();
}
