import Canvas from 'canvas';
import { getUnixTime } from 'date-fns';
import {
    EmbedBuilder,
    AttachmentBuilder,
    ChatInputCommandInteraction,
    CacheType,
} from 'discord.js';

import {
    getSchedule,
    checkFes,
    getFesRegularData,
    getRegularData,
    getSalmonData,
    getAnarchyChallengeData,
    getAnarchyOpenData,
    getXMatchData,
    inFallbackMode,
} from '@/app/common/apis/splatoon3.ink/splatoon3_ink';
import { Sp3Schedule } from '@/app/common/apis/splatoon3.ink/types/schedule';
import { createRoundRect, fillTextWithStroke } from '@/app/common/canvas_components';
import { formatDatetime, dateformat } from '@/app/common/convert_datetime.js';
import { assertExistCheck, rule2image } from '@/app/common/others';
import { ErrorTexts } from '@/app/constant/error_texts';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { log4js_obj } from '@/log4js_settings';

const logger = log4js_obj.getLogger('interaction');

export async function handleShow(interaction: ChatInputCommandInteraction<CacheType>) {
    try {
        // 'インタラクションに失敗'が出ないようにするため
        await interaction.deferReply();
        const { options } = interaction;
        const subCommand = options.getSubcommand();
        const schedule = await getSchedule();

        if (inFallbackMode) {
            return interaction.editReply('現在スケジュール情報が取得できないでし！');
        }

        if (subCommand === `now`) {
            if (checkFes(schedule, 0)) {
                await sendFesInfo(interaction, schedule, 0);
            } else {
                await sendStageInfo(interaction, schedule, 0);
            }
        } else if (subCommand === 'next') {
            if (checkFes(schedule, 1)) {
                await sendFesInfo(interaction, schedule, 1);
            } else {
                await sendStageInfo(interaction, schedule, 1);
            }
        } else if (subCommand === 'nawabari') {
            if (checkFes(schedule, 1)) {
                await sendFesInfo(interaction, schedule, 0);
            } else {
                await sendRegularInfo(interaction, schedule, 0);
            }
        } else if (subCommand === 'run') {
            await sendRunInfo(interaction, schedule);
        }
    } catch (error) {
        await interaction.followUp(ErrorTexts.UndefinedError);
        await sendErrorLogs(logger, error);
    }
}

async function sendStageInfo(
    interaction: ChatInputCommandInteraction<CacheType>,
    schedule: Sp3Schedule,
    scheduleNum: number,
) {
    let title;
    if (scheduleNum == 0) {
        title = '現在';
    } else {
        title = '次';
    }

    // const leagueData = await getLeagueData(data, scheduleNum);
    const challengeData = await getAnarchyChallengeData(schedule, scheduleNum);
    const openData = await getAnarchyOpenData(schedule, scheduleNum);
    const xData = await getXMatchData(schedule, scheduleNum);
    assertExistCheck(challengeData, 'challengeData');
    assertExistCheck(openData, 'openData');
    assertExistCheck(xData, 'xData');

    // const lThumbnail = rule2image(leagueData.rule);
    const cThumbnail = rule2image(challengeData.rule);
    const oThumbnail = rule2image(openData.rule);
    const xThumbnail = rule2image(xData.rule);

    const challengeStartDate = formatDatetime(challengeData.startTime, dateformat.ymdwhm);
    const challengeEndDate = formatDatetime(challengeData.endTime, dateformat.hm);
    const challengeEmbed = new EmbedBuilder()
        .setAuthor({
            name: title + 'のバンカラマッチ (チャレンジ)',
            iconURL:
                'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/anarchy_icon.png',
        })
        .setColor('#F54910')
        .addFields({
            name: challengeStartDate + '-' + challengeEndDate,
            value: challengeData.stage1 + '／' + challengeData.stage2,
        })
        .setThumbnail(cThumbnail);

    const openStartDate = formatDatetime(openData.startTime, dateformat.ymdwhm);
    const openEndDate = formatDatetime(openData.endTime, dateformat.hm);
    const openEmbed = new EmbedBuilder()
        .setAuthor({
            name: title + 'のバンカラマッチ (オープン)',
            iconURL:
                'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/anarchy_icon.png',
        })
        .setColor('#F54910')
        .addFields({
            name: openStartDate + '-' + openEndDate,
            value: openData.stage1 + '／' + openData.stage2,
        })
        .setThumbnail(oThumbnail);

    const xStartDate = formatDatetime(xData.startTime, dateformat.ymdwhm);
    const xEndDate = formatDatetime(xData.endTime, dateformat.hm);
    const xMatchEmbed = new EmbedBuilder()
        .setAuthor({
            name: title + 'のXマッチ',

            iconURL:
                'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/x_match_icon.png',
        })
        .setColor('#0edb9b')
        .addFields({
            name: xStartDate + '-' + xEndDate,
            value: xData.stage1 + '／' + xData.stage2,
        })
        .setThumbnail(xThumbnail);

    await interaction.editReply({
        embeds: [xMatchEmbed, challengeEmbed, openEmbed],
    });
}

async function sendRegularInfo(
    interaction: ChatInputCommandInteraction<CacheType>,
    data: Sp3Schedule,
    scheduleNum: number,
) {
    const regularData = await getRegularData(data, scheduleNum);
    assertExistCheck(regularData, 'regularData');
    const startDate = formatDatetime(regularData.startTime, dateformat.ymdwhm);
    const endDate = formatDatetime(regularData.endTime, dateformat.hm);

    let title = '';
    if (scheduleNum == 0) {
        title = '現在';
    } else {
        title = '次';
    }

    const regularEmbed = new EmbedBuilder()
        .setAuthor({
            name: title + 'のレギュラーマッチ',
            iconURL:
                'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/regular_icon.png',
        })
        .setColor('#B3FF00')
        .addFields({
            name: startDate + '-' + endDate,
            value: regularData.stage1 + '／' + regularData.stage2,
        })
        .setThumbnail(
            'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/regular_icon.png',
        );

    await interaction.editReply({
        embeds: [regularEmbed],
    });
}

async function sendFesInfo(
    interaction: ChatInputCommandInteraction<CacheType>,
    data: Sp3Schedule,
    scheduleNum: number,
) {
    const festData = await getFesRegularData(data, scheduleNum);
    assertExistCheck(festData, 'festData');
    const startDate = formatDatetime(festData.startTime, dateformat.ymdwhm);
    const endDate = formatDatetime(festData.endTime, dateformat.hm);

    let title = '';
    if (scheduleNum == 0) {
        title = '現在';
    } else {
        title = '次';
    }

    const fesEmbed = new EmbedBuilder()
        .setAuthor({
            name: title + 'のフェスマッチ',
            iconURL:
                'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/fes_icon.png',
        })
        .setColor('#ead147')
        .addFields({
            name: startDate + '-' + endDate,
            value: festData.stage1 + '／' + festData.stage2,
        })
        .setThumbnail(
            'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/fes_icon.png',
        );

    await interaction.editReply({
        embeds: [fesEmbed],
    });
}

async function sendRunInfo(
    interaction: ChatInputCommandInteraction<CacheType>,
    schedule: Sp3Schedule,
) {
    try {
        for (let i = 0; i < 2; i++) {
            let title = '';
            if (i == 0) {
                title = '現在';
            } else if (i == 1) {
                title = '次';
            }
            const salmonData = await getSalmonData(schedule, i);
            assertExistCheck(salmonData, 'salmonData');
            const startDate = formatDatetime(salmonData.startTime, dateformat.ymdwhm);
            const endDate = formatDatetime(salmonData.endTime, dateformat.ymdwhm);

            const weaponsImage = new AttachmentBuilder(
                await salmonWeaponCanvas(
                    salmonData.weapon1,
                    salmonData.weapon2,
                    salmonData.weapon3,
                    salmonData.weapon4,
                ),
                {
                    name: 'weapons.png',
                    description: '',
                },
            );

            const salmonEmbed = new EmbedBuilder()
                .setAuthor({
                    name: title + 'のSALMON RUN',
                    iconURL:
                        'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/salmon_black_icon.png',
                })
                .setTitle(salmonData.stage)
                .setColor('#FC892C')
                .addFields(
                    {
                        name: '開始日時',
                        value:
                            startDate +
                            '【' +
                            `<t:${getUnixTime(new Date(salmonData.startTime))}:R>` +
                            '】',
                    },
                    {
                        name: '終了日時',
                        value:
                            endDate +
                            '【' +
                            `<t:${getUnixTime(new Date(salmonData.endTime))}:R>` +
                            '】',
                    },
                )
                .setImage('attachment://weapons.png')
                .setThumbnail(
                    'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/salmon_black_icon.png',
                );

            if (i == 0) {
                await interaction.editReply({
                    embeds: [salmonEmbed],
                    files: [weaponsImage],
                });
            } else {
                await interaction.followUp({
                    embeds: [salmonEmbed],
                    files: [weaponsImage],
                });
            }
        }
    } catch (error) {
        await interaction.followUp(ErrorTexts.UndefinedError);
        await sendErrorLogs(logger, error);
    }
}

/*
 * ルール情報のキャンバス(2枚目)を作成する
 */
async function salmonWeaponCanvas(
    weapon1: string,
    weapon2: string,
    weapon3: string,
    weapon4: string,
) {
    const canvas_width = 650;
    const canvas_height = 220;
    const weaponCanvas = Canvas.createCanvas(canvas_width, canvas_height);
    const weapon_ctx = weaponCanvas.getContext('2d');

    createRoundRect(weapon_ctx, 1, 1, canvas_width - 2, canvas_height - 2, 0);
    weapon_ctx.fillStyle = '#2F313600';
    weapon_ctx.fill();

    fillTextWithStroke(weapon_ctx, '武器', '32px Splatfont', '#FFFFFF', '#2D3130', 1, 35, 45);

    const weapon1_img = await Canvas.loadImage(weapon1);
    const weapon1_dx = 80;
    const weapon_dy = 70;
    weapon_ctx.drawImage(weapon1_img, weapon1_dx, weapon_dy, 110, 110);

    const weapon2_img = await Canvas.loadImage(weapon2);
    weapon_ctx.drawImage(weapon2_img, weapon1_dx + 140, weapon_dy, 110, 110);

    const weapon3_img = await Canvas.loadImage(weapon3);
    weapon_ctx.drawImage(weapon3_img, weapon1_dx + 280, weapon_dy, 110, 110);

    const weapon4_img = await Canvas.loadImage(weapon4);
    weapon_ctx.drawImage(weapon4_img, weapon1_dx + 420, weapon_dy, 110, 110);

    createRoundRect(weapon_ctx, 1, 1, canvas_width - 2, canvas_height - 2, 30);
    weapon_ctx.clip();

    return weaponCanvas.toBuffer();
}
