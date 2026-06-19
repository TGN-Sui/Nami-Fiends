import type { NamiThemeMode, NamiUiShell } from './theme.js';
import type { NamiMember } from './uiMockData.js';

export type AppearanceTier = NamiMember['tier'];

export function appearanceTierForMember(member: NamiMember): AppearanceTier {
  return member.tier;
}

export function allowedUiShells(tier: AppearanceTier): NamiUiShell[] {
  switch (tier) {
    case 'NPC':
      return ['classic'];
    case 'Adventurer':
      return ['classic', 'glass'];
    case 'Pro':
      return ['classic', 'glass'];
    case 'Elite':
      return ['classic', 'glass', 'pixel'];
    default:
      return ['classic'];
  }
}

export function allowedThemeModes(tier: AppearanceTier): NamiThemeMode[] {
  switch (tier) {
    case 'NPC':
      return ['default'];
    case 'Adventurer':
      return ['default', 'dark', 'light'];
    case 'Pro':
    case 'Elite':
      return ['default', 'dark', 'light', 'custom'];
    default:
      return ['default'];
  }
}

export function isUiShellAllowed(tier: AppearanceTier, shell: NamiUiShell): boolean {
  return allowedUiShells(tier).includes(shell);
}

export function isThemeModeAllowed(tier: AppearanceTier, mode: NamiThemeMode): boolean {
  return allowedThemeModes(tier).includes(mode);
}

export function clampAppearanceForTier(
  tier: AppearanceTier,
  uiShell: NamiUiShell,
  mode: NamiThemeMode,
): { uiShell: NamiUiShell; mode: NamiThemeMode } {
  const shells = allowedUiShells(tier);
  const modes = allowedThemeModes(tier);

  return {
    uiShell: shells.includes(uiShell) ? uiShell : shells[0]!,
    mode: modes.includes(mode) ? mode : modes[0]!,
  };
}

export function appearanceTierLabel(tier: AppearanceTier): string {
  return tier;
}

export function requiredTierForUiShell(shell: NamiUiShell): AppearanceTier {
  if (shell === 'pixel') {
    return 'Elite';
  }

  if (shell === 'glass') {
    return 'Adventurer';
  }

  return 'NPC';
}

export function requiredTierForThemeMode(mode: NamiThemeMode): AppearanceTier {
  if (mode === 'custom') {
    return 'Pro';
  }

  if (mode === 'dark' || mode === 'light') {
    return 'Adventurer';
  }

  return 'NPC';
}