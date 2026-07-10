import { URLSearchParams } from 'url';

import { CacheType, ModalSubmitInteraction } from 'discord.js';

import { MemberService } from '../../db/member_service';
import { exists } from '../common/others';
import { anarchyRecruit } from '../feat-recruit/create_recruit/anarchy_recruit';
import { eventRecruit } from '../feat-recruit/create_recruit/event_recruit';
import { festRecruit } from '../feat-recruit/create_recruit/fest_recruit';
import { raidersRecruit } from '../feat-recruit/create_recruit/raiders_recruit';
import { regularRecruit } from '../feat-recruit/create_recruit/regular_recruit';
import { salmonRecruit } from '../feat-recruit/create_recruit/salmon_recruit';
import { recruitEdit } from '../feat-recruit/edit_recruit/recruit_edit';

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
