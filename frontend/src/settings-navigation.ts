export type SettingsSection =
  | 'overview'
  | 'account'
  | 'membership'
  | 'feeds'
  | 'safety'
  | 'appearance'
  | 'advanced';

const SETTINGS_SECTION_FOCUS_KEY = 'nami.settings.section-focus';

const SECTION_IDS: ReadonlySet<string> = new Set([
  'overview',
  'account',
  'membership',
  'feeds',
  'safety',
  'appearance',
  'advanced',
]);

export function requestSettingsSection(section: SettingsSection): void {
  try {
    window.sessionStorage.setItem(SETTINGS_SECTION_FOCUS_KEY, section);
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

export function consumeSettingsSectionFocus(): SettingsSection | null {
  try {
    const stored = window.sessionStorage.getItem(SETTINGS_SECTION_FOCUS_KEY);

    if (!stored) {
      return null;
    }

    window.sessionStorage.removeItem(SETTINGS_SECTION_FOCUS_KEY);

    if (SECTION_IDS.has(stored)) {
      return stored as SettingsSection;
    }

    return null;
  } catch {
    return null;
  }
}