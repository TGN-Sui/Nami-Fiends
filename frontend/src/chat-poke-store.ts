import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'nami.chat.poke-state';

export type PokeDirection = 'a_to_b' | 'b_to_a';

export type PokePairState = {
  memberAId: string;
  memberBId: string;
  pendingDirection: PokeDirection | null;
  updatedAtMs: number;
};

export type ChatPokeState = {
  /** Lifetime total — never reset on weekly Nami/boost cycles. */
  receivedCounts: Record<string, number>;
  pairs: PokePairState[];
  updatedAtMs: number;
};

let cachedState: ChatPokeState | undefined;

function pairKey(memberAId: string, memberBId: string): string {
  return memberAId < memberBId ? memberAId + '|' + memberBId : memberBId + '|' + memberAId;
}

function canonicalPair(memberAId: string, memberBId: string): { low: string; high: string } {
  return memberAId < memberBId
    ? { low: memberAId, high: memberBId }
    : { low: memberBId, high: memberAId };
}

function defaultState(): ChatPokeState {
  return {
    receivedCounts: {},
    pairs: [],
    updatedAtMs: Date.now(),
  };
}

function normalizeState(parsed: Partial<ChatPokeState> | null): ChatPokeState {
  if (!parsed) {
    return defaultState();
  }

  const receivedCounts: Record<string, number> = {};

  if (parsed.receivedCounts && typeof parsed.receivedCounts === 'object') {
    for (const [memberId, count] of Object.entries(parsed.receivedCounts)) {
      if (typeof count === 'number' && count >= 0) {
        receivedCounts[memberId] = count;
      }
    }
  }

  const pairs: PokePairState[] = [];

  if (Array.isArray(parsed.pairs)) {
    for (const entry of parsed.pairs) {
      if (
        entry &&
        typeof entry === 'object' &&
        typeof entry.memberAId === 'string' &&
        typeof entry.memberBId === 'string' &&
        (entry.pendingDirection === null ||
          entry.pendingDirection === 'a_to_b' ||
          entry.pendingDirection === 'b_to_a')
      ) {
        pairs.push({
          memberAId: entry.memberAId,
          memberBId: entry.memberBId,
          pendingDirection: entry.pendingDirection,
          updatedAtMs: typeof entry.updatedAtMs === 'number' ? entry.updatedAtMs : Date.now(),
        });
      }
    }
  }

  return {
    receivedCounts,
    pairs,
    updatedAtMs: typeof parsed.updatedAtMs === 'number' ? parsed.updatedAtMs : Date.now(),
  };
}

function readState(): ChatPokeState {
  if (cachedState) {
    return cachedState;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      cachedState = defaultState();
      return cachedState;
    }

    cachedState = normalizeState(JSON.parse(stored) as Partial<ChatPokeState>);
    return cachedState;
  } catch {
    cachedState = defaultState();
    return cachedState;
  }
}

function writeState(next: ChatPokeState): void {
  cachedState = { ...next, updatedAtMs: Date.now() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));
  window.dispatchEvent(new CustomEvent('nami-chat-poke-changed'));
}

function findPair(state: ChatPokeState, memberAId: string, memberBId: string): PokePairState | null {
  const key = pairKey(memberAId, memberBId);

  return (
    state.pairs.find((entry) => pairKey(entry.memberAId, entry.memberBId) === key) ?? null
  );
}

function directionForSender(
  senderId: string,
  pair: { low: string; high: string }
): PokeDirection {
  return senderId === pair.low ? 'a_to_b' : 'b_to_a';
}

export function readPokeReceivedCount(memberId: string): number {
  return readState().receivedCounts[memberId] ?? 0;
}

export function canSendPoke(senderId: string, targetId: string): boolean {
  if (!senderId || !targetId || senderId === targetId) {
    return false;
  }

  const state = readState();
  const pair = canonicalPair(senderId, targetId);
  const existing = findPair(state, pair.low, pair.high);

  if (!existing || existing.pendingDirection === null) {
    return true;
  }

  const attemptedDirection = directionForSender(senderId, pair);

  return existing.pendingDirection !== attemptedDirection;
}

export type PokeSendResult =
  | { ok: true; targetReceivedTotal: number; awaitingPokeBack: boolean }
  | { ok: false; reason: string };

export function sendPoke(senderId: string, targetId: string): PokeSendResult {
  if (!canSendPoke(senderId, targetId)) {
    return {
      ok: false,
      reason: 'Wait for them to poke you back before poking again.',
    };
  }

  const state = readState();
  const pair = canonicalPair(senderId, targetId);
  const direction = directionForSender(senderId, pair);
  const existing = findPair(state, pair.low, pair.high);
  const nextCounts = { ...state.receivedCounts };
  nextCounts[targetId] = (nextCounts[targetId] ?? 0) + 1;

  let nextPairs = [...state.pairs];

  if (existing) {
    const clearedPending = existing.pendingDirection !== null && existing.pendingDirection !== direction;

    nextPairs = nextPairs.map((entry) => {
      if (pairKey(entry.memberAId, entry.memberBId) !== pairKey(pair.low, pair.high)) {
        return entry;
      }

      return {
        ...entry,
        pendingDirection: clearedPending ? null : direction,
        updatedAtMs: Date.now(),
      };
    });
  } else {
    nextPairs.push({
      memberAId: pair.low,
      memberBId: pair.high,
      pendingDirection: direction,
      updatedAtMs: Date.now(),
    });
  }

  const updatedPair =
    nextPairs.find((entry) => pairKey(entry.memberAId, entry.memberBId) === pairKey(pair.low, pair.high)) ??
    null;

  writeState({
    receivedCounts: nextCounts,
    pairs: nextPairs,
    updatedAtMs: Date.now(),
  });

  return {
    ok: true,
    targetReceivedTotal: nextCounts[targetId] ?? 0,
    awaitingPokeBack: updatedPair?.pendingDirection === direction,
  };
}

function subscribe(listener: () => void): () => void {
  function handleChange(): void {
    cachedState = undefined;
    listener();
  }

  window.addEventListener('nami-chat-poke-changed', handleChange);

  return () => window.removeEventListener('nami-chat-poke-changed', handleChange);
}

export function usePokeReceivedCount(memberId: string): number {
  return useSyncExternalStore(subscribe, () => readPokeReceivedCount(memberId), () => 0);
}

export function useCanSendPoke(senderId: string, targetId: string): boolean {
  return useSyncExternalStore(subscribe, () => canSendPoke(senderId, targetId), () => false);
}