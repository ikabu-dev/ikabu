import { placeHold } from '@/constant';

export type XProperties = {
    startTime: string;
    endTime: string;
    xMatchSetting: {
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
    } | null;
    festMatchSetting: {
        __typename: string;
    } | null;
};

export function getXDummyProperties(startTime: Date, endTime: Date): XProperties {
    return {
        startTime: startTime.toString(),
        endTime: endTime.toString(),
        xMatchSetting: {
            __isVsSetting: 'XMatchSetting',
            __typename: 'XMatchSetting',
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
        festMatchSetting: null,
    };
}
