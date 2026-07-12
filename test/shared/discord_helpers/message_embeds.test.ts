import { describe, expect, it } from 'vitest';

import { getMentionsFromMessage } from '@/shared/discord_helpers/message_embeds';

describe('message_embeds', () => {
    it('メッセージ内のメンションを文字列またはIDで取得する', () => {
        const message = { content: '<@123456789012345678> text <@987654321098765432>' };
        expect(getMentionsFromMessage(message as never)).toEqual([
            '123456789012345678',
            '987654321098765432',
        ]);
        expect(getMentionsFromMessage(message as never, true)).toEqual([
            '123456789012345678',
            '987654321098765432',
        ]);
        expect(getMentionsFromMessage({ content: 'none' } as never)).toBeNull();
    });
});
