import { ObjectValueList } from './constant_common';

// 固有の機能ロールを増やすときはここに追加するだけでOK
export const RoleKeySet = {
    Developer: { name: 'DEVELOPER', key: 'ROLE_ID_DEVELOPER' },
    Rookie: { name: '新入部員', key: 'ROLE_ID_ROOKIE' },
    PrivateRecruit: { name: 'プラベ募集', key: 'ROLE_ID_RECRUIT_PRIVATE' },
    RegularRecruit: { name: 'ナワバリ募集', key: 'ROLE_ID_RECRUIT_REGULAR' },
    AnarchyRecruit: { name: 'バンカラ募集', key: 'ROLE_ID_RECRUIT_ANARCHY' },
    EventRecruit: { name: 'イベマ募集', key: 'ROLE_ID_RECRUIT_EVENT' },
    SalmonRecruit: { name: 'サーモン募集', key: 'ROLE_ID_RECRUIT_SALMON' },
    RaidersRecruit: { name: 'レイダース募集', key: 'ROLE_ID_RECRUIT_RAIDERS' },
    FryeRecruit: { name: 'ウツホ募集', key: 'ROLE_ID_RECRUIT_FRYE' },
    ShiverRecruit: { name: 'フウカ募集', key: 'ROLE_ID_RECRUIT_SHIVER' },
    BigmanRecruit: { name: 'マンタロー募集', key: 'ROLE_ID_RECRUIT_BIGMAN' },
    OtherGamesRecruit: { name: '別ゲー募集', key: 'ROLE_ID_RECRUIT_OTHER_GAMES' },
    RankSP: { name: 'S+', key: 'ROLE_ID_RANK_S_PLUS' },
    RankS: { name: 'S', key: 'ROLE_ID_RANK_S' },
    RankA: { name: 'A', key: 'ROLE_ID_RANK_A' },
    RankB: { name: 'B', key: 'ROLE_ID_RANK_B' },
    RankC: { name: 'C', key: 'ROLE_ID_RANK_C' },
} as const;
export type RoleKeySet = ObjectValueList<typeof RoleKeySet>;
// RoleKeyタイプを派生させる
export type RoleKey = (typeof RoleKeySet)[keyof typeof RoleKeySet]['key'];

// 指定した文字列がRoleKeyに存在するかチェックする関数
export function isRoleKey(value: string): value is RoleKey {
    return Object.values(RoleKeySet).some((v) => v.key === value);
}

// RoleKeyを指定すると名前を返す関数
export function getUniqueRoleNameByKey(roleKey: RoleKey): string {
    let roleName = 'empty';
    for (const role of Object.values(RoleKeySet)) {
        if (role.key === roleKey) {
            roleName = role.name;
        }
    }
    return roleName;
}
