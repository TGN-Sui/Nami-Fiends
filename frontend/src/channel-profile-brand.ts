export type ChannelBrandTheme = {
  key: string;
  label: string;
  primary: string;
  secondary: string;
  glow: string;
};

export const channelBrandThemes: ChannelBrandTheme[] = [
  {
    key: 'nami',
    label: 'Nami Blue',
    primary: '#75d7ff',
    secondary: '#1f65ff',
    glow: 'rgba(117, 215, 255, 0.2)',
  },
  {
    key: 'fiends',
    label: 'Fiends Red',
    primary: '#ff3152',
    secondary: '#a01c30',
    glow: 'rgba(255, 49, 82, 0.2)',
  },
  {
    key: 'ocean',
    label: 'Ocean Mint',
    primary: '#43f5a7',
    secondary: '#0c7f65',
    glow: 'rgba(67, 245, 167, 0.2)',
  },
  {
    key: 'ember',
    label: 'Ember Gold',
    primary: '#ffb84d',
    secondary: '#ff3152',
    glow: 'rgba(255, 184, 77, 0.2)',
  },
];

export function getDefaultChannelBrandTheme(): ChannelBrandTheme {
  return channelBrandThemes[0]!;
}

export function getChannelBrandThemeByKey(key: string | null): ChannelBrandTheme {
  return channelBrandThemes.find((theme) => theme.key === key) ?? getDefaultChannelBrandTheme();
}

export function getStoredChannelBrandTheme(channelId: string): ChannelBrandTheme {
  try {
    return getChannelBrandThemeByKey(window.localStorage.getItem('nami-profile-brand-theme-' + channelId));
  } catch {
    return getDefaultChannelBrandTheme();
  }
}

export function applyChannelBrandToDocument(theme: ChannelBrandTheme): void {
  document.documentElement.style.setProperty('--active-channel-brand-primary', theme.primary);
  document.documentElement.style.setProperty('--active-channel-brand-secondary', theme.secondary);
  document.documentElement.style.setProperty('--active-channel-brand-glow', theme.glow);
}

export function getChannelBrandThemeForTile(channelId: string): { primary: string; secondary: string } {
  try {
    const savedKey = window.localStorage.getItem('nami-profile-brand-theme-' + channelId);
    const theme = channelBrandThemes.find((entry) => entry.key === savedKey) ?? channelBrandThemes[0]!;

    return { primary: theme.primary, secondary: theme.secondary };
  } catch {
    const fallback = channelBrandThemes[0]!;

    return { primary: fallback.primary, secondary: fallback.secondary };
  }
}