import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export async function handleHelp(interaction: ChatInputCommandInteraction<CacheType>) {
    if (!interaction.isCommand()) return;
    // 'インタラクションに失敗'が出ないようにするため
    await interaction.deferReply();
    const { options } = interaction;
    const subCommand = options.getSubcommand();
    if (subCommand === 'voice') {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({
                        name: 'ブキチの使い方(読み上げbot)',
                        iconURL:
                            'https://cdn.glitch.com/4ea6ca87-8ea7-482c-ab74-7aee445ea445%2Fthumbnails%2Fbukichi.jpg',
                    })
                    .setColor(0x1bc2a5)
                    .addFields([
                        {
                            name: '/voice join',
                            value: '```ボイスチャンネルにブキチを参加```',
                            inline: true,
                        },
                        {
                            name: '/voice type',
                            value: '```音声タイプを変更します\n選択肢から指定可能```',
                            inline: true,
                        },
                        {
                            name: '/voice kill',
                            value: '```ボイスチャンネルからブキチを切断```',
                            inline: true,
                        },
                    ]),
            ],
        });
    } else if (subCommand === 'other') {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({
                        name: 'ブキチの使い方(2/2)',
                        iconURL:
                            'https://cdn.glitch.com/4ea6ca87-8ea7-482c-ab74-7aee445ea445%2Fthumbnails%2Fbukichi.jpg',
                    })
                    .setColor(0x1bc2a5)
                    .addFields([
                        {
                            name: '/show ○○○',
                            value: '```ステージ情報を表示[now / next / nawabari / run]```',
                            inline: true,
                        },
                        {
                            name: '/buki',
                            value: '```ブキをランダムで選出\nブキの数とブキ種を指定可能```',
                            inline: true,
                        },
                        {
                            name: '/pick 選択肢を半スペ空けで記入',
                            value: '```選択肢の中からランダム選出\n選択する数を指定可能```',
                            inline: true,
                        },
                        {
                            name: '/vpick',
                            value: '```VCに接続している人をランダム抽出\n2人以上を抽出可能```',
                            inline: true,
                        },
                        {
                            name: '/kansen',
                            value: '```プラベの観戦者をランダムな組み合わせで抽出\n5試合分を指定するのがおすすめです。```',
                            inline: true,
                        },
                        {
                            name: '/friend_code show',
                            value: '```フレンドコードを表示\n登録がない場合は「自己紹介」チャンネルから引用します(直近100件のみ)```',
                            inline: true,
                        },
                        {
                            name: '/friend_code add SW-0000-0000-0000',
                            value: '```フレンドコードを登録\nもう一度登録すると上書きされます。他人のは登録できません。```',
                            inline: true,
                        },
                        {
                            name: '/ボイスロック vclock',
                            value: '```今いるVCに人数制限を設定。ゲームに集中したい場合に使ってください。```',
                            inline: true,
                        },
                        {
                            name: '/ボイスメンション vcmention',
                            value: '```VCに居るメンバー全員にメンションを飛ばします。```',
                            inline: true,
                        },
                        {
                            name: '/イカ部歴',
                            value: '```自分のイカ部歴を表示```',
                            inline: true,
                        },
                        {
                            name: '/wiki 〇〇',
                            value: '```wikipediaを検索して表示```',
                            inline: true,
                        },
                        {
                            name: '/timer',
                            value: '```n分後に通知```',
                            inline: true,
                        },
                        {
                            name: '/チーム分け team',
                            value: '```チームごとの勝率が均等になるようにチーム分けします。勝率1位と2位は別チームになります。```',
                            inline: true,
                        },
                    ]),
            ],
        });
    } else if (subCommand === 'recruit') {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({
                        name: 'ブキチの使い方(1/2)',
                        iconURL:
                            'https://cdn.glitch.com/4ea6ca87-8ea7-482c-ab74-7aee445ea445%2Fthumbnails%2Fbukichi.jpg',
                    })
                    .setColor(0x1bc2a5)
                    .addFields([
                        {
                            name: '/プラベ募集 recruit',
                            value: '```開始時刻 所要時間 募集人数 内容または参加条件があれば記載```',
                        },
                        {
                            name: '/プラベ募集 button',
                            value: '```everyone通知と参加ボタンのみ表示。通常のチャットでプラベ概要を書いた後に使ってください。```',
                        },
                        {
                            name: '/バンカラ募集 now',
                            value: '```現在のバンカラ情報を表示して募集```',
                        },
                        {
                            name: '/バンカラ募集 next',
                            value: '```次回のバンカラ情報を表示して募集```',
                        },
                        // {
                        //     name: '/リグマ募集 now',
                        //     value: '```現在のリグマ情報を表示して募集```',
                        // },
                        // {
                        //     name: '/リグマ募集 next',
                        //     value: '```次回のリグマ情報を表示して募集```',
                        // },
                        {
                            name: '/ナワバリ募集 now',
                            value: '```現在のナワバリ情報を表示して募集```',
                        },
                        {
                            name: '/ナワバリ募集 next',
                            value: '```次回のナワバリ情報を表示して募集```',
                        },
                        {
                            name: '/〇〇陣営 now',
                            value: '```現在のフェス情報を表示して募集```',
                        },
                        {
                            name: '/〇〇陣営 next',
                            value: '```次回のフェス情報を表示して募集```',
                        },
                        {
                            name: '/サーモンラン募集 run',
                            value: '```サーモンラン情報を表示して募集```',
                        },
                        {
                            name: '/別ゲー募集 overwatch',
                            value: '```Overwatchの募集```',
                            inline: true,
                        },
                        {
                            name: '/別ゲー募集 valo',
                            value: '```VALORANTの募集```',
                            inline: true,
                        },
                        {
                            name: '/別ゲー募集 mhw',
                            value: '```モンスターハンターワイルズの募集```',
                            inline: true,
                        },
                        {
                            name: '/別ゲー募集 apex',
                            value: '```ApexLegendsの募集```',
                            inline: true,
                        },
                        {
                            name: '/別ゲー募集 other',
                            value: '```その他別ゲーを自由に入力して募集```',
                            inline: true,
                        },
                    ]),
            ],
        });
    }
}
