export type OnboardingMethod = 'wallet' | 'zklogin' | 'demo';

export type OnboardingAct = 'create' | 'preview' | 'claim' | 'verify';

export interface OnboardingActStep {
  act: OnboardingAct;
  label: string;
  description: string;
}

export const ONBOARDING_ACTS: OnboardingActStep[] = [
  {
    act: 'create',
    label: 'Create',
    description: 'Display name and gamer quiz — no wallet yet.',
  },
  {
    act: 'preview',
    label: 'Preview',
    description: 'See your passport card. Created, not owned.',
  },
  {
    act: 'claim',
    label: 'Claim',
    description: 'Connect wallet, choose nodename, one transaction.',
  },
  {
    act: 'verify',
    label: 'Verify',
    description: 'Link platforms for achievement badges.',
  },
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

export function getOnboardingActIndex(act: OnboardingAct): number {
  return ONBOARDING_ACTS.findIndex((step) => step.act === act);
}