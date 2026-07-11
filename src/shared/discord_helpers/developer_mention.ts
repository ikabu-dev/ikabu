import { RoleKeySet } from '@/config/constants/role_key';
import { UniqueRoleService } from '@/db/unique_role_service';
import { exists } from '@/shared/assert';

export async function getDeveloperMention(guildId: string) {
    const developerRoleId = await UniqueRoleService.getRoleIdByKey(
        guildId,
        RoleKeySet.Developer.key,
    );
    if (exists(developerRoleId)) {
        return `<@&${developerRoleId}>`;
    } else {
        return '開発者ロールが設定されていないでし！\nサポートセンターまでお問い合わせくださいでし！\n';
    }
}
