import { Guild, GuildScheduledEventCreateOptions } from 'discord.js';

import { exists } from '@/shared/assert';

export function getGuildScheduledEvents(guild: Guild) {
    const scheduledEvents = guild.scheduledEvents.cache;
    return scheduledEvents;
}

export async function createGuildScheduledEvent(
    guild: Guild,
    startTime: Date,
    endTime: Date,
    name: string,
    description: string,
) {
    const options: GuildScheduledEventCreateOptions = {
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        name: name,
        description: description,
        privacyLevel: 2, // サーバー限定
        entityType: 3,
        entityMetadata: {
            location: 'イカ部',
        },
    };
    await guild.scheduledEvents.create(options);
}

export function existsGuildScheduledEvent(guild: Guild, name: string) {
    const events = getGuildScheduledEvents(guild);
    const event = events.find((event) => event.name === name);
    return exists(event);
}
