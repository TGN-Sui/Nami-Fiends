/** Built-in sidebar + logo artwork shown until the official owner syncs custom uploads. */
const BUNDLED_OWNER_ASSET_URLS: Readonly<Record<string, string>> = {
  'sidebar-official-logo': '/owner-assets/nami-official-logo.svg',
  'hub-sidebar-logo': '/owner-assets/hub-logo.svg',
  'sidebar-nav-gamehub': '/owner-assets/nav-gamehub.svg',
  'sidebar-nav-arcade': '/owner-assets/nav-arcade.svg',
  'sidebar-nav-userProfile': '/owner-assets/nav-profile.svg',
  'sidebar-nav-guilds': '/owner-assets/nav-guilds.svg',
  'sidebar-nav-messages': '/owner-assets/nav-messages.svg',
  'sidebar-nav-events': '/owner-assets/nav-events.svg',
  'sidebar-nav-settings': '/owner-assets/nav-settings.svg',
  'sidebar-nav-radio': '/owner-assets/nav-radio.svg',
};

export const TESTER_VISIBLE_OWNER_ASSET_SLOT_IDS: readonly string[] = Object.keys(
  BUNDLED_OWNER_ASSET_URLS
);

export function readBundledOwnerAssetUrl(slotId: string): string | null {
  return BUNDLED_OWNER_ASSET_URLS[slotId] ?? null;
}

export function isTesterVisibleOwnerAssetSlot(slotId: string): boolean {
  return slotId in BUNDLED_OWNER_ASSET_URLS;
}