import path from 'path';

import { Member } from '@prisma/client';
import Canvas from 'canvas';

import { SalmonInfo } from '@/app/common/apis/splatoon3.ink/splatoon3_ink.js';
import { createRoundRect, drawArcImage, fillTextWithStroke } from '@/app/common/canvas_components';
import { dateformat, formatDatetime } from '@/app/common/convert_datetime';
import { exists, notExists } from '@/app/common/others.js';
import { modalRecruit, placeHold } from '@/constant.js';

import { RecruitOpCode } from './regenerate_canvas.js';

Canvas.registerFont(path.resolve('./fonts/Splatfont.ttf'), {
    family: 'Splatfont',
});
Canvas.registerFont(path.resolve('./fonts/GenShinGothic-P-Medium.ttf'), {
    family: 'Genshin',
});
Canvas.registerFont(path.resolve('./fonts/GenShinGothic-P-Bold.ttf'), {
    family: 'Genshin-Bold',
});
Canvas.registerFont(path.resolve('./fonts/SEGUISYM.TTF'), { family: 'SEGUI' });

/*
 * 募集用のキャンバス(1枚目)を作成する
 */
export async function recruitSalmonCanvas(
    opCode: number,
    remaining: number,
    count: number,
    recruiter: Member,
    user1: Member | null,
    user2: Member | null,
    user3: Member | null,
    condition: string,
    channelName: string | null,
    subTitle?: string,
) {
    const blankAvatarUrl =
        'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/blank_avatar.png'; // blankのアバター画像URL

    const recruitCanvas = Canvas.createCanvas(720, 550);
    const recruitCtx = recruitCanvas.getContext('2d');

    // 下地
    createRoundRect(recruitCtx, 1, 1, 718, 548, 30);
    recruitCtx.fillStyle = '#2F3136';
    recruitCtx.fill();
    recruitCtx.strokeStyle = '#FFFFFF';
    recruitCtx.lineWidth = 4;
    recruitCtx.stroke();

    const salmonIcon = await Canvas.loadImage(
        'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/salmon_black_icon.png',
    );
    recruitCtx.drawImage(salmonIcon, 22, 32, 82, 60);

    fillTextWithStroke(recruitCtx, 'SALMON', '51px Splatfont', '#000000', '#FF9900', 3, 115, 80);
    fillTextWithStroke(recruitCtx, 'RUN', '51px Splatfont', '#000000', '#00FF00DA', 3, 350, 80);

    if (typeof subTitle === 'string') {
        fillTextWithStroke(
            recruitCtx,
            subTitle,
            '49px Splatfont',
            '#000000',
            '#FFD900FB',
            3,
            510,
            80,
        );
    }

    // 募集主の画像
    const recruiterImage = await Canvas.loadImage(recruiter.iconUrl ?? modalRecruit.placeHold);
    recruitCtx.save();
    drawArcImage(recruitCtx, recruiterImage, 40, 120, 50);
    recruitCtx.strokeStyle = '#1e1f23';
    recruitCtx.lineWidth = 9;
    recruitCtx.stroke();
    recruitCtx.restore();

    const memberIcons = [];

    if (exists(user1)) {
        memberIcons.push(user1.iconUrl ?? modalRecruit.placeHold);
    }

    if (exists(user2)) {
        memberIcons.push(user2.iconUrl ?? modalRecruit.placeHold);
    }

    if (exists(user3)) {
        memberIcons.push(user3.iconUrl ?? modalRecruit.placeHold);
    }

    for (let i = 0; i < 4; i++) {
        if (count >= i + 2) {
            const userUrl = memberIcons[i] ?? blankAvatarUrl;
            const userImage = await Canvas.loadImage(userUrl);
            recruitCtx.save();
            drawArcImage(recruitCtx, userImage, i * 118 + 158, 120, 50);
            recruitCtx.strokeStyle = '#1e1f23';
            recruitCtx.lineWidth = 9;
            recruitCtx.stroke();
            recruitCtx.restore();
        }
    }

    const recruiterIcon = await Canvas.loadImage(
        'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/squid.png',
    );
    recruitCtx.drawImage(
        recruiterIcon,
        0,
        0,
        recruiterIcon.width,
        recruiterIcon.height,
        90,
        172,
        75,
        75,
    );

    fillTextWithStroke(
        recruitCtx,
        '募集人数',
        '39px "Splatfont"',
        '#FFFFFF',
        '#2D3130',
        1,
        525,
        155,
    );

    let remainingString;
    if (opCode === RecruitOpCode.open || opCode === RecruitOpCode.cancel) {
        remainingString = remaining > 0 ? '@' + remaining : '満員';
    } else if (opCode === RecruitOpCode.close) {
        remainingString = '受付終了';
    } else {
        remainingString = 'ERROR!';
    }

    recruitCtx.save();
    recruitCtx.textAlign = 'center';
    fillTextWithStroke(
        recruitCtx,
        remainingString,
        '42px "Splatfont"',
        '#FFFFFF',
        '#2D3130',
        1,
        605,
        218,
    );
    recruitCtx.restore();

    fillTextWithStroke(
        recruitCtx,
        '参加条件',
        '43px "Splatfont"',
        '#FFFFFF',
        '#2D3130',
        1,
        35,
        290,
    );

    recruitCtx.font = '30px "Genshin", "SEGUI"';
    const width = 600;
    const size = 40;
    const columnNum = 4;
    const column = [''];
    let line = 0;
    condition = condition.replace(/\\n/g, '\n');

    // 幅に合わせて自動改行
    for (let i = 0; i < condition.length; i++) {
        const char = condition.charAt(i);

        if (char == '\n') {
            line++;
            column[line] = '';
        } else if (recruitCtx.measureText(column[line] + char).width > width) {
            line++;
            column[line] = char;
        } else {
            column[line] += char;
        }
    }

    if (column.length > columnNum) {
        column[columnNum - 1] += '…';
    }

    for (let j = 0; j < column.length; j++) {
        if (j < columnNum) {
            recruitCtx.fillText(column[j], 65, 345 + size * j);
        }
    }

    let channelString;
    if (notExists(channelName)) {
        channelString = '🔉 VC指定なし';
    } else {
        channelString = '🔉 ' + channelName;
    }

    fillTextWithStroke(
        recruitCtx,
        channelString,
        '37px "Splatfont"',
        '#FFFFFF',
        '#2D3130',
        1,
        30,
        520,
    );

    if (opCode === RecruitOpCode.cancel) {
        recruitCtx.save();
        recruitCtx.translate(220, -110);
        recruitCtx.rotate((25 * Math.PI) / 180);
        const cancelStamp = await Canvas.loadImage(
            'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/canceled_stamp.png',
        );
        recruitCtx.drawImage(
            cancelStamp,
            0,
            0,
            cancelStamp.width,
            cancelStamp.height,
            0,
            0,
            600,
            600,
        );
        recruitCtx.restore;
    } else if (opCode === RecruitOpCode.close) {
        recruitCtx.save();
        const cancelStamp = await Canvas.loadImage(
            'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/closed_stamp.png',
        );
        recruitCtx.drawImage(
            cancelStamp,
            0,
            0,
            cancelStamp.width,
            cancelStamp.height,
            130,
            80,
            500,
            340,
        );
        recruitCtx.restore;
    }

    const recruit = recruitCanvas.toBuffer();
    return recruit;
}

/*
 * ルール情報のキャンバス(2枚目)を作成する
 */
export async function ruleSalmonCanvas(data: SalmonInfo | null) {
    const ruleCanvas = Canvas.createCanvas(720, 550);
    const ruleCtx = ruleCanvas.getContext('2d');
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

    createRoundRect(ruleCtx, 1, 1, 718, 548, 30);
    ruleCtx.fillStyle = '#2F3136';
    ruleCtx.fill();
    ruleCtx.strokeStyle = '#FFFFFF';
    ruleCtx.lineWidth = 4;
    ruleCtx.stroke();

    fillTextWithStroke(ruleCtx, '日時', '32px Splatfont', '#FFFFFF', '#2D3130', 1, 35, 80);

    const dateWidth = ruleCtx.measureText(datetime).width;
    fillTextWithStroke(
        ruleCtx,
        datetime,
        '37px Splatfont',
        '#FFFFFF',
        '#2D3130',
        1,
        (650 - dateWidth) / 2,
        145,
    );

    fillTextWithStroke(ruleCtx, '武器', '32px Splatfont', '#FFFFFF', '#2D3130', 1, 35, 245);

    ruleCtx.drawImage(weapon1Image, 50, 280, 110, 110);
    ruleCtx.drawImage(weapon2Image, 190, 280, 110, 110);
    ruleCtx.drawImage(weapon3Image, 50, 410, 110, 110);
    ruleCtx.drawImage(weapon4Image, 190, 410, 110, 110);

    fillTextWithStroke(ruleCtx, 'ステージ', '33px Splatfont', '#FFFFFF', '#2D3130', 1, 350, 245);

    const stageWidth = ruleCtx.measureText(stage).width;
    fillTextWithStroke(
        ruleCtx,
        stage,
        '38px Splatfont',
        '#FFFFFF',
        '#2D3130',
        1,
        150 + (700 - stageWidth) / 2,
        300,
    );

    if (exists(data) && exists(data.stageImage)) {
        const stageImage = await Canvas.loadImage(data.stageImage);
        ruleCtx.save();
        ruleCtx.beginPath();
        createRoundRect(ruleCtx, 370, 340, 308, 176, 10);
        ruleCtx.clip();
        ruleCtx.drawImage(stageImage, 370, 340, 308, 176);
        ruleCtx.strokeStyle = '#FFFFFF';
        ruleCtx.lineWidth = 6.0;
        ruleCtx.stroke();
        ruleCtx.restore();
    } else {
        ruleCtx.save();
        ruleCtx.beginPath();
        createRoundRect(ruleCtx, 370, 340, 308, 176, 10);
        ruleCtx.fillStyle = '#000000';
        ruleCtx.fill();
        ruleCtx.strokeStyle = '#FFFFFF';
        ruleCtx.lineWidth = 6.0;
        ruleCtx.stroke();
        ruleCtx.restore();
    }

    createRoundRect(ruleCtx, 1, 1, 718, 548, 30);
    ruleCtx.clip();

    const buffer = ruleCanvas.toBuffer();
    return buffer;
}
