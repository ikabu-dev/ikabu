export type Sp3Locale = {
    stages: {
        [id: string]: {
            name: string;
        };
    };
    rules: {
        [id: string]: {
            name: string;
        };
    };
    weapons: {
        [id: string]: {
            name: string;
        };
    };
    brands: {
        [id: string]: {
            name: string;
        };
    };
    gear: {
        [id: string]: {
            name: string;
        };
    };
    powers: {
        [id: string]: {
            name: string;
        };
    };
    festivals: {
        [id: string]: {
            title: string;
            teams: { teamName: string }[];
        };
    };
    events: {
        [id: string]: {
            name: string;
            desc: string;
            regulation: string;
        };
    };
};
