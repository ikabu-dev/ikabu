import { placeHold } from '@/constant';

export type EventProperties = {
    leagueMatchSetting: {
        leagueMatchEvent: {
            leagueMatchEventId: string;
            name: string;
            desc: string;
            regulationUrl: null;
            regulation: string;
            id: string;
        };
        vsStages: [
            {
                vsStageId: number;
                name: string;
                image: {
                    url: string;
                };
                id: string;
            },
            {
                vsStageId: number;
                name: string;
                image: {
                    url: string;
                };
                id: string;
            },
        ];
        __isVsSetting: string;
        __typename: string;
        vsRule: {
            name: string;
            rule: string;
            id: string;
        };
    };
    timePeriods: [
        {
            startTime: string;
            endTime: string;
        },
        {
            startTime: string;
            endTime: string;
        },
        {
            startTime: string;
            endTime: string;
        },
    ];
};

export function getEventDummyProperties(startTime: Date, endTime: Date): EventProperties {
    return {
        leagueMatchSetting: {
            leagueMatchEvent: {
                id: 'dummy_event_id',
                name: 'dummy_event',
                desc: 'dummy_event',
                regulationUrl: null,
                regulation: 'dummy_regulation',
                leagueMatchEventId: 'dummy_event_id',
            },
            vsRule: { id: 'dummy_rule_id', name: 'dummy_rule', rule: 'dummy_rule' },
            vsStages: [
                {
                    id: 'dummy_stage_a_id',
                    name: 'dummy_stage_a',
                    image: { url: placeHold.error100x100 },
                    vsStageId: 0,
                },
                {
                    id: 'dummy_stage_b_id',
                    name: 'dummy_stage_b',
                    image: { url: placeHold.error100x100 },
                    vsStageId: 1,
                },
            ],
            __isVsSetting: 'LeagueMatchSetting',
            __typename: 'LeagueMatchSetting',
        },
        timePeriods: [
            { startTime: startTime.toString(), endTime: endTime.toString() },
            { startTime: startTime.toString(), endTime: endTime.toString() },
            { startTime: startTime.toString(), endTime: endTime.toString() },
        ],
    };
}
