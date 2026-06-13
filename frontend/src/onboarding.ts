export type OnboardingMethod = 'wallet' | 'zklogin' | 'demo';

export interface OnboardingStep {
  label: string;
  description: string;
  status: 'ready' | 'next' | 'future';
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    label: 'Connect',
    description: 'Connect wallet, zkLogin, or demo address.',
    status: 'ready'
  },
  {
    label: 'Create Identity',
    description: 'Mint the root Nami Identity object.',
    status: 'next'
  },
  {
    label: 'Create Passport',
    description: 'Create the player journey object linked to Identity.',
    status: 'next'
  },
  {
    label: 'Create Profile',
    description: 'Create public profile metadata and avatar references.',
    status: 'next'
  },
  {
    label: 'Verify',
    description: 'Move from NPC to Adventurer through supported verification.',
    status: 'future'
  }
];

export function getOnboardingMethodLabel(method: OnboardingMethod): string {
  if (method === 'wallet') {
    return 'Wallet Connect';
  }

  if (method === 'zklogin') {
    return 'zkLogin';
  }

  return 'Demo Mode';
}