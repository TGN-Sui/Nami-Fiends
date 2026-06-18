import { useSyncExternalStore } from 'react';

import { canReportMemberFeedAbuse } from './member-feed-access.js';
import type { NamiMember } from './uiMockData.js';

const REPORTS_KEY = 'nami.member-feed-abuse.reports';
const MODERATION_KEY = 'nami.member-feed-abuse.moderation';

export const VERIFIED_REPORT_THRESHOLD = 3;
export const VERIFIED_REPORT_WINDOW_MS = 30 * 60 * 1000;

export const MEMBER_FEED_ABUSE_REPORT_TYPES = [
  { id: 'hate-language', label: 'Hate speech or slurs' },
  { id: 'harassment', label: 'Harassment or bullying' },
  { id: 'explicit-adult', label: 'Explicit adult material' },
  { id: 'drugs', label: 'Drugs or illegal activity' },
  { id: 'violence', label: 'Violence or threats' },
  { id: 'spam-misuse', label: 'Spam or feed misuse' },
  { id: 'other', label: 'Other misconduct' },
] as const;

export type MemberFeedAbuseReportType = (typeof MEMBER_FEED_ABUSE_REPORT_TYPES)[number]['id'];

export type MemberFeedAbuseReportStatus = 'queued' | 'reviewing' | 'resolved' | 'dismissed';

export type MemberFeedAbuseReport = {
  id: string;
  feedOwnerMemberId: string;
  feedOwnerName: string;
  reporterMemberId: string;
  reporterName: string;
  reportType: MemberFeedAbuseReportType;
  createdAt: string;
  status: MemberFeedAbuseReportStatus;
};

export type MemberFeedModerationState = {
  feedOwnerMemberId: string;
  suspended: boolean;
  suspendedAt: string | null;
  officialNotified: boolean;
  officialNotifiedAt: string | null;
  lastResolvedAt: string | null;
};

export type MemberFeedAbuseSubmitResult =
  | { ok: true; reportId: string; officialNotified: boolean; suspended: boolean }
  | { ok: false; reason: string };

export type OfficialFeedAbuseAlert = {
  feedOwnerMemberId: string;
  feedOwnerName: string;
  pendingReportCount: number;
  suspended: boolean;
  officialNotifiedAt: string | null;
};

const listeners = new Set<() => void>();
let cachedReports: MemberFeedAbuseReport[] | null = null;
let cachedModeration: MemberFeedModerationState[] | null = null;
let cachedAlerts: OfficialFeedAbuseAlert[] | null = null;

function emit(): void {
  cachedReports = null;
  cachedModeration = null;
  cachedAlerts = null;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readReports(): MemberFeedAbuseReport[] {
  if (cachedReports) {
    return cachedReports;
  }

  try {
    const stored = window.localStorage.getItem(REPORTS_KEY);

    if (!stored) {
      cachedReports = [];
      return cachedReports;
    }

    const parsed = JSON.parse(stored);

    cachedReports = Array.isArray(parsed) ? (parsed as MemberFeedAbuseReport[]) : [];
    return cachedReports;
  } catch {
    cachedReports = [];
    return cachedReports;
  }
}

function writeReports(reports: MemberFeedAbuseReport[]): void {
  window.localStorage.setItem(REPORTS_KEY, JSON.stringify(reports.slice(0, 300)));
  emit();
}

function readModerationStates(): MemberFeedModerationState[] {
  if (cachedModeration) {
    return cachedModeration;
  }

  try {
    const stored = window.localStorage.getItem(MODERATION_KEY);

    if (!stored) {
      cachedModeration = [];
      return cachedModeration;
    }

    const parsed = JSON.parse(stored);

    cachedModeration = Array.isArray(parsed) ? (parsed as MemberFeedModerationState[]) : [];
    return cachedModeration;
  } catch {
    cachedModeration = [];
    return cachedModeration;
  }
}

function writeModerationStates(states: MemberFeedModerationState[]): void {
  window.localStorage.setItem(MODERATION_KEY, JSON.stringify(states));
  emit();
}

function moderationForOwner(feedOwnerMemberId: string): MemberFeedModerationState {
  const existing = readModerationStates().find(
    (state) => state.feedOwnerMemberId === feedOwnerMemberId
  );

  if (existing) {
    return existing;
  }

  return {
    feedOwnerMemberId,
    suspended: false,
    suspendedAt: null,
    officialNotified: false,
    officialNotifiedAt: null,
    lastResolvedAt: null,
  };
}

function saveModerationState(nextState: MemberFeedModerationState): void {
  const states = readModerationStates().filter(
    (state) => state.feedOwnerMemberId !== nextState.feedOwnerMemberId
  );

  writeModerationStates([nextState, ...states]);
}

function unresolvedReportsForOwner(feedOwnerMemberId: string): MemberFeedAbuseReport[] {
  return readReports().filter(
    (report) =>
      report.feedOwnerMemberId === feedOwnerMemberId &&
      (report.status === 'queued' || report.status === 'reviewing')
  );
}

function recentVerifiedReporterCount(feedOwnerMemberId: string, now: number): number {
  const windowStart = now - VERIFIED_REPORT_WINDOW_MS;
  const reporterIds = new Set<string>();

  for (const report of readReports()) {
    if (report.feedOwnerMemberId !== feedOwnerMemberId) {
      continue;
    }

    if (report.status === 'dismissed') {
      continue;
    }

    if (Date.parse(report.createdAt) >= windowStart) {
      reporterIds.add(report.reporterMemberId);
    }
  }

  return reporterIds.size;
}

export function memberFeedAbuseReportLabel(reportType: MemberFeedAbuseReportType): string {
  return (
    MEMBER_FEED_ABUSE_REPORT_TYPES.find((entry) => entry.id === reportType)?.label ?? reportType
  );
}

export function isMemberFeedSuspended(feedOwnerMemberId: string): boolean {
  return moderationForOwner(feedOwnerMemberId).suspended;
}

function buildOfficialFeedAbuseAlerts(): OfficialFeedAbuseAlert[] {
  const alerts: OfficialFeedAbuseAlert[] = [];

  for (const state of readModerationStates()) {
    if (!state.officialNotified) {
      continue;
    }

    const pendingReportCount = unresolvedReportsForOwner(state.feedOwnerMemberId).length;

    if (pendingReportCount === 0 && !state.suspended) {
      continue;
    }

    const feedOwnerName =
      readReports().find((report) => report.feedOwnerMemberId === state.feedOwnerMemberId)
        ?.feedOwnerName ?? 'Member';

    alerts.push({
      feedOwnerMemberId: state.feedOwnerMemberId,
      feedOwnerName,
      pendingReportCount,
      suspended: state.suspended,
      officialNotifiedAt: state.officialNotifiedAt,
    });
  }

  return alerts.sort((left, right) => {
    if (left.suspended !== right.suspended) {
      return left.suspended ? -1 : 1;
    }

    return right.pendingReportCount - left.pendingReportCount;
  });
}

export function getOfficialFeedAbuseAlerts(): OfficialFeedAbuseAlert[] {
  if (!cachedAlerts) {
    cachedAlerts = buildOfficialFeedAbuseAlerts();
  }

  return cachedAlerts;
}

export function reportsForFeedOwner(feedOwnerMemberId: string): MemberFeedAbuseReport[] {
  return readReports().filter((report) => report.feedOwnerMemberId === feedOwnerMemberId);
}

export function submitMemberFeedAbuseReport(input: {
  feedOwnerMemberId: string;
  feedOwnerName: string;
  reporter: NamiMember;
  reportType: MemberFeedAbuseReportType;
  now?: number;
}): MemberFeedAbuseSubmitResult {
  if (!canReportMemberFeedAbuse(input.reporter)) {
    return {
      ok: false,
      reason: 'Only verified members can report member feed abuse.',
    };
  }

  if (input.reporter.id === input.feedOwnerMemberId) {
    return {
      ok: false,
      reason: 'You cannot report your own member feed.',
    };
  }

  const now = input.now ?? Date.now();
  const hasPendingDuplicate = readReports().some(
    (report) =>
      report.feedOwnerMemberId === input.feedOwnerMemberId &&
      report.reporterMemberId === input.reporter.id &&
      (report.status === 'queued' || report.status === 'reviewing')
  );

  if (hasPendingDuplicate) {
    return {
      ok: false,
      reason: 'You already have a pending report for this member feed.',
    };
  }

  const nextReport: MemberFeedAbuseReport = {
    id: 'feed-abuse-' + now.toString(36) + '-' + Math.random().toString(36).slice(2),
    feedOwnerMemberId: input.feedOwnerMemberId,
    feedOwnerName: input.feedOwnerName,
    reporterMemberId: input.reporter.id,
    reporterName: input.reporter.name,
    reportType: input.reportType,
    createdAt: new Date(now).toISOString(),
    status: 'queued',
  };

  writeReports([nextReport, ...readReports()]);

  const moderation = moderationForOwner(input.feedOwnerMemberId);
  const verifiedReporterCount = recentVerifiedReporterCount(input.feedOwnerMemberId, now);
  const shouldNotifyOfficials =
    !moderation.officialNotified && verifiedReporterCount >= VERIFIED_REPORT_THRESHOLD;
  const hasUnresolved = unresolvedReportsForOwner(input.feedOwnerMemberId).length > 0;
  const shouldSuspend =
    moderation.officialNotified && hasUnresolved && !moderation.suspended;

  const nextModeration: MemberFeedModerationState = {
    ...moderation,
    officialNotified: moderation.officialNotified || shouldNotifyOfficials,
    officialNotifiedAt:
      moderation.officialNotifiedAt ??
      (shouldNotifyOfficials ? new Date(now).toISOString() : null),
    suspended: moderation.suspended || shouldSuspend,
    suspendedAt:
      moderation.suspendedAt ?? (shouldSuspend ? new Date(now).toISOString() : null),
  };

  saveModerationState(nextModeration);

  return {
    ok: true,
    reportId: nextReport.id,
    officialNotified: nextModeration.officialNotified,
    suspended: nextModeration.suspended,
  };
}

export function reviewMemberFeedAbuseReports(feedOwnerMemberId: string): void {
  const reports = readReports().map((report) => {
    if (report.feedOwnerMemberId !== feedOwnerMemberId || report.status !== 'queued') {
      return report;
    }

    return {
      ...report,
      status: 'reviewing' as const,
    };
  });

  writeReports(reports);
}

export function resolveMemberFeedAbuseForOwner(feedOwnerMemberId: string, now = Date.now()): void {
  const reports = readReports().map((report) => {
    if (report.feedOwnerMemberId !== feedOwnerMemberId) {
      return report;
    }

    if (report.status === 'resolved' || report.status === 'dismissed') {
      return report;
    }

    return {
      ...report,
      status: 'resolved' as const,
    };
  });

  writeReports(reports);

  const moderation = moderationForOwner(feedOwnerMemberId);

  saveModerationState({
    ...moderation,
    suspended: false,
    suspendedAt: null,
    officialNotified: false,
    officialNotifiedAt: null,
    lastResolvedAt: new Date(now).toISOString(),
  });
}

export function useMemberFeedAbuseReports(): MemberFeedAbuseReport[] {
  return useSyncExternalStore(subscribe, readReports, readReports);
}

export function useOfficialFeedAbuseAlerts(): OfficialFeedAbuseAlert[] {
  return useSyncExternalStore(
    subscribe,
    getOfficialFeedAbuseAlerts,
    getOfficialFeedAbuseAlerts
  );
}

export function resetMemberFeedAbuseForTests(): void {
  window.localStorage.removeItem(REPORTS_KEY);
  window.localStorage.removeItem(MODERATION_KEY);
  emit();
}