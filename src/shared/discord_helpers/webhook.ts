import axios from 'axios';
import { EmbedBuilder } from 'discord.js';

// export async function sendContentWebhook(url, content) {
//     await axios.post(
//         url,
//         { content: content }, // このオブジェクトがJSONとして送信される
//     );
// }

export async function sendEmbedsWebhook(url: string, embeds: EmbedBuilder[]) {
    void axios.post(
        url,
        { embeds: embeds }, // このオブジェクトがJSONとして送信される
    );
}
