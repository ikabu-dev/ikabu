import { Guild } from 'discord.js';

import { VoiceCountService } from '@/infra/db/repositories/voice_count_service';
import { exists, notExists } from '@/shared/assert';

export async function startCall(userId: string) {
    await VoiceCountService.saveStartTime(userId, new Date());
}

export async function endCall(userId: string) {
    const counter = await VoiceCountService.getCountByUserId(userId);
    if (notExists(counter)) return;

    const startTime = counter.startTime;
    if (notExists(startTime)) return;

    const preTotalSec = counter.totalSec;

    const totalSec = Math.floor((new Date().getTime() - startTime.getTime()) / 1000) + preTotalSec;
    await VoiceCountService.saveVoiceCount(userId, totalSec);
    await VoiceCountService.saveStartTime(userId, null);
}

// bot再起動時の通話中メンバーのチェック
export async function checkCallMember(guild: Guild) {
    // DBから通話中メンバーリストを取得
    let previousInCallMemberList = await VoiceCountService.getInCallCount();

    const channelCollection = await guild.channels.fetch();

    // 全てのボイス系チャンネルを取得
    const voiceChannelCollection = channelCollection.filter(
        (channel) => exists(channel) && channel.isVoiceBased(),
    );

    for (const voiceChannel of voiceChannelCollection.values()) {
        if (notExists(voiceChannel)) continue;

        const members = voiceChannel.members;
        for (const member of members.values()) {
            const userId = member.user.id;
            const previousInCallMember = previousInCallMemberList.find(
                (member) => member.userId === userId,
            );

            if (exists(previousInCallMember)) {
                // previousInCallMemberListから削除
                previousInCallMemberList = previousInCallMemberList.filter(
                    (member) => member.userId !== previousInCallMember.userId,
                );
            } else {
                // DBに保存されていない場合はその時間から通話開始とみなす
                await startCall(userId);
            }
        }
    }

    // DBに残ったものは通話終了とみなす
    for (const previousInCallMember of previousInCallMemberList) {
        await endCall(previousInCallMember.userId);
    }
}
