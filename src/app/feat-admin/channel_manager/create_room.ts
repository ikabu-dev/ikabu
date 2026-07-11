import fs from 'fs';
import { request } from 'http';

import { parse } from 'csv';
import { stringify } from 'csv-stringify/sync';
import {
    AttachmentBuilder,
    ChannelType,
    ChatInputCommandInteraction,
    Guild,
    PermissionsBitField,
    Role,
} from 'discord.js';

import { createChannel } from '@/app/common/manager/channel_manager';
import { getGuildByInteraction } from '@/app/common/manager/guild_manager';
import { searchAPIMemberById } from '@/app/common/manager/member_manager';
import {
    createRole,
    searchRoleById,
    setColorToRole,
    setRoleToMember,
} from '@/app/common/manager/role_manager';
import { assertExistCheck, exists, notExists } from '@/app/common/others';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { log4js_obj } from '@/log4js_settings';

// const INDEX_CATEGORY_ID = 0;
const INDEX_CATEGORY_NAME = 1;
// const INDEX_CHANNEL_ID = 2;
const INDEX_CHANNEL_NAME = 3;
const INDEX_CHANNEL_TYPE = 4;
// const INDEX_ROLE_ID = 5;
const INDEX_ROLE_NAME = 6;
const INDEX_COLOR_CODE = 7;
const INDEX_MEMBER_ID_START = 8;

const logger = log4js_obj.getLogger('ChannelManager');

export async function handleCreateRoom(interaction: ChatInputCommandInteraction<'cached' | 'raw'>) {
    // 'インタラクションに失敗'が出ないようにするため
    await interaction.deferReply();
    const { options } = interaction;
    const attachment = options.getAttachment('csv', true);
    const guild = await getGuildByInteraction(interaction);
    const member = await searchAPIMemberById(guild, interaction.member.user.id);
    assertExistCheck(member, 'member');
    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return await interaction.editReply('チャンネルを管理する権限がないでし！');
    }

    if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return await interaction.editReply('ロールを管理する権限がないでし！');
    }

    if (!attachment.size) {
        return await interaction.editReply('CSVファイルを添付するでし！');
    }

    await interaction.editReply('作成中でし！\nこの作業には時間がかかるでし！');

    try {
        request(attachment.url).pipe(
            parse(async function (err, data) {
                // i = CSV行数
                // data[i][0] カテゴリID (カテゴリには権限がつかない)
                // data[i][1] カテゴリ名 (空の場合カテゴリなし)
                // data[i][2] チャンネルID
                // data[i][3] チャンネル名 (空の場合チャンネルなし & ロール紐付けなし)
                // data[i][4] チャンネルタイプ ('TEXT' or 'VOICE')
                // data[i][5] ロールID
                // data[i][6] ロール名 (空の場合ロールなし)
                // data[i][7] ロールカラーコード (空の場合ランダムでカラーコードを割り当て)
                // data[i][8...n] メンバーID

                if (data == undefined) {
                    return await interaction.followUp(
                        'CSVファイルがおかしいでし！\n要素数が全ての行で同じになっているか確認するでし！',
                    );
                }

                const resultData: string[][] = [];

                const guild = await getGuildByInteraction(interaction);

                resultData.push([
                    'カテゴリID',
                    'カテゴリ名',
                    'チャンネルID',
                    'チャンネル名',
                    'チャンネルタイプ',
                    'ロールID',
                    'ロール名',
                    'ロールカラー',
                ]);

                await interaction.editReply('0% 完了');

                let maxColumn = 0;

                for (let i = 1; i < data.length; i++) {
                    try {
                        const categoryName = data[i][INDEX_CATEGORY_NAME];
                        const channelName = data[i][INDEX_CHANNEL_NAME];
                        const channelType = data[i][INDEX_CHANNEL_TYPE];
                        let channelId = null;
                        const roleName = data[i][INDEX_ROLE_NAME];
                        let roleColor = data[i][INDEX_COLOR_CODE];
                        let categoryId = null;

                        if (data[i].length > maxColumn) {
                            maxColumn = data[i].length;
                        }

                        if (categoryName != '') {
                            categoryId = await createChannel(
                                guild,
                                categoryName,
                                ChannelType.GuildCategory,
                            );
                        }

                        let validatedChannelType: ChannelType | string = '';

                        if (channelName != '') {
                            validatedChannelType = checkChannelType(channelType);

                            if (validatedChannelType !== '') {
                                if (validatedChannelType !== 'ERROR!') {
                                    channelId = await createChannel(
                                        guild,
                                        channelName,
                                        validatedChannelType as ChannelType,
                                        categoryId,
                                    );
                                }
                            }
                        } else {
                            validatedChannelType = checkChannelType(channelType);
                        }

                        const roleId = await createRole(guild, roleName);

                        if (exists(roleId) && exists(channelId)) {
                            await setRoleToChanel(
                                guild,
                                roleId,
                                channelId,
                                validatedChannelType as string,
                            );

                            const role = await searchRoleById(guild, roleId);
                            assertExistCheck(role);

                            // the role will be displayed separately from other members
                            await role.setHoist(true);

                            roleColor = await setRoleColor(guild, role, roleColor, i);
                        }

                        resultData.push([
                            categoryId ?? '',
                            categoryName,
                            channelId ?? '',
                            channelName,
                            String(validatedChannelType),
                            roleId ?? '',
                            roleName,
                            roleColor,
                        ]);

                        if (exists(roleId)) {
                            for (let j = INDEX_MEMBER_ID_START; j < data[i].length; j++) {
                                const memberIdString = data[i][j].trim();
                                const resultMemberId = await setRoleToMember(
                                    guild,
                                    roleId,
                                    memberIdString,
                                );
                                resultData[i].push(resultMemberId ?? '');
                            }
                        }

                        const progress = `${(i / (data.length - 1)) * 100}`;
                        await interaction.editReply(parseInt(progress, 10) + '% 完了');
                    } catch (error) {
                        await sendErrorLogs(logger, error);
                        await interaction.followUp('データの' + i + '行目でエラーでし！');
                    }
                }

                for (let i = INDEX_MEMBER_ID_START; i < maxColumn; i++) {
                    resultData[0].push('メンバー' + (i - 7));
                }

                for (const i in resultData) {
                    for (let j = 0; j < maxColumn; j++) {
                        if (notExists(resultData[i][j])) {
                            resultData[i][j] = '';
                        }
                    }
                }

                const csvString = stringify(resultData);
                fs.writeFileSync('./temp/temp.csv', csvString);
                // TODO: AttachmentBuilderのこの書き方合ってるか確認
                const attachment = new AttachmentBuilder('./temp/temp.csv', {
                    name: 'output.csv',
                });
                await interaction.editReply({
                    content: '終わったでし！下に結果を出すでし！',
                    files: [attachment],
                });

                const deleteCommandsText = setDeleteCommandsText(resultData);
                await interaction.followUp({
                    files: [deleteCommandsText],
                });
            }),
        );
    } catch (error) {
        await interaction.editReply('CSVファイル読み込み中にエラーでし！');
    }
}

function checkChannelType(channelType: string) {
    if (channelType == 'txt' || channelType == 'TEXT' || channelType == 'GUILD_TEXT') {
        return ChannelType.GuildText;
    } else if (channelType == 'vc' || channelType == 'VOICE' || channelType == 'GUILD_VOICE') {
        return ChannelType.GuildVoice;
    } else if (channelType == '') {
        return '';
    } else {
        return 'ERROR!';
    }
}

async function setRoleToChanel(
    guild: Guild,
    roleId: string,
    channelId: string,
    channelType: string,
) {
    // set permission to channel
    if (exists(channelId) && channelType !== 'ERROR!') {
        const channel = await guild.channels.fetch(channelId);
        if (exists(channel) && !channel.isDMBased() && !channel.isThread()) {
            await channel.permissionOverwrites.edit(roleId, {
                ViewChannel: true,
            });
            await channel.permissionOverwrites.edit(guild.roles.everyone.id, {
                ViewChannel: false,
            });
        }
    }
}

async function setRoleColor(guild: Guild, role: Role, roleColor: string, index: number) {
    const originRoleColor = role.hexColor;
    let color;

    if (roleColor.match('^#([\\da-fA-F]{6})$')) {
        color = await setColorToRole(guild, role, roleColor);
    } else if (originRoleColor != '#000000') {
        color = originRoleColor;
    } else {
        const colorList = [
            '#E60012',
            '#EB6100',
            '#F39800',
            '#FCC800',
            '#FFF100',
            '#CFDB00',
            '#8FC31F',
            '#22AC38',
            '#009944',
            '#009B6B',
            '#009E96',
            '#00A0C1',
            '#00A0E9',
            '#0086D1',
            '#0068B7',
            '#00479D',
            '#1D2088',
            '#601986',
            '#920783',
            '#BE0081',
            '#E4007F',
            '#E5006A',
            '#E5004F',
            '#E60033',
        ];

        const colorIndex = index % 24;
        color = await setColorToRole(guild, role, colorList[colorIndex]);
    }

    return color;
}

function setDeleteCommandsText(resultData: string[][]) {
    let resultCategoryIdList = [];
    let resultChannelIdList = [];
    let resultRoleIdList = [];
    for (let i = 1; i < resultData.length; i++) {
        if (resultData[i][0] != '' && resultData[i][0].match('\\d{18}')) {
            resultCategoryIdList.push(resultData[i][0]);
        }

        if (resultData[i][2] != '' && resultData[i][2].match('\\d{18}')) {
            resultChannelIdList.push(resultData[i][2]);
        }

        if (resultData[i][5] != '' && resultData[i][5].match('\\d{18}')) {
            resultRoleIdList.push(resultData[i][5]);
        }
    }
    resultCategoryIdList = Array.from(new Set(resultCategoryIdList));
    resultChannelIdList = Array.from(new Set(resultChannelIdList));
    resultRoleIdList = Array.from(new Set(resultRoleIdList));

    let resultStr =
        '以下のコマンドを用いて今回作成したカテゴリ・チャンネル・ロールを全て削除することができます。\n' +
        '個別に削除する場合は出力されたCSVから削除したい項目を選んでコマンドで削除してください。\n\n' +
        'カテゴリ削除コマンド(※カテゴリ内のチャンネルも同時に削除されます。)\n' +
        '/ch_management カテゴリー削除';
    for (const categoryId of resultCategoryIdList) {
        resultStr = resultStr + ' ' + categoryId;
    }

    resultStr += '\n\nチャンネル削除コマンド\n/ch_management チャンネル削除';
    for (const channelId of resultChannelIdList) {
        resultStr = resultStr + ' ' + channelId;
    }

    fs.writeFileSync('./temp/temp.txt', resultStr);
    return new AttachmentBuilder('./temp/temp.txt', {
        name: 'delete_commands.txt',
    });
}
