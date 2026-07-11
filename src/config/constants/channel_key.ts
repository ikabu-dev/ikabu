import { ObjectValueList } from './constant_common';

// 固有の機能チャンネルを増やすときはここに追加するだけでOK
export const ChannelKeySet = {
    Lobby: { name: 'イカ部ロビー', key: 'CHANNEL_ID_LOBBY' },
    Description: { name: 'チャンネル説明', key: 'CHANNEL_ID_DESCRIPTION' },
    Introduction: { name: '自己紹介', key: 'CHANNEL_ID_INTRODUCTION' },
    Rule: { name: 'イカ部心得', key: 'CHANNEL_ID_RULE' },
    BotCommand: { name: 'botコマンド', key: 'CHANNEL_ID_BOT_COMMAND' },
    StageInfo: { name: 'ステージ情報', key: 'CHANNEL_ID_STAGE_INFO' },
    RecruitHelp: { name: '募集のやり方', key: 'CHANNEL_ID_RECRUIT_HELP' },
    SupportCenter: { name: 'サポートセンター', key: 'CHANNEL_ID_SUPPORT_CENTER' },
    ErrorLog: { name: 'エラーログ', key: 'CHANNEL_ID_ERROR_LOG' },
    MessageLog: { name: 'メッセージログ', key: 'CHANNEL_ID_MESSAGE_LOG' },
    RetireLog: { name: '退部ログ', key: 'CHANNEL_ID_RETIRE_LOG' },
    ButtonLog: { name: 'ボタンログ', key: 'CHANNEL_ID_BUTTON_LOG' },
    CommandLog: { name: 'コマンドログ', key: 'CHANNEL_ID_COMMAND_LOG' },
    PrivateRecruit: { name: 'プラベ募集', key: 'CHANNEL_ID_RECRUIT_PRIVATE' },
    RegularRecruit: { name: 'ナワバリ募集', key: 'CHANNEL_ID_RECRUIT_REGULAR' },
    AnarchyRecruit: { name: 'バンカラ募集', key: 'CHANNEL_ID_RECRUIT_ANARCHY' },
    EventRecruit: { name: 'イベマ募集', key: 'CHANNEL_ID_RECRUIT_EVENT' },
    SalmonRecruit: { name: 'サーモン募集', key: 'CHANNEL_ID_RECRUIT_SALMON' },
    RaidersRecruit: { name: 'レイダース募集', key: 'CHANNEL_ID_RECRUIT_RAIDERS' },
    FestivalCategory: { name: 'フェスカテゴリ', key: 'CATEGORY_ID_FESTIVAL' },
    FryeRecruit: { name: 'ウツホ募集', key: 'CHANNEL_ID_RECRUIT_FRYE' },
    ShiverRecruit: { name: 'フウカ募集', key: 'CHANNEL_ID_RECRUIT_SHIVER' },
    BigmanRecruit: { name: 'マンタロー募集', key: 'CHANNEL_ID_RECRUIT_BIGMAN' },
    OtherGamesRecruit: { name: '別ゲー募集', key: 'CHANNEL_ID_RECRUIT_OTHER_GAMES' },
} as const;
export type ChannelKeySet = ObjectValueList<typeof ChannelKeySet>;
// ChannelKey タイプを派生させる
export type ChannelKey = (typeof ChannelKeySet)[keyof typeof ChannelKeySet]['key'];

// 指定した文字列がChannelKeyに存在するかチェックする関数
export function isChannelKey(value: string): value is ChannelKey {
    return Object.values(ChannelKeySet).some((v) => v.key === value);
}

// ChannelKeyを指定すると名前を返す関数
export function getUniqueChannelNameByKey(channelKey: ChannelKey): string {
    let channelName = 'empty';
    for (const channel of Object.values(ChannelKeySet)) {
        if (channel.key === channelKey) {
            channelName = channel.name;
        }
    }
    return channelName;
}
