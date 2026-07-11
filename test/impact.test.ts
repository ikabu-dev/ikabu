import { Client, GatewayIntentBits } from 'discord.js';
import { describe, it, expect } from 'vitest';

describe('Impact Tests', () => {
    it('Should be a valid Node environment', () => {
        expect(process.version).toMatch(/^v24/);
    });

    it('Should be able to import discord.js and create a client', () => {
        const client = new Client({ intents: [GatewayIntentBits.Guilds] });
        expect(client).toBeDefined();
        expect(client).toBeInstanceOf(Client);
    });

    it('Should be able to import canvas', async () => {
        // Dynamic import to handle potential loading issues gracefully in test
        try {
            const canvas = await import('canvas');
            expect(canvas).toBeDefined();
            const c = canvas.createCanvas(200, 200);
            const ctx = c.getContext('2d');
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, 200, 200);
            expect(c.toBuffer()).toBeDefined();
        } catch (e) {
            console.error('Canvas import failed:', e);
            throw e;
        }
    }, 30000);
});
