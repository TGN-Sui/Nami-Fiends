export type OnboardingMethod = 'wallet' | 'zklogin' | 'demo';

export type OnboardingAct = 'create' | 'social' | 'preview';

export interface OnboardingActStep {
  act: OnboardingAct;
  label: string;
  description: string;
}

export const ONBOARDING_ACTS: OnboardingActStep[] = [
  {
    act: 'create',
    label: 'Create',
    description: 'Display name, email, and gamer quiz — no wallet yet.',
  },
  {
    act: 'social',
    label: 'Social',
    description: 'Optional social verification to boost your Player Score.',
  },
  {
    act: 'preview',
    label: 'Preview',
    description: 'See your passport card and enter Nami.',
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