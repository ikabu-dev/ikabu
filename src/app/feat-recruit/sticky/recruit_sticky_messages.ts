import { Recruit } from '@prisma/client';
import { Channel, Guild, Message, MessageFlags } from 'discord.js';

import { searchMessageById } from '@/app/common/manager/message_manager';
import { sendStickyMessage } from '@/app/common/sticky_message';
import { getCommandHelpEmbed } from '@/app/feat-recruit/common/recruit_embeds';
import { sendErrorLogs } from '@/app/logs/error/send_error_logs';
import { ChannelKeySet } from '@/config/constants/channel_key';
import { StickyKey } from '@/config/constants/sticky_key';
import { ParticipantService } from '@/db/participant_service';
import { RecruitService, RecruitType } from '@/db/recruit_service';
import { UniqueChannelService } from '@/db/unique_channel_service';
import { log4js_obj } from '@/log4js_settings';
import { exists } from '@/shared/assert';
import { RequireOne } from '@/shared/types';

import { createNewRecruitButton } from '../create_recruit/common/create_recruit_buttons';

const logger = log4js_obj.getLogger('message');

export type StickyOptions = RequireOne<{
    message?: Message<true>;
    channelOpt?: {
        guild: Guild;
        channelId: string;
    };
}>;

/**
 * 募集用のSticky Messageを送信する
 * @param {StickyOptions} stickyOptions StickyOptions
 */
export async function sendRecruitSticky(stickyOptions: StickyOptions) {
    try {
        let guild: Guild;
        let channelId: string;
        if (exists(stickyOptions.message)) {
            guild = await stickyOptions.message.guild.fetch();
            channelId = stickyOptions.message.channelId;
        } else if (exists(stickyOptions.channelOpt)) {
            guild = stickyOptions.channelOpt.guild;
            channelId = stickyOptions.channelOpt.channelId;
        } else {
            throw new Error('Invalid sticky options');
        }

        const privateRecruitChannelId = await UniqueChannelService.getChannelIdByKey(
            guild.id,
            ChannelKeySet.PrivateRecruit.key,
        );
        const anarchyRecruitChannelId = await UniqueChannelService.getChannelIdByKey(
            guild.id,
            ChannelKeySet.AnarchyRecruit.key,
        );
        const regularRecruitChannelId = await UniqueChannelService.getChannelIdByKey(
            guild.id,
            ChannelKeySet.RegularRecruit.key,
        );
        const eventRecruitChannelId = await UniqueChannelService.getChannelIdByKey(
            guild.id,
            ChannelKeySet.EventRecruit.key,
        );
        const salmonRecruitChannelId = await UniqueChannelService.getChannelIdByKey(
            guild.id,
            ChannelKeySet.SalmonRecruit.key,
        );
        const raidersRecruitChannelId = await UniqueChannelService.getChannelIdByKey(
            guild.id,
            ChannelKeySet.RaidersRecruit.key,
        );
        const otherGamesRecruitChannelId = await UniqueChannelService.getChannelIdByKey(
            guild.id,
            ChannelKeySet.OtherGamesRecruit.key,
        );
        const shiverRecruitChannelId = await UniqueChannelService.getChannelIdByKey(
            guild.id,
            ChannelKeySet.ShiverRecruit.key,
        );
        const fryeRecruitChannelId = await UniqueChannelService.getChannelIdByKey(
            guild.id,
            ChannelKeySet.FryeRecruit.key,
        );
        const bigmanRecruitChannelId = await UniqueChannelService.getChannelIdByKey(
            guild.id,
            ChannelKeySet.BigmanRecruit.key,
        );

        let channelName: string | null;
        if (channelId === privateRecruitChannelId) {
            channelName = null;
        } else if (channelId === anarchyRecruitChannelId) {
            channelName = 'バンカラ募集';
        } else if (channelId === regularRecruitChannelId) {
            channelName = 'ナワバリ募集';
        } else if (channelId === eventRecruitChannelId) {
            channelName = 'イベマ募集';
        } else if (channelId === salmonRecruitChannelId) {
            channelName = 'サーモン募集';
        } else if (channelId === raidersRecruitChannelId) {
            channelName = 'レイダース募集';
        } else if (channelId === otherGamesRecruitChannelId) {
            channelName = null;
        } else if (channelId === shiverRecruitChannelId) {
            channelName = 'フウカ募集';
        } else if (channelId === fryeRecruitChannelId) {
            channelName = 'ウツホ募集';
        } else if (channelId === bigmanRecruitChannelId) {
            channelName = 'マンタロー募集';
        } else {
            return;
        }

        const content = await availableRecruitString(guild, channelId);

        await sendStickyMessage(guild, channelId, StickyKey.AvailableRecruit, {
            content: content,
            components: exists(channelName) ? [createNewRecruitButton(channelName)] : [],
            flags: MessageFlags.SuppressNotifications,
        });
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}

export async function sendCloseEmbedSticky(guild: Guild, channel: Channel) {
    if (
        channel.isTextBased() &&
        !channel.isDMBased() &&
        !channel.isThread() &&
        !channel.isVoiceBased()
    ) {
        const content = await availableRecruitString(guild, channel.id);
        const helpEmbed = await getCommandHelpEmbed(guild, channel.name);
        await sendStickyMessage(guild, channel.id, StickyKey.AvailableRecruit, {
            content: content,
            embeds: [helpEmbed],
            components: [createNewRecruitButton(channel.name)],
            flags: MessageFlags.SuppressNotifications,
        });
    }
}

export async function availableRecruitString(guild: Guild, channelId: string) {
    let recruitData = await RecruitService.getRecruitsByChannelId(guild.id, channelId);
    const privateRecruitChannelId = await UniqueChannelService.getChannelIdByKey(
        guild.id,
        ChannelKeySet.PrivateRecruit.key,
    );
    const otherGamesRecruitChannelId = await UniqueChannelService.getChannelIdByKey(
        guild.id,
        ChannelKeySet.OtherGamesRecruit.key,
    );

    if (channelId === privateRecruitChannelId) {
        // チャンネルIDがプラベ募集チャンネルの場合は、フォーラムでのコマンド募集も含める
        recruitData = await RecruitService.getRecruitsByRecruitType(
            guild.id,
            RecruitType.PrivateRecruit,
        );
    } else if (channelId === otherGamesRecruitChannelId) {
        // チャンネルIDが別ゲー募集チャンネルの場合は、フォーラムでの別ゲー募集も含める
        recruitData = await RecruitService.getRecruitsByRecruitType(
            guild.id,
            RecruitType.OtherGameRecruit,
        );
    }

    recruitData.sort((x, y) => x.createdAt.getTime() - y.createdAt.getTime()); // 作成順でソート

    let recruits = '';
    let count = 0; // 募集数カウンタ
    for (const recruit of recruitData) {
        const participantsData = await ParticipantService.getAllParticipants(
            guild.id,
            recruit.messageId,
        );
        const applicantList = []; // 参加希望者リスト
        for (const participant of participantsData) {
            if (participant.userType === 2) {
                applicantList.push(participant);
            }
        }
        const message = await searchMessageById(guild, recruit.channelId, recruit.messageId);
        const recruiter = participantsData[0];
        if (exists(message) && participantsData.length !== 0) {
            // 別チャンネルで同じタイプの募集をしているときmessage = nullになる
            if (recruit.recruitNum !== -1) {
                recruits =
                    recruits +
                    `\n\`${recruiter.member.displayName}\`: ${message.url} \`[${applicantList.length}/${recruit.recruitNum}\`]`;
            } else {
                recruits =
                    recruits +
                    `\n\`${recruiter.member.displayName}\`: ${message.url} \`[${applicantList.length}\`]`;
            }
            count++;
        } else {
            await RecruitService.deleteRecruit(guild.id, recruit.messageId);
            await ParticipantService.deleteAllParticipant(guild.id, recruit.messageId);
            logger.warn(
                `recruit message is not found. record deleted. \n[guildId: ${guild.id}, messageId: ${recruit.messageId}]`,
            );
        }
    }

    let result = '**現在参加受付中の募集一覧** `[' + count + ']`';
    if (count === 0) {
        result += '\n`現在このチャンネルで参加受付中の募集はありません。`';
    } else {
        result += recruits;
    }

    return result;
}

export async function getStickyChannelId(recruit: Recruit) {
    const privateRecruitChannelId = await UniqueChannelService.getChannelIdByKey(
        recruit.guildId,
        ChannelKeySet.PrivateRecruit.key,
    );
    const otherGamesRecruitChannelId = await UniqueChannelService.getChannelIdByKey(
        recruit.guildId,
        ChannelKeySet.OtherGamesRecruit.key,
    );
    if (recruit.recruitType === RecruitType.PrivateRecruit) {
        return privateRecruitChannelId;
    } else if (recruit.recruitType === RecruitType.OtherGameRecruit) {
        return otherGamesRecruitChannelId;
    }
}
