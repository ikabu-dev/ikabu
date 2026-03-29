import { log4js_obj } from '../../../../log4js_settings';
import { searchMessageById } from '../../../common/manager/message_manager';
import { exists } from '../../../common/others';
import { RecruitData } from '../../types/recruit_data';

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
