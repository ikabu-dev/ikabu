import { Message } from 'discord.js';

import { ErrorTexts } from '@/config/constants/error_texts';
import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { exists, notExists } from '@/shared/assert';
import { composeEmbed } from '@/shared/discord_helpers/message_embeds';
import { searchMessageById } from '@/shared/discord_helpers/message_manager';

const logger = log4js_obj.getLogger('dispander');

const regexDiscordMessageUrl =
    'https://(ptb.|canary.)?discord(app)?.com/channels/' +
    '(?<guild>[0-9]{18,19})/(?<channel>[0-9]{18,19})/(?<message>[0-9]{18,19})';

export async function dispand(message: Message<true>) {
    try {
        const result = await extractMessages(message);
        if (notExists(result.url)) return;

        for (const msg of result.messages) {
            if (message.content) {
                const embed = await composeEmbed(msg, result.url[0]);
                await message.channel.send({
                    embeds: [embed],
                });
            }
            for (const embed in msg.embeds) {
                await message.channel.send({ embeds: [msg.embeds[embed]] });
            }
            if (message.content === result.url[0]) {
                await message.delete();
            }
        }
    } catch (error) {
        await sendErrorLogs(logger, error);
        await message.reply(ErrorTexts.UndefinedError);
    }
}

async function extractMessages(message: Message<true>) {
    const messages = [];
    const matches = message.content.match(regexDiscordMessageUrl);
    if (
        notExists(matches) ||
        notExists(matches.groups) ||
        notExists(matches.groups.guild) ||
        notExists(matches.groups.channel) ||
        notExists(matches.groups.message)
    ) {
        // URLから各種プロパティを取得できなかった場合
        return { url: null, messages: [] };
    }
    const guild = message.guild;
    if (guild.id !== matches.groups.guild) {
        return { url: null, messages: [] };
    }
    const fetchedMessage = await searchMessageById(
        guild,
        matches.groups.channel,
        matches.groups.message,
    );
    if (exists(fetchedMessage)) {
        messages.push(fetchedMessage);
    } else {
        await message.reply('メッセージが見つからなかったでし！');
        return { url: null, messages: [] };
    }

    return { url: matches, messages: messages };
}
