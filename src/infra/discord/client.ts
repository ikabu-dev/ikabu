import { Client, GatewayIntentBits, Partials } from 'discord.js';

/**
 * Discord クライアント。生成のみを行い、login は bootstrap が担う。
 * ここで login すると import しただけで接続が始まってしまい、
 * 起動順序を制御できなくなるため。
 */
export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildScheduledEvents,
    ],
    partials: [
        Partials.User,
        Partials.GuildMember,
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ],
});
