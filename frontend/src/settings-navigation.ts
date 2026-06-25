/** Flat settings navigation — one sidebar item shows one focused workspace. */
export type SettingsNavId =
  | 'home'
  | 'account'
  | 'membership'
  | 'safety'
  | 'appearance'
  | 'feeds'
  | 'feedback'
  | 'owner-platform'
  | 'owner-border-art'
  | 'owner-visual-assets'
  | 'owner-emojis'
  | 'owner-submissions'
  | 'owner-security'
  | 'owner-data'
  | 'owner-launch';

/** @deprecated Use SettingsNavId */
export type SettingsSection =
  | 'overview'
  | 'account'
  | 'membership'
  | 'feeds'
  | 'feedback'
  | 'safety'
  | 'appearance'
  | 'advanced';

export type OwnerAdvancedTabId =
  | 'assets'
  | 'emojis'
  | 'borders'
  | 'submissions'
  | 'security'
  | 'data'
  | 'launch';

const SETTINGS_NAV_FOCUS_KEY = 'nami.settings.nav-focus';
const LEGACY_SECTION_FOCUS_KEY = 'nami.settings.section-focus';
const LEGACY_ADVANCED_TAB_FOCUS_KEY = 'nami.settings.advanced-tab-focus';

const NAV_IDS: ReadonlySet<string> = new Set([
  'home',
  'account',
  'membership',
  'safety',
  'appearance',
  'feeds',
  'feedback',
  'owner-platform',
  'owner-border-art',
  'owner-visual-assets',
  'owner-emojis',
  'owner-submissions',
  'owner-security',
  'owner-data',
  'owner-launch',
]);

const LEGACY_SECTION_TO_NAV: Record<string, SettingsNavId> = {
  overview: 'home',
  account: 'account',
  membership: 'membership',
  feeds: 'feeds',
  feedback: 'feedback',
  safety: 'safety',
  appearance: 'appearance',
  advanced: 'owner-platform',
};

const LEGACY_TAB_TO_NAV: Record<OwnerAdvancedTabId, SettingsNavId> = {
  assets: 'owner-visual-assets',
  emojis: 'owner-emojis',
  borders: 'owner-border-art',
  submissions: 'owner-submissions',
  security: 'owner-security',
  data: 'owner-data',
  launch: 'owner-launch',
};

export function requestSettingsNav(navId: SettingsNavId): void {
  try {
    window.sessionStorage.setItem(SETTINGS_NAV_FOCUS_KEY, navId);
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

export function requestSettingsSection(section: SettingsSection): void {
  const mapped = LEGACY_SECTION_TO_NAV[section];

  if (mapped) {
    requestSettingsNav(mapped);
  }
}

export function requestOwnerAdvancedTab(tab: OwnerAdvancedTabId): void {
  requestSettingsNav(LEGACY_TAB_TO_NAV[tab]);
}

export function consumeSettingsNavFocus(): SettingsNavId | null {
  try {
    const storedNav = window.sessionStorage.getItem(SETTINGS_NAV_FOCUS_KEY);

    if (storedNav && NAV_IDS.has(storedNav)) {
      window.sessionStorage.removeItem(SETTINGS_NAV_FOCUS_KEY);
      return storedNav as SettingsNavId;
    }

    const legacyTab = window.sessionStorage.getItem(LEGACY_ADVANCED_TAB_FOCUS_KEY);

    if (legacyTab && legacyTab in LEGACY_TAB_TO_NAV) {
      window.sessionStorage.removeItem(LEGACY_ADVANCED_TAB_FOCUS_KEY);
      return LEGACY_TAB_TO_NAV[legacyTab as OwnerAdvancedTabId];
    }

    const legacySection = window.sessionStorage.getItem(LEGACY_SECTION_FOCUS_KEY);

    if (legacySection) {
      window.sessionStorage.removeItem(LEGACY_SECTION_FOCUS_KEY);

      if (legacySection in LEGACY_SECTION_TO_NAV) {
        return LEGACY_SECTION_TO_NAV[legacySection]!;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/** @deprecated Use consumeSettingsNavFocus */
export function consumeSettingsSectionFocus(): SettingsSection | null {
  const nav = consumeSettingsNavFocus();

  if (!nav) {
    return null;
  }

  if (nav === 'home') {
    return 'overview';
  }

  if (nav.startsWith('owner-')) {
    return 'advanced';
  }

  return nav as SettingsSection;
}

/** @deprecated Use consumeSettingsNavFocus */
export function consumeOwnerAdvancedTabFocus(): OwnerAdvancedTabId | null {
  const nav = consumeSettingsNavFocus();

  if (!nav) {
    return null;
  }

  const entry = Object.entries(LEGACY_TAB_TO_NAV).find(([, value]) => value === nav);

  return entry ? (entry[0] as OwnerAdvancedTabId) : null;
}

export type SettingsNavGroup = {
  id: string;
  label: string;
  items: Array<{
    id: SettingsNavId;
    label: string;
    hint: string;
    ownerOnly?: boolean;
  }>;
};

export const MEMBER_SETTINGS_GROUPS: SettingsNavGroup[] = [
  {
    id: 'general',
    label: 'Your settings',
    items: [
      { id: 'home', label: 'Home', hint: 'Quick status and shortcuts' },
      { id: 'account', label: 'Account', hint: 'Sign-in, passport, profile, platforms' },
      { id: 'membership', label: 'Membership', hint: 'Plans, boosts, demo perspectives' },
      { id: 'safety', label: 'Safety', hint: 'Mutes, blocks, tag notifications' },
      { id: 'appearance', label: 'Look & feel', hint: 'Theme and channel brand palette' },
      { id: 'feeds', label: 'Feeds', hint: 'Embedded member and surface feeds' },
      { id: 'feedback', label: 'Feedback', hint: 'Suggestions to Nami Officials' },
    ],
  },
];

export const OWNER_CONSOLE_GROUP: SettingsNavGroup = {
  id: 'owner-console',
  label: 'Owner console',
  items: [
    {
      id: 'owner-border-art',
      label: 'Border Art',
      hint: 'Upload chat borders and set unlock conditions',
      ownerOnly: true,
    },
    {
      id: 'owner-platform',
      label: 'Platform ops',
      hint: 'Hub curation, tickets, provisioned channels',
      ownerOnly: true,
    },
    {
      id: 'owner-visual-assets',
      label: 'Visual assets',
      hint: 'Badges, logos, portraits, button accents',
      ownerOnly: true,
    },
    {
      id: 'owner-emojis',
      label: 'Chat emojis',
      hint: 'Shared emoji library for all chat pickers',
      ownerOnly: true,
    },
    {
      id: 'owner-submissions',
      label: 'Submissions',
      hint: 'Game tickets, partner banners, suggestions queue',
      ownerOnly: true,
    },
    {
      id: 'owner-security',
      label: 'Security',
      hint: 'Moderators, bans, nodename claims, jury',
      ownerOnly: true,
    },
    {
      id: 'owner-data',
      label: 'Indexed data',
      hint: 'Protocol reads and discovery rankings',
      ownerOnly: true,
    },
    {
      id: 'owner-launch',
      label: 'Launch ops',
      hint: 'Testnet policy and launch health',
      ownerOnly: true,
    },
  ],
};

export function settingsNavLabel(navId: SettingsNavId): string {
  for (const group of MEMBER_SETTINGS_GROUPS) {
    const match = group.items.find((item) => item.id === navId);

    if (match) {
      return match.label;
    }
  }

  const ownerMatch = OWNER_CONSOLE_GROUP.items.find((item) => item.id === navId);

  return ownerMatch?.label ?? 'Settings';
}

export function settingsNavHint(navId: SettingsNavId): string {
  for (const group of MEMBER_SETTINGS_GROUPS) {
    const match = group.items.find((item) => item.id === navId);

    if (match) {
      return match.hint;
    }
  }

  const ownerMatch = OWNER_CONSOLE_GROUP.items.find((item) => item.id === navId);

  return ownerMatch?.hint ?? '';
}