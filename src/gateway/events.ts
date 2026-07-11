import {
    AnyThreadChannel,
    CacheType,
    Client,
    DMChannel,
    GuildMember,
    Interaction,
    Message,
    MessageReaction,
    NonThreadGuildBasedChannel,
    PartialGuildMember,
    PartialMessageReaction,
    PartialUser,
    Role,
    User,
    VoiceState,
} from 'discord.js';

import { deleteChannel, saveChannel } from '@/features/guild_sync/store_channel';
import { deleteRole, saveRole } from '@/features/guild_sync/store_role';
import { handleThreadCreate } from '@/features/support_tag/handle_thread_create';

import { routeInteraction } from './interaction_router';
import {
    handleGuildMemberAdd,
    handleGuildMemberRemove,
    handleGuildMemberUpdate,
    handleUserUpdate,
} from './member_handler';
import * as messageHandler from './message_handler';
import { handleReactionAdd, handleReactionRemove } from './reaction_handler';
import { handleClientReady } from './ready_handler';
import * as voiceStateHandler from './voice_state_handler';

/**
 * Discord のイベントと、それを処理する機能を結びつける。
 * ここは配線だけを持ち、処理の中身は features 側に置く。
 */
export function registerDiscordEvents(client: Client) {
    client.on('clientReady', (readyClient: Client<true>) => {
        void handleClientReady(readyClient);
    });

    client.on('interactionCreate', (interaction: Interaction<CacheType>) => {
        void routeInteraction(client, interaction);
    });

    client.on('messageCreate', (message: Message<boolean>) => {
        if (message.inGuild()) {
            void messageHandler.call(message);
        }
    });

    client.on('guildMemberAdd', (member: GuildMember) => {
        void handleGuildMemberAdd(client, member);
    });

    client.on('guildMemberRemove', (member: GuildMember | PartialGuildMember) => {
        void handleGuildMemberRemove(client, member);
    });

    client.on('guildMemberUpdate', (_oldMember, newMember: GuildMember) => {
        void handleGuildMemberUpdate(newMember);
    });

    client.on('userUpdate', (_oldUser: User | PartialUser, newUser: User) => {
        void handleUserUpdate(client, newUser);
    });

    client.on(
        'messageReactionAdd',
        (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
            void handleReactionAdd(reaction, user);
        },
    );

    client.on(
        'messageReactionRemove',
        (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
            void handleReactionRemove(reaction, user);
        },
    );

    client.on('threadCreate', (thread: AnyThreadChannel) => {
        void handleThreadCreate(thread);
    });

    client.on('voiceStateUpdate', (oldState: VoiceState, newState: VoiceState) => {
        void voiceStateHandler.call(oldState, newState);
    });

    // チャンネルが作成されたとき
    client.on('channelCreate', (channel: NonThreadGuildBasedChannel) => {
        void saveChannel(channel);
    });

    // チャンネルが更新されたとき
    client.on(
        'channelUpdate',
        (
            _oldChannel: DMChannel | NonThreadGuildBasedChannel,
            newChannel: DMChannel | NonThreadGuildBasedChannel,
        ) => {
            if (!newChannel.isDMBased()) {
                void saveChannel(newChannel);
            }
        },
    );

    // チャンネルが削除されたとき
    client.on('channelDelete', (channel: DMChannel | NonThreadGuildBasedChannel) => {
        if (!channel.isDMBased()) {
            void deleteChannel(channel);
        }
    });

    // ロールが作成されたとき
    client.on('roleCreate', (role: Role) => {
        void saveRole(role);
    });

    // ロールが更新されたとき
    client.on('roleUpdate', (_oldRole: Role, newRole: Role) => {
        void saveRole(newRole);
    });

    // ロールが削除されたとき
    client.on('roleDelete', (role: Role) => {
        void deleteRole(role);
    });
}
