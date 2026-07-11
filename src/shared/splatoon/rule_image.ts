import { placeHold } from '@/config/constants/images';
import { notExists } from '@/shared/assert';

export function rule2image(rule: string | undefined | null) {
    if (notExists(rule)) {
        return placeHold.error100x100;
    }

    switch (rule) {
        case 'ガチエリア':
            return 'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/splat_zones_icon.png';
        case 'ガチヤグラ':
            return 'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/tower_control_icon.png';
        case 'ガチホコバトル':
            return 'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/rainmaker_icon.png';
        case 'ガチアサリ':
            return 'https://raw.githubusercontent.com/shngmsw/ikabu/main/images/recruit/clam_blitz_icon.png';
        default:
            return placeHold.error100x100;
    }
}
