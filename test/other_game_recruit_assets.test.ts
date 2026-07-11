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

        const localPaths = [
            './images/games/MonsterHunterWilds.png',
            './images/games/ApexLegends.jpg',
            './images/games/Overwatch.jpg',
            './images/games/valorant.jpg',
            './images/games/others.jpg',
        ];

        for (const localPath of localPaths) {
            expect(source).toContain(localPath);
        }

        for (const localPath of localPaths) {
            const absolutePath = path.resolve(process.cwd(), localPath);
            expect(fs.existsSync(absolutePath)).toBe(true);
        }
    });
});
