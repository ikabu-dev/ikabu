import {
    AttachmentBuilder,
    ChatInputCommandInteraction,
    Message,
    MessageFlags,
    ModalSubmitInteraction,
} from 'discord.js';

import { recruitActionRow, recruitDeleteButton } from './create_recruit_buttons';
import { getMemberMentions } from '../../common/member_list';
import { RecruitData } from '../../common/types/recruit_data';

type RecruitMessageList = {
    recruitMessage: Message<true>;
    ruleMessage: Message<true>;
    buttonMessage: Message<true>;
    deleteButtonMessage: Message<true>;
};

export type RecruitImageBuffers = {
    recruitBuffer: Buffer;
    ruleBuffer: Buffer;
};

export async function sendRecruitCanvas(
    interaction:
        | ChatInputCommandInteraction<'cached' | 'raw'>
        | ModalSubmitInteraction<'cached' | 'raw'>,
    recruitRoleId: string | null,
    recruitData: RecruitData,
    imageBuffers: RecruitImageBuffers,
): Promise<RecruitMessageList> {
    const recruitChannel = recruitData.recruitChannel;

    const recruit = new AttachmentBuilder(imageBuffers.recruitBuffer, {
        name: 'ikabu_recruit.png',
    });
    const rule = new AttachmentBuilder(imageBuffers.ruleBuffer, {
        name: 'rules.png',
    });

    const recruitMessage = await interaction.editReply({
        content: recruitData.txt,
        files: [recruit],
    });

    if (!recruitMessage.inGuild()) throw new Error('recruitMessage is not in guild');

    const ruleMessage = await recruitChannel.send({ files: [rule] });

    let buttonMessage = await recruitChannel.send({
        content: `<@&${recruitRoleId}> ボタンを押して参加表明するでし！\n${getMemberMentions(
            recruitData.recruitNum,
            [],
        )}`,
    });

    buttonMessage = await buttonMessage.edit({
        components: [recruitActionRow(recruitMessage)],
    });

    const deleteButtonMessage = await recruitChannel.send({
        components: [recruitDeleteButton(buttonMessage, recruitMessage, ruleMessage)],
    });

    await interaction.followUp({
        content: '募集完了でし！参加者が来るまで待つでし！\n15秒間は募集を取り消せるでし！',
        flags: MessageFlags.Ephemeral,
    });

    return {
        recruitMessage: recruitMessage,
        ruleMessage: ruleMessage,
        buttonMessage: buttonMessage,
        deleteButtonMessage: deleteButtonMessage,
    };
}
