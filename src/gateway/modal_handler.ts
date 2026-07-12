import { URLSearchParams } from 'url';

import { CacheType, ModalSubmitInteraction } from 'discord.js';

import { ErrorTexts } from '@/config/constants/error_texts';
import { anarchyRecruit } from '@/features/recruit/create/anarchy_recruit';
import { eventRecruit } from '@/features/recruit/create/event_recruit';
import { festRecruit } from '@/features/recruit/create/fest_recruit';
import { raidersRecruit } from '@/features/recruit/create/raiders_recruit';
import { regularRecruit } from '@/features/recruit/create/regular_recruit';
import { salmonRecruit } from '@/features/recruit/create/salmon_recruit';
import { recruitEdit } from '@/features/recruit/interactions/edit_recruit/recruit_edit';
import { MemberService } from '@/infra/db/repositories/member_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { exists } from '@/shared/assert';

const logger = log4js_obj.getLogger('interaction');

export async function call(interaction: ModalSubmitInteraction<CacheType>) {
    try {
        await dispatch(interaction);
    } catch (error) {
        await sendErrorLogs(logger, error);
        const modalChannel = interaction.channel;
        if (exists(modalChannel) && modalChannel.isSendable()) {
            await modalChannel.send(ErrorTexts.UndefinedError);
        }
    }
}

async function dispatch(interaction: ModalSubmitInteraction<CacheType>) {
    if (interaction.inGuild()) {
        const params = new URLSearchParams(interaction.customId);
        if (exists(params.get('recm'))) {
            await MemberService.createDummyUser(interaction.guildId);

            switch (params.get('recm')) {
                case 'regrec':
                    await regularRecruit(interaction);
                    break;
                case 'everec':
                    await eventRecruit(interaction);
                    break;
                case 'anarec':
                    await anarchyRecruit(interaction);
                    break;
                case 'salrec':
                    await salmonRecruit(interaction);
                    break;
                case 'fesrec':
                    await festRecruit(interaction);
                    break;
                case 'rairec':
                    await raidersRecruit(interaction);
                    break;
                case 'recedit':
                    await recruitEdit(interaction, params);
            }
        }
    }
    return;
}
