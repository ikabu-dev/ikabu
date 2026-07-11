import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('other game recruit asset paths', () => {
    it('uses local asset paths instead of stg branch URLs', () => {
        const source = fs.readFileSync(
            './src/features/recruit/create/other_game_recruit.ts',
            'utf-8',
        );

        expect(source).not.toContain('raw.githubusercontent.com/shngmsw/ikabu/stg');
        expect(source).not.toContain('github.com/shngmsw/ikabu/blob/stg');
        expect(source).toContain('./images/games/MonsterHunterWilds.png');
        expect(source).toContain('./images/games/ApexLegends.jpg');
        expect(source).toContain('./images/games/Overwatch.jpg');
        expect(source).toContain('./images/games/valorant.jpg');
        expect(source).toContain('./images/games/others.jpg');
    });
});
