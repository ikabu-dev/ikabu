import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

describe('other game recruit asset paths', () => {
    it('uses local asset paths instead of stg branch URLs', () => {
        const sourcePath = path.resolve(
            process.cwd(),
            'src/features/recruit/create/other_game_recruit.ts',
        );
        const source = fs.readFileSync(sourcePath, 'utf-8');

        for (const stgUrl of [
            'raw.githubusercontent.com/shngmsw/ikabu/stg',
            'github.com/shngmsw/ikabu/blob/stg',
        ]) {
            expect(source).not.toContain(stgUrl);
        }

        for (const localPath of [
            './images/games/MonsterHunterWilds.png',
            './images/games/ApexLegends.jpg',
            './images/games/Overwatch.jpg',
            './images/games/valorant.jpg',
            './images/games/others.jpg',
        ]) {
            expect(source).toContain(localPath);
        }
    });
});
