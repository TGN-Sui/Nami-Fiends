import { useSyncExternalStore } from 'react';

import { getSelfMember } from './member-access.js';
import { readConfiguredGoonCoinType } from './goon-token.js';
import { members, type NamiMember } from './uiMockData.js';

const GOON_ACTIVITY_KEY = 'nami.user.goon-activity';

export type GoonActivityKind = 'buy' | 'tip';

export type GoonActivityRecord = {
  id: string;
  kind: GoonActivityKind;
  amountGoon: number;
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string | null;
  toMemberName: string | null;
  createdAt: string;
  note: string;
};

export type GoonTransferResult =
  | { ok: true; record: GoonActivityRecord }
  | { ok: false; reason: string };

const listeners = new Set<() => void>();
let cachedSnapshot: GoonActivityRecord[] | null = null;

function emit(): void {
  cachedSnapshot = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readActivity(): GoonActivityRecord[] {
  try {
    const stored = window.localStorage.getItem(GOON_ACTIVITY_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as GoonActivityRecord[]) : [];
  } catch {
    return [];
  }
}

function writeActivity(records: GoonActivityRecord[]): void {
  window.localStorage.setItem(GOON_ACTIVITY_KEY, JSON.stringify(records.slice(0, 80)));
  emit();
}

function getSnapshot(): GoonActivityRecord[] {
  if (!cachedSnapshot) {
    cachedSnapshot = readActivity();
  }

  return cachedSnapshot;
}

export function useGoonActivity(): GoonActivityRecord[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function recordGoonPurchase(amountGoon: number): GoonTransferResult {
  const selfMember = getSelfMember();

  if (amountGoon <= 0) {
    return { ok: false, reason: 'Enter a positive $GOON amount.' };
  }

  const record: GoonActivityRecord = {
    id: 'goon-buy-' + Date.now(),
    kind: 'buy',
    amountGoon,
    fromMemberId: selfMember.id,
    fromMemberName: selfMember.name,
    toMemberId: null,
    toMemberName: null,
    createdAt: new Date().toISOString(),
    note: 'GOON token: ' + readConfiguredGoonCoinType(),
  };

  writeActivity([record, ...readActivity()]);

  return { ok: true, record };
}

export function recordGoonTip(targetMember: NamiMember, amountGoon: number): GoonTransferResult {
  const selfMember = getSelfMember();

  if (targetMember.id === selfMember.id) {
    return { ok: false, reason: 'You cannot tip yourself.' };
  }

  if (amountGoon <= 0) {
    return { ok: false, reason: 'Enter a positive $GOON tip amount.' };
  }

  const record: GoonActivityRecord = {
    id: 'goon-tip-' + Date.now(),
    kind: 'tip',
    amountGoon,
    fromMemberId: selfMember.id,
    fromMemberName: selfMember.name,
    toMemberId: targetMember.id,
    toMemberName: targetMember.name,
    createdAt: new Date().toISOString(),
    note: 'GOON tip via ' + readConfiguredGoonCoinType(),
  };

  writeActivity([record, ...readActivity()]);

  return { ok: true, record };
}

export function tipsReceivedByMember(memberId: string): GoonActivityRecord[] {
  return readActivity().filter((record) => record.kind === 'tip' && record.toMemberId === memberId);
}

export function totalTipsReceived(memberId: string): number {
  return tipsReceivedByMember(memberId).reduce((sum, record) => sum + record.amountGoon, 0);
}

export function memberById(memberId: string): NamiMember | undefined {
  return members.find((member) => member.id === memberId);
}