import { AutocompleteInteraction, CacheType, Client, Interaction } from 'discord.js';

import { log4js_obj } from '@/infra/logging/log4js';
import { sendErrorLogs } from '@/infra/logging/send_error_logs';
import { exists } from '@/shared/assert';
import { getDeveloperMention } from '@/shared/discord_helpers/developer_mention';

import * as buttonHandler from './button_handler';
import * as commandHandler from './command_handler';
import * as contextHandler from './context_handler';
import * as modalHandler from './modal_handler';

const logger = log4js_obj.getLogger();

/** Discord から届いた interaction を、種類ごとのハンドラへ振り分ける */
export async function routeInteraction(client: Client, interaction: Interaction<CacheType>) {
    try {
        // RawGuildのInteractionが送られてくる頻度を確認するためのログ
        if (interaction.inRawGuild()) {
            const guildId = interaction.guildId;
            const guild = await client.guilds.fetch(guildId);
            logger.warn(`raw guild interaction: ${guild.name}, guild fetched!`);
            if (exists(interaction.channel)) {
                await interaction.channel.send(
                    (await getDeveloperMention(interaction.guildId)) +
                        'サーバー情報が取得できなかったでし！',
                );
            }
        }

        if (interaction.isRepliable()) {
            if (interaction.isButton()) {
                void buttonHandler.call(interaction);
            } else if (interaction.isModalSubmit()) {
                void modalHandler.call(interaction);
            } else if (interaction.isMessageContextMenuCommand()) {
                void contextHandler.call(interaction);
            } else if (interaction.isUserContextMenuCommand()) {
                // interaction.isCommand()はcontextMenu系も含むため条件分岐しておく
            } else if (interaction.isChatInputCommand()) {
                void commandHandler.call(interaction);
            }
        }
    } catch (error) {
        const interactionLogger = log4js_obj.getLogger('interaction');
        if (!(interaction instanceof AutocompleteInteraction)) {
            const errorDetail = {
                content: `Command failed: ${error}`,
                interaction_replied: interaction.replied,
                interaction_deferred: interaction.deferred,
            };
            await sendErrorLogs(interactionLogger, errorDetail);
        }
    }
}
