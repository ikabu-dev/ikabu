import { placeHold } from '@/config/constants/images';

export type RegularProperties = {
    startTime: string;
    endTime: string;
    regularMatchSetting: {
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

export function getRegularDummyProperties(startTime: Date, endTime: Date): RegularProperties {
    return {
        startTime: startTime.toString(),
        endTime: endTime.toString(),
        regularMatchSetting: {
            __isVsSetting: 'RegularMatchSetting',
            __typename: 'RegularMatchSetting',
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
