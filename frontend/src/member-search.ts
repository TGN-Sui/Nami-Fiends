import type { NamiMember } from './uiMockData.js';

function memberSearchHaystack(member: NamiMember): string {
  return [member.name, member.badge, member.tier].join(' ').toLowerCase();
}

export function searchMemberPredictions(
  query: string,
  candidates: NamiMember[],
  limit = 6
): NamiMember[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return candidates.slice(0, limit);
  }

  const scored = candidates
    .map((member) => {
      const name = member.name.toLowerCase();
      const badge = member.badge.toLowerCase();
      const tier = member.tier.toLowerCase();
      let score = 0;

      if (name.startsWith(normalized)) {
        score += 120;
      } else if (name.includes(normalized)) {
        score += 70;
      }

      if (badge.startsWith(normalized)) {
        score += 60;
      } else if (badge.includes(normalized)) {
        score += 35;
      }

      if (tier.includes(normalized)) {
        score += 20;
      }

      if (memberSearchHaystack(member).includes(normalized)) {
        score += 10;
      }

      return { member, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.member.name.localeCompare(right.member.name);
    });

  return scored.slice(0, limit).map((entry) => entry.member);
}