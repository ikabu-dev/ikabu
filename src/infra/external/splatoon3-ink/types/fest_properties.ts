import { placeHold } from '@/config/constants/images';

export type FestProperties = {
    startTime: string;
    endTime: string;
    festMatchSettings: festMatchSettings | null;
};

type festMatchSettings = [
    {
        __isVsSetting: string;
        __typename: string;
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
        vsRule: {
            name: string;
            rule: string;
            id: string;
        };
    },
    {
        __isVsSetting: string;
        __typename: string;
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
        vsRule: {
            name: string;
            rule: string;
            id: string;
        };
    },
];

export function getFestDummyProperties(startTime: Date, endTime: Date): FestProperties {
    return {
        startTime: startTime.toString(),
        endTime: endTime.toString(),
        festMatchSettings: [
            {
                __isVsSetting: 'FestMatchSetting',
                __typename: 'FestMatchSetting',
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
            },
            {
                __isVsSetting: 'FestMatchSetting',
                __typename: 'FestMatchSetting',
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
            },
        ],
    };
}
