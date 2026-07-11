import { ButtonInteraction } from 'discord.js';

import { createAnarchyModal } from '@/features/recruit/ui/modals/create_anarchy_modal';
import { createEventModal } from '@/features/recruit/ui/modals/create_event_modal';
import { createFestModal } from '@/features/recruit/ui/modals/create_fest_modal';
import { createRaidersModal } from '@/features/recruit/ui/modals/create_raiders_modal';
import { createRegularModal } from '@/features/recruit/ui/modals/create_regular_modal';
import { createSalmonModal } from '@/features/recruit/ui/modals/create_salmon_modal';

export async function handleCreateModal(
    interaction: ButtonInteraction<'cached' | 'raw'>,
    params: URLSearchParams,
) {
    const channelName = params.get('cn');
    switch (channelName) {
        case 'イベマ募集':
            await createEventModal(interaction);
            break;
        case 'ナワバリ募集':
            await createRegularModal(interaction);
            break;
        case 'バンカラ募集':
            await createAnarchyModal(interaction);
            break;
        case 'フウカ募集':
        case 'ウツホ募集':
        case 'マンタロー募集':
            await createFestModal(interaction, channelName);
            break;
        case 'サーモン募集':
            await createSalmonModal(interaction);
            break;
        case 'レイダース募集':
            await createRaidersModal(interaction);
            break;

        default:
            break;
    }
}
