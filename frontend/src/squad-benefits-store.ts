const BENEFITS_KEY = 'nami.squad.adventurer-benefits';

export function readAdventurerBenefitMemberIds(): string[] {
  try {
    const stored = window.localStorage.getItem(BENEFITS_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

export function hasAdventurerBenefitsUnlocked(memberId: string): boolean {
  return readAdventurerBenefitMemberIds().includes(memberId);
}

export function unlockAdventurerBenefitsForMember(memberId: string): void {
  const current = readAdventurerBenefitMemberIds();

  if (current.includes(memberId)) {
    return;
  }

  window.localStorage.setItem(BENEFITS_KEY, JSON.stringify([memberId, ...current]));
  window.dispatchEvent(new CustomEvent('nami-squad-benefits-changed'));
}