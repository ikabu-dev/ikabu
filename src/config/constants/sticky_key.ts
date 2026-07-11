import { ObjectValueList } from './constant_common';

export const StickyKey = {
    AvailableRecruit: 'available_recruit',
    VCToolsOnboardingEmbed: 'vctools_onboarding_embed',
    VCToolsButton: 'vctools_buttons',
} as const;
export type StickyKey = ObjectValueList<typeof StickyKey>;
export function isStickyKey(value: string): value is StickyKey {
    return Object.values(StickyKey).some((v) => v === value);
}
