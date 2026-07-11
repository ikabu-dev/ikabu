import { BankaraProperties } from '@/infra/external/splatoon3-ink/types/bankara_properties';
import { EventProperties } from '@/infra/external/splatoon3-ink/types/event_properties';
import { FestProperties } from '@/infra/external/splatoon3-ink/types/fest_properties';
import { RegularProperties } from '@/infra/external/splatoon3-ink/types/regular_properties';
import {
    BigRunProperties,
    SalmonRegularProperties,
    TeamContestProperties,
} from '@/infra/external/splatoon3-ink/types/salmon_properties';
import { XProperties } from '@/infra/external/splatoon3-ink/types/x_properties';

export type Sp3Schedule = {
    regularSchedules: {
        nodes: RegularProperties[];
    };
    bankaraSchedules: {
        nodes: BankaraProperties[];
    };
    xSchedules: {
        nodes: XProperties[];
    };
    eventSchedules: {
        nodes: EventProperties[];
    };
    festSchedules: {
        nodes: FestProperties[];
    };
    coopGroupingSchedule: {
        bannerImage: {
            url: string;
        };
        regularSchedules: {
            nodes: SalmonRegularProperties[];
        };
        bigRunSchedules: {
            nodes: BigRunProperties[];
        };
        teamContestSchedules: { nodes: TeamContestProperties[] };
    };
};
