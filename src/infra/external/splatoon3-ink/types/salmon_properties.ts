import { placeHold } from '@/config/constants/images';

export type SalmonRegularProperties = {
    startTime: string;
    endTime: string;
    setting: {
        __typename: string;
        coopStage: {
            name: string;
            thumbnailImage: {
                url: string;
            };
            image: {
                url: string;
            };
            id: string;
        };
        __isCoopSetting: string;
        weapons: [
            {
                __splatoon3ink_id: string;
                name: string;
                image: {
                    url: string;
                };
            },
            {
                __splatoon3ink_id: string;
                name: string;
                image: {
                    url: string;
                };
            },
            {
                __splatoon3ink_id: string;
                name: string;
                image: {
                    url: string;
                };
            },
            {
                __splatoon3ink_id: string;
                name: string;
                image: {
                    url: string;
                };
            },
        ];
    };
    __splatoon3ink_king_salmonid_guess: string;
};

export type BigRunProperties = {
    startTime: string;
    endTime: string;
    setting: {
        __typename: string;
        rule: string;
        coopStage: {
            name: string;
            thumbnailImage: {
                url: string;
            };
            image: {
                url: string;
            };
            id: string;
        };
        __isCoopSetting: string;
        weapons: [
            {
                __splatoon3ink_id: string;
                name: string;
                image: {
                    url: string;
                };
            },
            {
                __splatoon3ink_id: string;
                name: string;
                image: {
                    url: string;
                };
            },
            {
                __splatoon3ink_id: string;
                name: string;
                image: {
                    url: string;
                };
            },
            {
                __splatoon3ink_id: string;
                name: string;
                image: {
                    url: string;
                };
            },
        ];
    };
    __splatoon3ink_king_salmonid_guess: string;
};

export type TeamContestProperties = {
    startTime: string;
    endTime: string;
    setting: {
        __typename: string;
        rule: string;
        coopStage: {
            name: string;
            thumbnailImage: {
                url: string;
            };
            image: {
                url: string;
            };
            id: string;
        };
        __isCoopSetting: string;
        weapons: [
            {
                __splatoon3ink_id: string;
                name: string;
                image: {
                    url: string;
                };
            },
            {
                __splatoon3ink_id: string;
                name: string;
                image: {
                    url: string;
                };
            },
            {
                __splatoon3ink_id: string;
                name: string;
                image: {
                    url: string;
                };
            },
            {
                __splatoon3ink_id: string;
                name: string;
                image: {
                    url: string;
                };
            },
        ];
    };
};

export function getSalmonRegularDummyProperties(
    startTime: Date,
    endTime: Date,
): SalmonRegularProperties {
    return {
        startTime: startTime.toString(),
        endTime: endTime.toString(),
        setting: {
            __typename: 'SalmonRegularSetting',
            coopStage: {
                id: 'dummy_stage_id',
                name: 'dummy_stage',
                thumbnailImage: { url: placeHold.error100x100 },
                image: { url: placeHold.error100x100 },
            },
            __isCoopSetting: 'SalmonRegularSetting',
            weapons: [
                {
                    __splatoon3ink_id: 'dummy_weapon_id',
                    name: 'dummy_weapon',
                    image: { url: placeHold.error100x100 },
                },
                {
                    __splatoon3ink_id: 'dummy_weapon_id',
                    name: 'dummy_weapon',
                    image: { url: placeHold.error100x100 },
                },
                {
                    __splatoon3ink_id: 'dummy_weapon_id',
                    name: 'dummy_weapon',
                    image: { url: placeHold.error100x100 },
                },
                {
                    __splatoon3ink_id: 'dummy_weapon_id',
                    name: 'dummy_weapon',
                    image: { url: placeHold.error100x100 },
                },
            ],
        },
        __splatoon3ink_king_salmonid_guess: 'dummy_salmon_id',
    };
}
