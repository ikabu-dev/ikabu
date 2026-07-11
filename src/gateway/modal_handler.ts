import { URLSearchParams } from 'url';

import { CacheType, ModalSubmitInteraction } from 'discord.js';

import { anarchyRecruit } from '@/features/recruit/create/anarchy_recruit';
import { eventRecruit } from '@/features/recruit/create/event_recruit';
import { festRecruit } from '@/features/recruit/create/fest_recruit';
import { raidersRecruit } from '@/features/recruit/create/raiders_recruit';
import { regularRecruit } from '@/features/recruit/create/regular_recruit';
import { salmonRecruit } from '@/features/recruit/create/salmon_recruit';
import { recruitEdit } from '@/features/recruit/interactions/edit_recruit/recruit_edit';
import { MemberService } from '@/infra/db/repositories/member_service';
import { exists } from '@/shared/assert';

export async function call(interaction: ModalSubmitInteraction<CacheType>) {
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
