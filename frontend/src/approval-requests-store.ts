import { useSyncExternalStore } from 'react';

import { getSelfMember } from './member-access.js';
import { deliverIncomingPrivateMessage } from './messages-store.js';

const REQUESTS_KEY = 'nami.approval-requests';

export type ApprovalRequestKind = 'squad-invite' | 'guild-cofounder' | 'guild-join';

export type ApprovalRequestStatus = 'pending' | 'approved' | 'declined';

export type ApprovalRequest = {
  id: string;
  kind: ApprovalRequestKind;
  status: ApprovalRequestStatus;
  approverMemberId: string;
  approverName: string;
  senderMemberId: string;
  senderName: string;
  messageThreadMemberId: string;
  title: string;
  body: string;
  referenceId: string;
  createdAt: string;
};

const listeners = new Set<() => void>();
let cachedSnapshot: ApprovalRequest[] | null = null;

function emit(): void {
  cachedSnapshot = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readRequests(): ApprovalRequest[] {
  try {
    const stored = window.localStorage.getItem(REQUESTS_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? (parsed as ApprovalRequest[]) : [];
  } catch {
    return [];
  }
}

function writeRequests(requests: ApprovalRequest[]): void {
  window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests.slice(0, 200)));
  emit();
}

function getSnapshot(): ApprovalRequest[] {
  if (!cachedSnapshot) {
    cachedSnapshot = readRequests();
  }

  return cachedSnapshot;
}

export function useApprovalRequests(): ApprovalRequest[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function pendingApprovalsForMember(memberId: string): ApprovalRequest[] {
  return readRequests().filter(
    (request) => request.approverMemberId === memberId && request.status === 'pending'
  );
}

export function pendingApprovalsInThread(
  selfMemberId: string,
  counterpartyMemberId: string
): ApprovalRequest[] {
  return readRequests().filter((request) => {
    if (request.status !== 'pending') {
      return false;
    }

    if (request.approverMemberId === selfMemberId) {
      return (
        request.senderMemberId === counterpartyMemberId ||
        request.messageThreadMemberId === counterpartyMemberId
      );
    }

    if (request.senderMemberId === selfMemberId) {
      return request.approverMemberId === counterpartyMemberId;
    }

    return false;
  });
}

export function approvalRequestById(requestId: string): ApprovalRequest | undefined {
  return readRequests().find((request) => request.id === requestId);
}

export function approvalRequestByReference(referenceId: string): ApprovalRequest | undefined {
  return readRequests().find(
    (request) => request.referenceId === referenceId && request.status === 'pending'
  );
}

export function approvalRequestForApprover(
  referenceId: string,
  approverMemberId: string
): ApprovalRequest | undefined {
  return readRequests().find(
    (request) =>
      request.referenceId === referenceId &&
      request.approverMemberId === approverMemberId &&
      request.status === 'pending'
  );
}

export function createApprovalRequest(input: {
  kind: ApprovalRequestKind;
  approverMemberId: string;
  approverName: string;
  senderMemberId: string;
  senderName: string;
  title: string;
  body: string;
  referenceId: string;
}): ApprovalRequest {
  const request: ApprovalRequest = {
    id: 'approval-' + input.kind + '-' + Date.now(),
    kind: input.kind,
    status: 'pending',
    approverMemberId: input.approverMemberId,
    approverName: input.approverName,
    senderMemberId: input.senderMemberId,
    senderName: input.senderName,
    messageThreadMemberId: input.senderMemberId,
    title: input.title,
    body: input.body,
    referenceId: input.referenceId,
    createdAt: new Date().toISOString(),
  };

  writeRequests([request, ...readRequests()]);

  deliverIncomingPrivateMessage({
    memberId: input.senderMemberId,
    memberName: input.senderName,
    body:
      input.body +
      '\n\nOpen this message to approve or decline. Request ID: ' +
      request.id,
    authorName: input.senderName,
    signal: 'Green',
    markUnread: true,
  });

  return request;
}

export function resolveApprovalRequestsForReference(
  referenceId: string,
  status: Exclude<ApprovalRequestStatus, 'pending'>
): void {
  const requests = readRequests();
  let changed = false;

  const updated = requests.map((request) => {
    if (request.referenceId !== referenceId || request.status !== 'pending') {
      return request;
    }

    changed = true;
    return { ...request, status };
  });

  if (changed) {
    writeRequests(updated);
  }
}

export function updateApprovalRequestStatus(
  requestId: string,
  status: ApprovalRequestStatus
): ApprovalRequest | null {
  const requests = readRequests();
  const index = requests.findIndex((request) => request.id === requestId);

  if (index < 0) {
    return null;
  }

  const next = { ...requests[index]!, status };
  const updated = [...requests];
  updated[index] = next;
  writeRequests(updated);

  return next;
}

export function readPendingApprovalCountForSelf(): number {
  return pendingApprovalsForMember(getSelfMember().id).length;
}

export function resetApprovalRequestsForTests(): void {
  window.localStorage.removeItem(REQUESTS_KEY);
  emit();
}