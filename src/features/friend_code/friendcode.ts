import { Member } from '@prisma/client';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    CacheType,
    ChatInputCommandInteraction,
    EmbedBuilder,
    Message,
    MessageFlags,
    User,
} from 'discord.js';

import { FriendCodeButton } from '@/config/constants/button_id';
import { ChannelKeySet } from '@/config/constants/channel_key';
import { FriendCodeService } from '@/infra/db/repositories/friend_code_service';
import { UniqueChannelService } from '@/infra/db/repositories/unique_channel_service';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { assertExistCheck, exists, notExists } from '@/shared/assert';
import { searchChannelById } from '@/shared/discord_helpers/channel_manager';
import { getGuildByInteraction } from '@/shared/discord_helpers/guild_manager';
import { searchDBMemberById } from '@/shared/discord_helpers/member_manager';
const logger = log4js_obj.getLogger();

export async function handleFriendCode(interaction: ChatInputCommandInteraction<CacheType>) {
    if (!interaction.isChatInputCommand()) return;
    // 'インタラクションに失敗'が出ないようにするため

    const options = interaction.options;
    const subCommand = options.getSubcommand();
    // void で投げっぱなしにすると、例外を command_handler の try/catch が受け取れず、
    // そのまま unhandled rejection (= プロセス停止) になるため await する
    if (subCommand === 'add') {
        await insertFriendCode(interaction);
    } else if (subCommand === 'show') {
        await selectFriendCode(interaction);
    }
}

export async function selectFriendCode(interaction: ChatInputCommandInteraction<CacheType>) {
    await interaction.deferReply({});

    let targetUser: Member | User | null;
    let userId: string;
    if (interaction.inGuild()) {
        const guild = await getGuildByInteraction(interaction);
        targetUser = await searchDBMemberById(guild, interaction.member.user.id);
        userId = interaction.member.user.id;
    } else {
        targetUser = interaction.user;
        userId = interaction.user.id;
    }

    const fcObj = await FriendCodeService.getFriendCodeObjByUserId(userId);

    assertExistCheck(targetUser, 'member');

    if (exists(fcObj)) {
        const fcUrl = fcObj.url;
        const buttons = new ActionRowBuilder<ButtonBuilder>();
        if (exists(fcUrl)) {
            buttons.addComponents([
                new ButtonBuilder()
                    .setURL(fcUrl)
                    .setLabel('NSOアプリで開く')
                    .setStyle(ButtonStyle.Link),
            ]);
        }
        buttons.addComponents([
            new ButtonBuilder()
                .setCustomId(FriendCodeButton.Hide)
                .setLabel('削除')
                .setStyle(ButtonStyle.Danger),
        ]);
        return await interaction.editReply({
            embeds: [composeEmbed(targetUser, fcObj.code, true)],
            components: [buttons],
        });
    }

    if (interaction.inGuild()) {
        const guild = await getGuildByInteraction(interaction);
        const introductionChannelId = await UniqueChannelService.getChannelIdByKey(
            guild.id,
            ChannelKeySet.Introduction.key,
        );

        if (notExists(introductionChannelId)) {
            return await interaction.editReply(
                'フレンドコードが登録されていないでし！\n`/friend_code add`でコードを登録してみるでし！',
            );
        }

        const introductionChannel = await searchChannelById(guild, introductionChannelId);
        if (exists(introductionChannel) && introductionChannel.isTextBased()) {
            let result = null;
            try {
                const messages = await introductionChannel.messages.fetch({ limit: 100 });
                const list = messages.filter(
                    (message: Message<true>) => userId === message.author.id && !message.author.bot,
                );
                result = list.map(function (value: Message<true>) {
                    return value.content;
                });
            } catch (error) {
                await sendErrorLogs(logger, error);
            }

            const button = new ActionRowBuilder<ButtonBuilder>();
            button.addComponents([
                new ButtonBuilder()
                    .setCustomId(FriendCodeButton.Hide)
                    .setLabel('削除')
                    .setStyle(ButtonStyle.Danger),
            ]);

            if (exists(result) && result.length > 0) {
                const embeds = [];
                for (const r of result) {
                    embeds.push(composeEmbed(targetUser, r, false));
                }
                return await interaction.editReply({
                    embeds,
                    components: [button],
                });
            } else {
                await interaction.followUp({
                    content:
                        '自己紹介チャンネルに投稿がないか、投稿した日時が古すぎて検索できないでし\n `/friend_code add`でコードを登録してみるでし！',
                });
                return await interaction.deleteReply();
            }
        }
    } else {
        // DMかつDBにないとき or GuildかつDBにないかつ自己紹介チャンネルが見つからないとき(練習鯖とか)
        return await interaction.editReply(
            'フレンドコードが登録されていないでし！\n`/friend_code add`でコードを登録してみるでし！',
        );
    }
}

function composeEmbed(user: User | Member, fc: string, isDatabase: boolean) {
    const embed = new EmbedBuilder();
    embed.setDescription(fc);

    if (user instanceof User) {
        embed.setAuthor({
            name: user.displayName,
            iconURL: user.displayAvatarURL(),
        });
    } else if (exists(user) && exists(user.displayName) && exists(user.iconUrl)) {
        embed.setAuthor({
            name: user.displayName,
            iconURL: user.iconUrl,
        });
    }

    if (!isDatabase) {
        embed.setFooter({
            text: '自己紹介チャンネルより引用',
        });
    }
    return embed;
}

async function insertFriendCode(interaction: ChatInputCommandInteraction<CacheType>) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let userId;
    if (interaction.inGuild()) {
        userId = interaction.member.user.id;
    } else {
        userId = interaction.user.id;
    }
    const options = interaction.options;
    const code = options.getString('フレンドコード', true);
    const fcUrl = options.getString('フレンドコードurl');

    if (exists(fcUrl) && !isFcUrl(fcUrl)) {
        return await interaction.editReply(`\`${fcUrl}\`はフレンドコードのURLではないでし！`);
    }

    await FriendCodeService.save(userId, code, fcUrl);
    await interaction.editReply({
        content: `\`${code}\`で覚えたでし！変更したい場合はもう一度登録すると上書きされるでし！`,
    });
}

export async function deleteFriendCode(interaction: ButtonInteraction<CacheType>) {
    await interaction.message.delete();
}

function isFcUrl(url: string) {
    return url.match(/https:\/\/lounge.nintendo.com\/friendcode\//g) !== null;
}
