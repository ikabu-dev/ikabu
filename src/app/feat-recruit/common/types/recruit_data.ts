import { Member } from '@prisma/client';
import { Guild, GuildMember, GuildTextBasedChannel, VoiceBasedChannel } from 'discord.js';

import { Sp3Schedule } from '@/app/common/apis/splatoon3.ink/types/schedule';

export type RecruitData = {
    guild: Guild;
    interactionMember: GuildMember;
    recruitChannel: GuildTextBasedChannel;
    scheduleNum: number;
    txt: string;
    recruitNum: number;
    condition: string;
    count: number;
    recruiter: Member;
    attendee1: Member | null;
    attendee2: Member | null;
    attendee3: Member | null;
    schedule: Sp3Schedule;
    voiceChannel: VoiceBasedChannel | null;
};
