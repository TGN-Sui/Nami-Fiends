import { discoverableGuildSpaceMembers } from './guild-space-members.js';
import { SELF_MEMBER_ID } from './member-access.js';
import type { NamiMember } from './uiMockData.js';

export const EMPTY_THREAD_PREVIEW = 'Start a conversation';

export function messageComposeCandidates(): NamiMember[] {
  return discoverableGuildSpaceMembers()
    .filter((member) => member.id !== SELF_MEMBER_ID)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function resolveMessageComposeMember(
  memberId: string,
  candidates: NamiMember[] = messageComposeCandidates()
): NamiMember | null {
  return candidates.find((member) => member.id === memberId) ?? null;
}