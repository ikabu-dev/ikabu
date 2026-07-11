import { Member } from '@prisma/client';

import { exists } from '@/shared/assert';

export function buildRecruitText(
    recruiterMention: string,
    recruitName: string,
    attendee1: Member | null,
    attendee2: Member | null,
    attendee3: Member | null,
): string {
    let txt = `### ${recruiterMention}たんの${recruitName}\n`;
    const members: string[] = [];

    if (exists(attendee1)) members.push(attendee1.mention + 'たん');
    if (exists(attendee2)) members.push(attendee2.mention + 'たん');
    if (exists(attendee3)) members.push(attendee3.mention + 'たん');

    if (members.length !== 0) {
        for (const i in members) {
            if (parseInt(i) === 0) {
                txt = txt + members[i];
            } else {
                txt = txt + 'と' + members[i];
            }
        }
        txt += 'の参加が既に決定しているでし！\n';
    }

    txt += 'よければ合流しませんか？';
    return txt;
}

export function buildOtherGameRecruitText(recruiterMention: string, recruitName: string): string {
    return `### ${recruiterMention}たんの${recruitName}\n`;
}
