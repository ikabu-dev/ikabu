import { TeamDivider } from '@prisma/client';
import {
    APIEmbedField,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    MessageFlags,
} from 'discord.js';

import { TeamDividerParam } from '@/config/constants/button_id';
import { ErrorTexts } from '@/config/constants/error_texts';
import { TeamDividerService, TeamMember } from '@/infra/db/repositories/team_divider_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { assertExistCheck, exists, notExists } from '@/shared/assert';
import {
    setButtonEnable,
    recoveryThinkingButton,
    disableThinkingButton,
    setButtonDisable,
} from '@/shared/discord_helpers/button_components';
import { getGuildByInteraction } from '@/shared/discord_helpers/guild_manager';
import { searchAPIMemberById } from '@/shared/discord_helpers/member_manager';
import { searchMessageById } from '@/shared/discord_helpers/message_manager';

const logger = log4js_obj.getLogger('interaction');

/**
 * チーム分けコマンド実行時の登録メッセージを出す
 * @param {*} interaction コマンドのインタラクション
 */
export async function dividerInitialMessage(interaction: ChatInputCommandInteraction<'cached'>) {
    try {
        const member = interaction.member;
        const hostId = member.id;
        const teamNum = interaction.options.getInteger('各チームのメンバー数', true);
        let hideWin = interaction.options.getBoolean('勝利数と勝率を隠す');
        if (notExists(hideWin)) {
            hideWin = false;
        }

        if (teamNum <= 1 || teamNum >= 9) {
            // あまり多すぎるとEmbedの制限にひっかかってエラー吐きそうなので
            await interaction.reply({
                content:
                    '各チームのメンバー数は2～8人まででし！\n観戦を含む参加者上限は20人まででし！',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (notExists(member.voice.channelId)) {
            await interaction.reply({
                content: 'このコマンドはVC参加中しか使えないでし！',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply();

        const embed = new EmbedBuilder();
        embed.setAuthor({
            name: 'チーム分けツール',
            iconURL: 'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/dice.png',
        });
        embed.addFields([
            {
                name: '参加登録をするには参加ボタンを押すでし！',
                value: `全員の登録が完了したら、${member.displayName}たんは登録完了ボタンを押すでし！`,
                inline: false,
            },
            {
                name: '参加者一覧',
                value: '参加者がいません',
                inline: false,
            },
        ]);

        const buttons = createInitButtons(hostId, teamNum, hideWin);

        await interaction.editReply({
            embeds: [embed],
            components: [buttons],
        });
    } catch (error) {
        await sendErrorLogs(logger, error);
        if (exists(interaction.channel)) {
            if (exists(interaction.channel)) {
                await interaction.channel.send(ErrorTexts.UndefinedError);
            }
        }
    }
}

/**
 * 参加ボタンの処理
 * @param {*} interaction ボタンのインタラクション
 * @param {*} params ボタンのパラメーター
 */
export async function joinButton(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    try {
        await interaction.update({
            components: setButtonDisable(interaction.message, interaction),
        });

        const guild = await getGuildByInteraction(interaction);
        const member = await searchAPIMemberById(guild, interaction.member.user.id);
        const hostId = params.get('hid');
        assertExistCheck(hostId, 'params.get(hid)');
        const hideWin = params.get('hide');
        const hostMember = await searchAPIMemberById(guild, hostId);
        const messageId = interaction.message.id;

        assertExistCheck(hostMember, 'hostMember');
        assertExistCheck(member, 'member');

        if (member.voice.channelId != hostMember.voice.channelId) {
            await interaction.followUp({
                content: 'ホストと同じVC参加者のみ参加できるでし！',
                flags: MessageFlags.Ephemeral,
            });
            await interaction.message.edit({
                components: recoveryThinkingButton(interaction, '参加'),
            });
            return;
        }

        if (exists(await TeamDividerService.selectMemberFromDB(messageId, 0, member.id))) {
            await interaction.followUp({
                content: '参加登録済みでし！',
                flags: MessageFlags.Ephemeral,
            });
            await interaction.message.edit({
                components: recoveryThinkingButton(interaction, '参加'),
            });
            return;
        }

        // DB登録処理
        const winRateVisibility = hideWin === 'true';

        await TeamDividerService.registerMemberToDB(
            messageId,
            member.id,
            member.displayName,
            0,
            0,
            0,
            0,
            false,
            winRateVisibility,
        );

        const registeredMembers = await TeamDividerService.registeredMembersStrings(
            interaction.message.id,
        );

        const embed = new EmbedBuilder();
        embed.setAuthor({
            name: 'チーム分けツール',
            iconURL: 'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/dice.png',
        });
        const fields: APIEmbedField[] = [
            {
                name: '参加登録をするには参加ボタンを押すでし！',
                value: `全員の登録が完了したら、${hostMember.displayName}たんは登録完了ボタンを押すでし！`,
                inline: true,
            },
            {
                name: `参加者一覧 [${registeredMembers.memberCount}]`,
                value: registeredMembers.text,
                inline: false,
            },
        ];
        embed.addFields(fields);

        await interaction.message.edit({
            embeds: [embed],
            components: recoveryThinkingButton(interaction, '参加'),
        });
        await interaction.followUp({ content: '登録したでし！', flags: MessageFlags.Ephemeral });
    } catch (error) {
        await sendErrorLogs(logger, error);
        if (exists(interaction.channel)) {
            await interaction.channel.send(ErrorTexts.UndefinedError);
        }
    }
}

/**
 * キャンセルボタンの処理
 * @param {*} interaction ボタンのインタラクション
 * @param {*} params ボタンのパラメーター
 */
export async function cancelButton(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    try {
        await interaction.update({
            components: setButtonDisable(interaction.message, interaction),
        });
        const guild = await getGuildByInteraction(interaction);
        const messageId = interaction.message.id;
        const hostId = params.get('hid');
        assertExistCheck(hostId, 'params.get(hid)');
        const member = await searchAPIMemberById(guild, interaction.member.user.id);
        const hostMember = await searchAPIMemberById(guild, hostId);

        assertExistCheck(hostMember, 'hostMember');
        assertExistCheck(member, 'member');

        // キャンセルボタンを押した人が参加登録をしている場合
        if (exists(await TeamDividerService.selectMemberFromDB(messageId, 0, member.id))) {
            await TeamDividerService.deleteMemberFromDB(messageId, member.id);

            const registeredMembers = await TeamDividerService.registeredMembersStrings(messageId);
            if (registeredMembers.memberCount === 0) {
                registeredMembers.text = '参加者がいません';
            }
            const embed = new EmbedBuilder();
            embed.setAuthor({
                name: 'チーム分けツール',
                iconURL: 'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/dice.png',
            });
            const fields: APIEmbedField[] = [
                {
                    name: '参加登録をするには参加ボタンを押すでし！',
                    value: `全員の登録が完了したら、${hostMember.displayName}たんは登録完了ボタンを押すでし！`,
                    inline: true,
                },
                {
                    name: '参加者一覧　' + `[${registeredMembers.memberCount}]`,
                    value: registeredMembers.text,
                    inline: false,
                },
            ];
            embed.addFields(fields);

            await interaction.message.edit({
                embeds: [embed],
                components: recoveryThinkingButton(interaction, 'キャンセル'),
            });
            await interaction.followUp({
                content: '参加をキャンセルしたでし！',
                flags: MessageFlags.Ephemeral,
            });
        } else if (hostId == interaction.member.user.id) {
            await TeamDividerService.deleteAllMemberFromDB(messageId);
            await interaction.message.delete();
            await interaction.followUp({
                content: 'チーム分けをキャンセルしたでし！',
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await interaction.followUp({
                content: 'チーム分けをキャンセルできるのはホストだけでし！',
                flags: MessageFlags.Ephemeral,
            });
            await interaction.message.edit({
                components: recoveryThinkingButton(interaction, 'キャンセル'),
            });
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        if (exists(interaction.channel)) {
            await interaction.channel.send(ErrorTexts.UndefinedError);
        }
    }
}

/**
 * 登録完了ボタンの処理
 * @param {*} interaction ボタンのインタラクション
 * @param {*} params ボタンのパラメーター
 */
export async function registerButton(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    try {
        await interaction.update({
            components: setButtonDisable(interaction.message, interaction),
        });
        const guild = await getGuildByInteraction(interaction);
        const channel = interaction.channel;
        assertExistCheck(channel, 'channel');
        const member = await searchAPIMemberById(guild, interaction.member.user.id);
        const messageId = interaction.message.id;
        const hostId = params.get('hid');
        assertExistCheck(hostId, 'params.get(hid)');
        const teamNum = Number(params.get('num') ?? '-1');
        const count = 1;

        assertExistCheck(member, 'member');

        if (hostId != member.id) {
            await interaction.followUp({
                content: '登録完了ボタンはコマンドを使用したユーザーしか使えないでし！',
                flags: MessageFlags.Ephemeral,
            });
            await interaction.message.edit({
                components: recoveryThinkingButton(interaction, '登録完了'),
            });
            return;
        }

        const memberList = await TeamDividerService.selectAllMemberFromDB(messageId, 0);

        if (memberList.length < teamNum * 2) {
            await interaction.followUp({
                content: '参加メンバーが少なすぎるでし！',
                flags: MessageFlags.Ephemeral,
            });
            await interaction.message.edit({
                components: recoveryThinkingButton(interaction, '登録完了'),
            });
            return;
        }

        const participants: TeamDivider[] = arrayShuffle(memberList);

        for (const member of participants) {
            await TeamDividerService.registerMemberToDB(
                messageId,
                member.memberId,
                member.memberName,
                member.team,
                count,
                member.joinedMatchCount,
                member.win,
                member.forceSpectate,
                member.hideWin,
            );
        }

        for (let i = 0; i < participants.length; i++) {
            if (i < teamNum) {
                await TeamDividerService.setTeam(messageId, participants[i].memberId, count, 0);
                await TeamDividerService.setCount(
                    messageId,
                    participants[i].memberId,
                    count,
                    Number(participants[i].joinedMatchCount) + 1,
                );
            } else if (i >= teamNum && i < teamNum * 2) {
                await TeamDividerService.setTeam(messageId, participants[i].memberId, count, 1);
                await TeamDividerService.setCount(
                    messageId,
                    participants[i].memberId,
                    count,
                    Number(participants[i].joinedMatchCount) + 1,
                );
            } else if (i >= teamNum * 2) {
                await TeamDividerService.setTeam(messageId, participants[i].memberId, count, 2);
            } else {
                await interaction.followUp({
                    content: 'チーム分けエラー',
                    flags: MessageFlags.Ephemeral,
                });
                await interaction.message.edit({
                    components: recoveryThinkingButton(interaction, '登録完了'),
                });
                return;
            }
        }

        const embed = await loadTeamEmbed(messageId, 1, member);
        const buttons = createButtons(messageId, teamNum, hostId, count);
        const correctButton = createSecondButtons(hostId, messageId, interaction.message.id, count);

        if (notExists(embed) || notExists(buttons) || notExists(correctButton)) {
            return await interaction.followUp({
                content: ErrorTexts.UndefinedError,
            });
        }

        await channel.send({
            embeds: [embed],
            components: [buttons, correctButton],
        });
        await interaction.message.edit({
            components: disableThinkingButton(interaction, '登録完了'),
        });
        await interaction.followUp({
            content: 'チームを更新したでし！',
            flags: MessageFlags.Ephemeral,
        });
    } catch (error) {
        await sendErrorLogs(logger, error);
        if (exists(interaction.channel)) {
            await interaction.channel.send(ErrorTexts.UndefinedError);
        }
    }
}

/**
 * alfaボタンの処理
 * @param {*} interaction ボタンのインタラクション
 * @param {*} params ボタンのパラメーター
 */
export async function alfaButton(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    await matching(interaction, params, 0);
}

/**
 * bravoボタンの処理
 * @param {*} interaction ボタンのインタラクション
 * @param {*} params ボタンのパラメーター
 */
export async function bravoButton(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    await matching(interaction, params, 1);
}

/**
 * 試合勝利処理＆マッチング処理を行う
 * @param {*} interaction ボタンのインタラクション
 * @param {*} params ボタンのパラメーター
 * @param {*} winTeam 勝利チーム(alfa=0, bravo=1, 観戦=2)
 */
async function matching(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
    winTeam: number,
) {
    try {
        let winTeamName;
        switch (winTeam) {
            case 0:
                winTeamName = 'alfa';
                break;
            case 1:
                winTeamName = 'bravo';
                break;
            default:
                winTeamName = 'unknown';
                break;
        }

        await interaction.update({
            components: setButtonDisable(interaction.message, interaction),
        });

        const guild = await getGuildByInteraction(interaction);
        const member = await searchAPIMemberById(guild, interaction.member.user.id);
        const messageId = params.get('mid');
        assertExistCheck(messageId, 'params.get(mid)');
        const hostId = params.get('hid');
        assertExistCheck(hostId, 'params.get(hid)');
        const teamNum = Number(params.get('num') ?? '-1');
        const count = Number(params.get('count') ?? '-1');

        assertExistCheck(member, 'member');

        if (member.id != hostId) {
            await interaction.followUp({
                content: 'このボタンはコマンドを使用したユーザーしか使えないでし！',
                flags: MessageFlags.Ephemeral,
            });
            await interaction.message.edit({
                components: recoveryThinkingButton(interaction, winTeamName),
            });
            return;
        }

        const fullMember = await TeamDividerService.selectAllMemberFromDB(
            messageId,
            Number(count) - 1,
        );

        for (const member of fullMember) {
            await TeamDividerService.registerMemberToDB(
                messageId,
                member.memberId,
                member.memberName,
                member.team,
                count,
                member.joinedMatchCount,
                member.win,
                member.forceSpectate,
                member.hideWin,
            );
        }

        const winMember = await TeamDividerService.getTeamMembers(messageId, count, winTeam);

        for (const member of winMember) {
            await TeamDividerService.setWin(
                messageId,
                member.memberId,
                count,
                Number(member.win) + 1,
            );
        }

        const participants = await TeamDividerService.getParticipants(messageId, count, teamNum);
        const fullMembers = await TeamDividerService.selectAllMemberFromDB(messageId, count);

        const participantsIdList = participants.map(
            (participant: TeamMember) => participant.memberId,
        );

        // 観戦者セット
        for (const member of fullMembers) {
            if (!participantsIdList.includes(member.memberId)) {
                await TeamDividerService.setTeam(messageId, member.memberId, count, 2);
                await TeamDividerService.setForceSpectate(messageId, member.memberId, count, false);
            }
        }

        // NOTE: 1位と最下位を同じチームにし、1位と2位を別チームにする

        // 上位半分は偶数をalfa、奇数をbravo
        const orderByWinRateArray = orderByWinRate(participants);
        const upperHalfParticipants = orderByWinRateArray.slice(0, orderByWinRateArray.length / 2);
        const lowerHalfParticipants = orderByWinRateArray.slice(orderByWinRateArray.length / 2);
        for (let i = 0; i < upperHalfParticipants.length; i++) {
            if (i % 2 == 0) {
                await TeamDividerService.setTeam(
                    messageId,
                    upperHalfParticipants[i].memberId,
                    count,
                    0,
                );
            } else {
                await TeamDividerService.setTeam(
                    messageId,
                    upperHalfParticipants[i].memberId,
                    count,
                    1,
                );
            }
        }
        // 下位半分は偶数をbravo、奇数をalfa
        for (let i = 0; i < lowerHalfParticipants.length; i++) {
            if (i % 2 == 0) {
                await TeamDividerService.setTeam(
                    messageId,
                    lowerHalfParticipants[i].memberId,
                    count,
                    1,
                );
            } else {
                await TeamDividerService.setTeam(
                    messageId,
                    lowerHalfParticipants[i].memberId,
                    count,
                    0,
                );
            }
        }

        const embed = await loadTeamEmbed(messageId, Number(count), member);
        const buttons = createButtons(messageId, teamNum, hostId, Number(count));
        const correctButton = createSecondButtons(
            hostId,
            messageId,
            interaction.message.id,
            Number(count),
        );

        for (const participant of participants) {
            await TeamDividerService.setCount(
                messageId,
                participant.memberId,
                count,
                Number(participant.joinedMatchCount + 1),
            );
        }

        await interaction.message.edit({
            components: disableThinkingButton(interaction, winTeamName),
        });
        if (exists(embed)) {
            await interaction.message.reply({
                content: `\`【${
                    count - 1
                }回戦: ${winTeamName}チーム勝利】\`\nチームを更新したでし！`,
                embeds: [embed],
                components: [buttons, correctButton],
            });
        } else {
            return await interaction.followUp({
                content: ErrorTexts.UndefinedError,
            });
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        if (exists(interaction.channel)) {
            await interaction.channel.send(ErrorTexts.UndefinedError);
        }
    }
}

/**
 * 観戦希望ボタンの処理
 * @param {*} interaction ボタンのインタラクション
 * @param {*} params ボタンのパラメーター
 */
export async function spectateButton(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    try {
        await interaction.update({
            components: setButtonDisable(interaction.message, interaction),
        });

        const guild = await getGuildByInteraction(interaction);
        const member = await searchAPIMemberById(guild, interaction.member.user.id);
        const messageId = params.get('mid');
        assertExistCheck(messageId, 'params.get(mid)');
        const hostId = params.get('hid');
        assertExistCheck(hostId, 'params.get(hid)');
        const hostMember = await searchAPIMemberById(guild, hostId);
        const teamNum = Number(params.get('num') ?? '-1');
        const count = Number(params.get('count') ?? '-1');
        const fullMembers = await TeamDividerService.selectAllMemberFromDB(messageId, count);

        const fullIdList = fullMembers.map((member: TeamDivider) => member.memberId);

        assertExistCheck(hostMember, 'hostMember');
        assertExistCheck(member, 'member');

        if (!fullIdList.includes(member.id)) {
            await interaction.followUp({
                content: 'このチーム分けに参加してないでし！',
                flags: MessageFlags.Ephemeral,
            });
            await interaction.message.edit({
                components: recoveryThinkingButton(interaction, '観戦希望'),
            });
            return;
        }

        const wantSpectateList = await TeamDividerService.getForceSpectate(messageId, count);
        const wantSpectateIdList = wantSpectateList.map((member: TeamMember) => member.memberId);

        if (wantSpectateIdList.includes(member.id)) {
            await TeamDividerService.setForceSpectate(messageId, member.id, count, false);
            const embed = await loadTeamEmbed(messageId, count, member);

            if (notExists(embed)) {
                return await interaction.followUp({
                    content: ErrorTexts.UndefinedError,
                });
            }

            await interaction.message.edit({
                embeds: [embed],
                components: recoveryThinkingButton(interaction, '観戦希望'),
            });

            await interaction.followUp({
                content: '観戦希望を取り下げたでし！',
                flags: MessageFlags.Ephemeral,
            });
        } else {
            if (wantSpectateIdList.length > fullMembers.length - teamNum * 2 - 1) {
                await interaction.followUp({
                    content: '観戦席はもう空いてないでし！',
                    flags: MessageFlags.Ephemeral,
                });
                await interaction.message.edit({
                    components: recoveryThinkingButton(interaction, '観戦希望'),
                });
                return;
            }

            await TeamDividerService.setForceSpectate(messageId, member.id, count, true);
            const embed = await loadTeamEmbed(messageId, count, hostMember);

            if (notExists(embed)) {
                return await interaction.followUp({
                    content: ErrorTexts.UndefinedError,
                });
            }

            await interaction.message.edit({
                embeds: [embed],
                components: recoveryThinkingButton(interaction, '観戦希望'),
            });

            await interaction.followUp({
                content: '観戦希望を申し込んだでし！\nもう一度押すと希望を取り下げられるでし！',
                flags: MessageFlags.Ephemeral,
            });
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        if (exists(interaction.channel)) {
            await interaction.channel.send(ErrorTexts.UndefinedError);
        }
    }
}

/**
 * 終了ボタンの処理
 * @param {*} interaction ボタンのインタラクション
 * @param {*} params ボタンのパラメーター
 */
export async function endButton(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    try {
        await interaction.update({
            components: setButtonDisable(interaction.message, interaction),
        });

        const guild = await getGuildByInteraction(interaction);
        const member = await searchAPIMemberById(guild, interaction.member.user.id);
        const messageId = params.get('mid');
        assertExistCheck(messageId, 'params.get(mid)');
        const hostId = params.get('hid');

        assertExistCheck(member, 'member');

        if (member.id != hostId) {
            await interaction.followUp({
                content: 'このボタンはコマンドを使用したユーザーしか使えないでし！',
                flags: MessageFlags.Ephemeral,
            });
            await interaction.message.edit({
                components: recoveryThinkingButton(interaction, '終了'),
            });
            return;
        }

        await interaction.message.edit({
            components: disableThinkingButton(interaction, '終了'),
        });
        await TeamDividerService.deleteAllMemberFromDB(messageId);
        await interaction.message.reply({ content: 'チーム分けを終了したでし！' });
    } catch (error) {
        await sendErrorLogs(logger, error);
        if (exists(interaction.channel)) {
            await interaction.channel.send(ErrorTexts.UndefinedError);
        }
    }
}

/**
 * 直前訂正ボタンの処理
 * @param {*} interaction ボタンのインタラクション
 * @param {*} params ボタンのパラメーター
 */
export async function correctButton(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    try {
        await interaction.update({
            components: setButtonDisable(interaction.message, interaction),
        });

        const guild = await getGuildByInteraction(interaction);
        const member = await searchAPIMemberById(guild, interaction.member.user.id);
        const messageId = params.get('mid');
        assertExistCheck(messageId, 'params.get(mid)');
        const preMessageId = params.get('pmid');
        assertExistCheck(preMessageId, 'params.get(pmid)');
        const count = Number(params.get('count') ?? '-1');
        assertExistCheck(interaction.channel, 'interaction.channel');
        const channelId = interaction.channel.id;
        const message = await searchMessageById(guild, channelId, messageId);
        assertExistCheck(message, 'message');
        const hostId = message.interaction?.user.id;

        assertExistCheck(member, 'member');

        if (member.id != hostId) {
            await interaction.followUp({
                content: 'このボタンはコマンドを使用したユーザーしか使えないでし！',
                flags: MessageFlags.Ephemeral,
            });
            await interaction.message.edit({
                components: recoveryThinkingButton(interaction, '直前訂正'),
            });
            return;
        }

        await interaction.message.delete();

        await TeamDividerService.deleteMatchingResult(messageId, count);

        const preMessage = await searchMessageById(guild, channelId, preMessageId);
        assertExistCheck(preMessage, 'preMessage');
        await preMessage.edit({ components: setButtonEnable(preMessage) });

        await interaction.followUp({
            content:
                '最新のチーム分けを削除したでし！\nもう一度同じ操作をしても違うチーム分けになる場合があるでし！',
            flags: MessageFlags.Ephemeral,
        });
    } catch (error) {
        await sendErrorLogs(logger, error);
        if (exists(interaction.channel)) {
            await interaction.channel.send(ErrorTexts.UndefinedError);
            await interaction.channel.send(
                'しばらく経ってからボタンを押して見るでし！\nそれでもだめなら「サポートセンターまでご連絡お願い致します。」でし！',
            );
        }
    }
}

/**
 * 戦績表示切替ボタンの処理
 * @param {*} interaction ボタンのインタラクション
 * @param {*} params ボタンのパラメーター
 */
export async function hideButton(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    if (!interaction.message.inGuild()) return;
    try {
        await interaction.update({
            components: setButtonDisable(interaction.message, interaction),
        });

        const guild = await getGuildByInteraction(interaction);
        const member = await searchAPIMemberById(guild, interaction.member.user.id);
        const messageId = params.get('mid');
        assertExistCheck(messageId, 'messageId');
        const hostId = params.get('hid');
        assertExistCheck(hostId, 'hostId');
        const count = Number(params.get('count'));

        assertExistCheck(member, 'member');

        if (member.id != hostId) {
            await interaction.followUp({
                content: 'このボタンはコマンドを使用したユーザーしか使えないでし！',
                flags: MessageFlags.Ephemeral,
            });
            await interaction.message.edit({
                components: recoveryThinkingButton(interaction, '戦績表示切替'),
            });
            return;
        }

        const hostMember = await searchAPIMemberById(guild, hostId);
        assertExistCheck(hostMember, 'hostMember');
        const allMembers = await TeamDividerService.selectAllMemberFromDB(messageId, count);

        const hideWin = allMembers[0].hideWin;

        if (hideWin) {
            await TeamDividerService.setHideWin(messageId, false);
            await interaction.followUp({
                content: '`【戦績表示】: 表示`',
                flags: MessageFlags.Ephemeral,
            });
        } else {
            await TeamDividerService.setHideWin(messageId, true);
            await interaction.followUp({
                content: '`【戦績表示】: 非表示`',
                flags: MessageFlags.Ephemeral,
            });
        }
        const embed = await loadTeamEmbed(messageId, count, hostMember);
        if (notExists(embed)) {
            return await interaction.followUp({
                content: ErrorTexts.UndefinedError,
            });
        }
        await interaction.message.edit({
            embeds: [embed],
            components: recoveryThinkingButton(interaction, '戦績表示切替'),
        });
    } catch (error) {
        await sendErrorLogs(logger, error);
        if (exists(interaction.channel) && interaction.channel.isTextBased()) {
            if (exists(interaction.channel)) {
                await interaction.channel.send(ErrorTexts.UndefinedError);
            }
        }
    }
}

/**
 * 配列内の要素のシャッフルを行う
 * @param {*} array 該当配列
 * @returns 並べ替え後の配列
 */
function arrayShuffle<Type>(array: Type[]) {
    for (let i = array.length - 1; i > 0; i--) {
        // 0〜(i+1)の範囲で値を取得
        const r = Math.floor(Math.random() * (i + 1));

        // 要素の並び替えを実行
        const tmp = array[i];
        array[i] = array[r];
        array[r] = tmp;
    }
    return array;
}

/**
 * チーム分けした後のEmbedを作成
 * @param {*} messageId 登録メッセージID
 * @param {*} count 試合数
 * @param {*} hostMember コマンド使用者のメンバーオブジェクト
 * @returns 作成したEmbedを返す
 */
async function loadTeamEmbed(messageId: string, count: number, hostMember: GuildMember) {
    try {
        const alfaList = usersString(await TeamDividerService.getTeamMembers(messageId, count, 0));
        const bravoList = usersString(await TeamDividerService.getTeamMembers(messageId, count, 1));
        const spectators = await TeamDividerService.getTeamMembers(messageId, count, 2);
        const wantSpectate = await TeamDividerService.getForceSpectate(messageId, count);
        let spectateString = 'なし';
        let wantSpectateString = 'なし';

        if (spectators.length !== 0) {
            spectateString = usersString(spectators);
        }

        if (wantSpectate.length !== 0) {
            wantSpectateString = usersString(wantSpectate);
        }

        const embed = new EmbedBuilder();
        embed.setAuthor({
            name: 'チーム分けツール　【' + `${count}回戦】`,
            iconURL: 'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/dice.png',
        });
        embed.addFields([
            {
                name: `${hostMember.displayName}` + 'たんは勝ったチームのボタンを押すでし！',
                value: '次回観戦したい人は観戦希望ボタンを押すでし！\n（観戦も自動決定するため非推奨）',
                inline: true,
            },
            {
                name: 'alfaチーム　勝利数(勝率)',
                value: alfaList,
                inline: false,
            },
            {
                name: 'bravoチーム　勝利数(勝率)',
                value: bravoList,
                inline: false,
            },
            {
                name: '観戦席',
                value: spectateString,
                inline: false,
            },
            {
                name: '次回観戦希望者',
                value: wantSpectateString,
                inline: false,
            },
        ]);
        return embed;
    } catch (error) {
        await sendErrorLogs(logger, error);
        return null;
    }
}

/**
 * コマンド使用時に使うボタンを作成
 * @param {*} hostId ホストID
 * @param {*} teamNum 1チームのメンバー数
 * @param {*} hideWin 戦績非表示フラグ
 * @returns ボタンのActionRowを返す
 */
function createInitButtons(hostId: string, teamNum: number, hideWin: boolean) {
    const joinParams = new URLSearchParams();
    joinParams.append('t', TeamDividerParam.Join);
    joinParams.append('hide', hideWin.toString());
    joinParams.append('hid', hostId);

    const registerParams = new URLSearchParams();
    registerParams.append('t', TeamDividerParam.Register);
    registerParams.append('num', teamNum.toString());
    registerParams.append('hid', hostId);

    const cancelParams = new URLSearchParams();
    cancelParams.append('t', TeamDividerParam.Cancel);
    cancelParams.append('hid', hostId);

    const buttons = new ActionRowBuilder<ButtonBuilder>();
    buttons.addComponents([
        new ButtonBuilder()
            .setCustomId(joinParams.toString())
            .setLabel('参加')
            .setStyle(ButtonStyle.Primary),
    ]);
    buttons.addComponents([
        new ButtonBuilder()
            .setCustomId(registerParams.toString())
            .setLabel('登録完了')
            .setStyle(ButtonStyle.Success),
    ]);
    buttons.addComponents([
        new ButtonBuilder()
            .setCustomId(cancelParams.toString())
            .setLabel('キャンセル')
            .setStyle(ButtonStyle.Danger),
    ]);
    return buttons;
}

/**
 * チーム分け画面のボタン(1段目)の作成
 * @param {*} messageId 登録メッセージID
 * @param {*} teamNum 1チームのメンバー数
 * @param {*} hostId ホストID
 * @param {*} count 試合数
 * @returns ボタンのActionRowを返す
 */
function createButtons(messageId: string, teamNum: number, hostId: string, count: number) {
    const alfaParams = new URLSearchParams();
    alfaParams.append('t', TeamDividerParam.Alfa);
    alfaParams.append('num', teamNum.toString());
    alfaParams.append('hid', hostId);
    alfaParams.append('mid', messageId);
    alfaParams.append('count', (count + 1).toString());

    const bravoParams = new URLSearchParams();
    bravoParams.append('t', TeamDividerParam.Bravo);
    bravoParams.append('num', teamNum.toString());
    bravoParams.append('hid', hostId);
    bravoParams.append('mid', messageId);
    bravoParams.append('count', (count + 1).toString());

    const spectateParams = new URLSearchParams();
    spectateParams.append('t', TeamDividerParam.Spectate);
    spectateParams.append('num', teamNum.toString());
    spectateParams.append('hid', hostId);
    spectateParams.append('mid', messageId);
    spectateParams.append('count', count.toString());

    const endParams = new URLSearchParams();
    endParams.append('t', TeamDividerParam.End);
    endParams.append('hid', hostId);
    endParams.append('mid', messageId);

    const buttons = new ActionRowBuilder<ButtonBuilder>();
    buttons.addComponents([
        new ButtonBuilder()
            .setCustomId(alfaParams.toString())
            .setLabel('alfa')
            .setStyle(ButtonStyle.Danger),
    ]);
    buttons.addComponents([
        new ButtonBuilder()
            .setCustomId(bravoParams.toString())
            .setLabel('bravo')
            .setStyle(ButtonStyle.Primary),
    ]);
    buttons.addComponents([
        new ButtonBuilder()
            .setCustomId(spectateParams.toString())
            .setLabel('観戦希望')
            .setStyle(ButtonStyle.Secondary),
    ]);
    buttons.addComponents([
        new ButtonBuilder()
            .setCustomId(endParams.toString())
            .setLabel('終了')
            .setStyle(ButtonStyle.Danger),
    ]);
    return buttons;
}

/**
 * チーム分け画面のボタン(2段目)の作成
 * @param {*} hostId ホストID
 * @param {*} messageId 登録メッセージID
 * @param {*} PreMessageId 1つ前のチーム分けメッセージID
 * @param {*} count 試合数
 * @returns ボタンのActionRowを返す
 */
function createSecondButtons(
    hostId: string,
    messageId: string,
    PreMessageId: string,
    count: number,
) {
    const correctParams = new URLSearchParams();
    correctParams.append('t', TeamDividerParam.Correct);
    correctParams.append('mid', messageId);
    correctParams.append('pmid', PreMessageId);
    correctParams.append('count', count.toString());

    const hideParams = new URLSearchParams();
    hideParams.append('t', TeamDividerParam.Hide);
    hideParams.append('hid', hostId);
    hideParams.append('mid', messageId);
    hideParams.append('count', count.toString());

    const buttons = new ActionRowBuilder<ButtonBuilder>();
    buttons.addComponents([
        new ButtonBuilder()
            .setCustomId(correctParams.toString())
            .setLabel('直前訂正')
            .setStyle(ButtonStyle.Success),
    ]);
    buttons.addComponents([
        new ButtonBuilder()
            .setCustomId(hideParams.toString())
            .setLabel('戦績表示切替')
            .setStyle(ButtonStyle.Secondary),
    ]);
    return buttons;
}

/**
 * チーム分け画面のEmbedに表示する文字列を作成
 * @param {*} array DBからのresult
 * @returns 表示文字列
 */
function usersString(array: TeamMember[]) {
    try {
        const orderByWinRateArray = orderByWinRate(array);
        let usersString = '';

        for (let i = 0; i < orderByWinRateArray.length; i++) {
            const member = orderByWinRateArray[i];
            let winRate;
            if (member.joinedMatchCount != 0) {
                winRate = (member.winRate * 100).toFixed(1);
            } else {
                winRate = ' - ';
            }
            const maxNameLength = getMaxNameLength(orderByWinRateArray);
            const truncatedName = truncateString(member.memberName);
            const username = spacePadding(truncatedName, maxNameLength);
            if (member.hideWin) {
                usersString = usersString + `\n${username}　\`戦績非表示\``;
            } else {
                usersString = usersString + `\n${username}　\`${member.win}勝(${winRate}％)\``;
            }
        }
        return usersString;
    } catch (error) {
        void sendErrorLogs(logger, error);
        return 'エラー';
    }
}

/**
 * 勝率に応じて並べ替え
 * @param {*} array DBからのresult
 * @returns 並べ替え後の配列
 */
function orderByWinRate(array: TeamMember[]) {
    return array.sort(function (p1, p2) {
        const p1Key = p1.winRate;
        const p2Key = p2.winRate;
        if (p1Key < p2Key) {
            return 1;
        }
        if (p1Key > p2Key) {
            return -1;
        }
        return 0;
    });
}

/**
 * 配列内のメンバーのうち最も名前が長い人の名前の文字数を取り出す
 * @param {*} array DBからのresult
 * @returns 全角文字数
 */
function getMaxNameLength(array: TeamMember[]) {
    const nameLengthList = array.map((member: TeamMember) =>
        getLengthBasedOnZenkaku(truncateString(member.memberName)),
    );
    const aryMax = function (a: number, b: number) {
        return Math.max(a, b);
    };
    const max = nameLengthList.reduce(aryMax);

    return max;
}

/**
 * 全角文字は1文字で半角文字は0.5文字としてカウントした文字列全体の文字数を返す
 */
function getLengthBasedOnZenkaku(str: string) {
    let len = 0;

    for (let i = 0; i < str.length; i++) {
        str[i].match(/[ -~]/) ? (len += 0.5) : (len += 1);
    }

    return len;
}

function spacePadding(val: string, len: number) {
    const zenkakuCharCount = getZenkakuCharCount(val);
    const hankakuCharCount = getHankakuCharCount(val);
    const paddingSpaceCount = len - (zenkakuCharCount + Math.round(hankakuCharCount / 2));
    for (let i = 0; i < paddingSpaceCount; i++) {
        val = val + '　';
    }
    return val;
}

function getZenkakuCharCount(str: string) {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
        count += str.charCodeAt(i) <= 255 ? 0 : 1;
    }
    return count;
}

function getHankakuCharCount(str: string) {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
        count += str.charCodeAt(i) <= 255 ? 1 : 0;
    }
    return count;
}

function truncateString(str = '', size = 21, suffix = '…') {
    let b = 0;
    for (let i = 0; i < str.length; i++) {
        b += str.charCodeAt(i) <= 255 ? 1 : 2;
        // 全角スペースが含まれていないときのみ
        if (b > size) {
            return str.substr(0, i) + suffix;
        }
    }
    return str;
}
