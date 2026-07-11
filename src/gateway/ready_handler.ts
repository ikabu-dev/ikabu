import { Client } from 'discord.js';

import { env } from '@/config/env';
import { setEnrollmentCount } from '@/features/enrollment_count/set_enrollment_count';
import { saveChannelAtLaunch } from '@/features/guild_sync/store_channel';
import { saveRoleAtLaunch } from '@/features/guild_sync/store_role';
import { checkCallMember } from '@/features/stats/voice_count';
import { disconnectFromVC } from '@/features/voice/disconnect_from_vc';
import { ParticipantService } from '@/infra/db/repositories/participant_service';
import { updateLocale, updateSchedule } from '@/infra/external/splatoon3-ink/splatoon3_ink';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { registerSlashCommands } from '@/registry/register';
import { assertExistCheck } from '@/shared/assert';

const logger = log4js_obj.getLogger();

/** Discord への接続が完了したあとに行う初期化 */
export async function handleClientReady(client: Client<true>) {
    try {
        assertExistCheck(client.user);
        logger.info(`Logged in as ${client.user.tag}!`);
        await saveChannelAtLaunch(client);
        await saveRoleAtLaunch(client);
        await registerSlashCommands();
        const guild = await client.guilds.fetch(env.serverId || '');
        setEnrollmentCount(client.user, guild);
        await updateSchedule();
        await updateLocale();
        await checkCallMember(guild);
        await disconnectFromVC(client);
        await ParticipantService.deleteUnuseParticipant();
    } catch (error) {
        await sendErrorLogs(logger, error);
    }
}
