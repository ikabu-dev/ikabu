import { describe, expect, it } from 'vitest';

import { commandDefinitions } from '@/registry/register';

describe('コマンド定義', () => {
    it('登録するSlash CommandのJSON表現を維持する', () => {
        expect(commandDefinitions.map((command) => command.toJSON())).toMatchSnapshot();
    });
});
