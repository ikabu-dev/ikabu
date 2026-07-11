import { placeHold } from '@/constant';

export type BankaraProperties = {
    startTime: string;
    endTime: string;
    bankaraMatchSettings: bankaraMatchSettings | null;
    festMatchSetting: {
        __typename: string;
    } | null;
};

export type bankaraMatchSettings = [
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
        mode: string;
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
        mode: string;
    },
];

export function getBankaraDummyProperties(startTime: Date, endTime: Date): BankaraProperties {
    return {
        startTime: startTime.toString(),
        endTime: endTime.toString(),
        bankaraMatchSettings: [
            {
                __isVsSetting: 'BankaraMatchSetting',
                __typename: 'BankaraMatchSetting',
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
                mode: 'dummy_mode',
            },
            {
                __isVsSetting: 'BankaraMatchSetting',
                __typename: 'BankaraMatchSetting',
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
                mode: 'dummy_mode',
            },
        ],
        festMatchSetting: null,
    };
}
