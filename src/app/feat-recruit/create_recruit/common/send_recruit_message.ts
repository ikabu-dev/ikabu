import {
    AttachmentBuilder,
    ChatInputCommandInteraction,
    Message,
    MessageFlags,
    ModalSubmitInteraction,
} from 'discord.js';

import {
    embedRecruitDeleteButton,
    recruitActionRow,
    recruitDeleteButton,
} from './create_recruit_buttons';
import { exists } from '../../../common/others';
import { getMemberMentions } from '../../common/member_list';
import { RecruitData } from '../../common/types/recruit_data';

type RecruitMessageList = {
    recruitMessage: Message<true>;
    ruleMessage: Message<true> | null;
    buttonMessage: Message<true>;
    deleteButtonMessage: Message<true>;
};

export type RecruitImageBuffers = {
    recruitBuffer: Buffer;
    ruleBuffer: Buffer;
};

// 2枚目(ルール画像)を送らない募集用
export type RecruitImageBuffersWithoutRule = {
    recruitBuffer: Buffer;
    ruleBuffer: null;
};

export async function sendRecruitCanvas(
    interaction:
        | ChatInputCommandInteraction<'cached' | 'raw'>
        | ModalSubmitInteraction<'cached' | 'raw'>,
    recruitRoleId: string | null,
    recruitData: RecruitData,
    imageBuffers: RecruitImageBuffers | RecruitImageBuffersWithoutRule,
): Promise<RecruitMessageList> {
    const recruitChannel = recruitData.recruitChannel;

    const recruit = new AttachmentBuilder(imageBuffers.recruitBuffer, {
        name: 'ikabu_recruit.png',
    });

    const recruitMessage = await interaction.editReply({
        content: recruitData.txt,
        files: [recruit],
    });

    if (!recruitMessage.inGuild()) throw new Error('recruitMessage is not in guild');

    let ruleMessage: Message<true> | null = null;
    if (exists(imageBuffers.ruleBuffer)) {
        const rule = new AttachmentBuilder(imageBuffers.ruleBuffer, {
            name: 'rules.png',
        });
        ruleMessage = await recruitChannel.send({ files: [rule] });
    }

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
        components: [
            exists(ruleMessage)
                ? recruitDeleteButton(buttonMessage, recruitMessage, ruleMessage)
                : embedRecruitDeleteButton(buttonMessage, recruitMessage),
        ],
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
