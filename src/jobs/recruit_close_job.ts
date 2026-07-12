import cron from 'cron';
import { Client, Guild } from 'discord.js';

import { RECRUIT_CLOSE_SCAN_LIMIT } from '@/config/constants/recruit';
import {
    recruitAutoClose,
    StickyRefreshTarget,
} from '@/features/recruit/interactions/close_recruit/auto_close';
import {
    sendCloseEmbedSticky,
    sendRecruitSticky,
} from '@/features/recruit/sticky/recruit_sticky_messages';
import { ParticipantService } from '@/infra/db/repositories/participant_service';
import { RecruitService } from '@/infra/db/repositories/recruit_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { exists } from '@/shared/assert';
import { searchChannelById } from '@/shared/discord_helpers/channel_manager';

const logger = log4js_obj.getLogger('recruit');

/**
 * 期限切れの募集を〆る。
 *
 * 自動締切は2時間後という粒度の処理なので、1分間隔のスキャンで十分。
 */
export function startRecruitCloseJob(client: Client) {
    // 第4引数の true で生成と同時に開始する
    let isRunning = false;

    new cron.CronJob(
        '* * * * *',
        async () => {
            if (isRunning) return;
            isRunning = true;

            try {
                await closeExpiredRecruits(client);
            } catch (error) {
                await sendErrorLogs(logger, error);
            } finally {
                isRunning = false;
            }
        },
        null,
        true,
        'Asia/Tokyo',
    );
}

export async function closeExpiredRecruits(client: Client) {
    if (!client.isReady()) return;

    const { recruits: expiredRecruits, ttlScanCapped } = await RecruitService.getRecruitsToClose(
        new Date(),
    );

    if (ttlScanCapped) {
        // 黙って切り捨てない。溢れた分は次の tick で拾う
        logger.info(
            `TTL scan limit reached. closing up to ${RECRUIT_CLOSE_SCAN_LIMIT} TTL-expired recruits in this tick.`,
        );
    }

    // recruitAutoClose 自体は sticky を送らない。1 tick で同じチャンネルを何度も
    // 更新しないよう、更新対象をチャンネル単位で束ねてループの外で 1 回だけ送る。
    const stickyTargets = new Map<string, StickyRefreshTarget>();

    for (const recruit of expiredRecruits) {
        const guild = client.guilds.cache.get(recruit.guildId);

        // Bot が抜けたサーバーでは Discord 側を掃除しようがないので、DB の行だけ消す。
        // 残すと closeAt が過去のまま毎分スキャンに載り続ける。
        if (guild === undefined) {
            try {
                await RecruitService.deleteRecruit(recruit.guildId, recruit.messageId);
                await ParticipantService.deleteAllParticipant(recruit.guildId, recruit.messageId);
                logger.info(`recruit[${recruit.messageId}] has been deleted. [bot has left]`);
            } catch (error) {
                await sendErrorLogs(logger, error);
            }
            continue;
        }

        try {
            const stickyTarget = await recruitAutoClose(guild, recruit);
            stickyTargets.set(
                `${stickyTarget.kind}:${stickyTarget.guildId}:${stickyTarget.channelId}`,
                stickyTarget,
            );
            logger.info(`recruit[${recruit.messageId}] has been closed automatically.`);
        } catch (error) {
            await sendErrorLogs(logger, error);
        }
    }

    for (const target of stickyTargets.values()) {
        const guild = client.guilds.cache.get(target.guildId);
        if (guild === undefined) continue;

        try {
            await refreshRecruitSticky(guild, target);
        } catch (error) {
            // 1チャンネルの sticky 更新失敗が他チャンネルの更新を止めないようにする。
            // DB の行は既に削除済みなので締切自体は成功している。
            await sendErrorLogs(logger, error);
        }
    }
}

async function refreshRecruitSticky(guild: Guild, target: StickyRefreshTarget) {
    if (target.kind === 'thread') {
        // フォーラムやスレッドの場合は、テキストの募集チャンネルにSticky Messageを送信する
        await sendRecruitSticky({ channelOpt: { guild: guild, channelId: target.channelId } });
        return;
    }

    const recruitChannel = await searchChannelById(guild, target.channelId);
    if (exists(recruitChannel)) {
        await sendCloseEmbedSticky(guild, recruitChannel);
    }
}
