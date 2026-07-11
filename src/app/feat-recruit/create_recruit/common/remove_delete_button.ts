import { RecruitData } from '@/app/feat-recruit/common/types/recruit_data';
import { log4js_obj } from '@/infra/logging/log4js';
import { exists } from '@/shared/assert';
import { searchMessageById } from '@/shared/discord_helpers/message_manager';

const logger = log4js_obj.getLogger('recruit');

export async function removeDeleteButton(recruitData: RecruitData, deleteButtonMessageId: string) {
    const guild = recruitData.guild;
    const deleteButtonMessage = await searchMessageById(
        guild,
        recruitData.recruitChannel.id,
        deleteButtonMessageId,
    );
    if (exists(deleteButtonMessage)) {
        try {
            await deleteButtonMessage.delete();
        } catch (error) {
            logger.warn('recruit delete button has already been deleted');
        }
    }
}
