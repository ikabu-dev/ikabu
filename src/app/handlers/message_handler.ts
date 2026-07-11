import { AttachmentBuilder, Message, PermissionsBitField } from 'discord.js';

import { ChannelKeySet } from '@/config/constants/channel_key';
import { env } from '@/config/env';
import { deleteToken } from '@/features/message_utils/delete_token';
import { dispand } from '@/features/message_utils/dispander';
import { removeRookie } from '@/features/onboarding/remove_rookie';
import { sendIntentionConfirmReply } from '@/features/onboarding/send_questionnaire';
import { sendRecruitSticky } from '@/features/recruit/sticky/recruit_sticky_messages';
import { stageInfo } from '@/features/stage_info/stageinfo';
import { chatCountUp } from '@/features/stats/message_count';
import { play } from '@/features/utils/voice/tts/discordjs_voice';
import { vcToolsStickyFromMessage } from '@/features/vc_tools/vc_tools_message';
import { UniqueChannelService } from '@/infra/db/repositories/unique_channel_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { exists } from '@/shared/assert';
import { searchAPIMemberById } from '@/shared/discord_helpers/member_manager';
import { randomBool } from '@/shared/random';

const logger = log4js_obj.getLogger('message');

export async function call(message: Message<true>) {
    try {
        if (message.author.bot) {
            if (message.content.startsWith('/poll')) {
                if (message.author.username === 'ブキチ') {
                    logger.info(message.author.username);
                    await message.delete();
                }
            }
            return;
        } else {
            // ステージ情報デバッグ用
            if (message.content === 'stageinfo') {
                const guild = await message.guild.fetch();
                const member = await searchAPIMemberById(guild, message.author.id);
                if (
                    exists(member) &&
                    member.permissions.has(PermissionsBitField.Flags.ManageChannels)
                ) {
                    await stageInfo(guild);
                }
            }
            if (exists(env.questionnaireUrl)) {
                const botCommandChannelId = await UniqueChannelService.getChannelIdByKey(
                    message.guild.id,
                    ChannelKeySet.BotCommand.key,
                );
                if (message.channel.id !== botCommandChannelId && randomBool(0.00025)) {
                    await sendIntentionConfirmReply(
                        message,
                        message.author.id,
                        'QUESTIONNAIRE_URL',
                    );
                }
            }
        }
        if (message.content.match('ボーリング')) {
            await message.reply(
                '```「ボウリング」とは、前方に正三角形に並べられた10本のピンと呼ばれる棒をめがけボールを転がし、倒れたピンの数によって得られる得点を競うスポーツでし。' +
                    '専用施設のボウリング場に設置された細長いレーンの上で行われる屋内競技で、レーンの長さが約23m、ピンまでの距離は約18mで行われるのが一般的でし。' +
                    '英語では “bowling” と書き、球を意味する “ball” ではなく、ラテン語で「泡」や「こぶ」を意味する “bowl” が語源とされているでし。' +
                    '\n文部科学省は国語審議会で、球技を指す場合は「ボウリング」表記を用い、掘削を意味する「ボーリング」と区別することを推奨しているでし。```',
            );
        }
        if (message.content.match('お前を消す方法')) {
            const Kairu = new AttachmentBuilder('./images/Kairu.png');
            await message.reply({ files: [Kairu] });
        }

        await deleteToken(message);
        await dispand(message);
        await chatCountUp(message);
        await sendRecruitSticky({ message: message });
        await vcToolsStickyFromMessage(message);
        await removeRookie(message);
        await play(message);
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
