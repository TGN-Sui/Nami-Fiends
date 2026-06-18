export type SafetyReport = {
  id: string;
  source: 'message' | 'member';
  targetId: string;
  targetName: string;
  reason: string;
  channelName: string;
  createdAt: string;
  status: 'Queued' | 'Reviewing' | 'Warned' | 'Timed Out' | 'Escalated' | 'Resolved';
};

export type SafetyActionRecord = {
  id: string;
  reportId: string;
  targetId: string;
  targetName: string;
  action: 'Review' | 'Warn' | 'Timeout' | 'Escalate' | 'Resolve' | 'Signal Review';
  note: string;
  channelName: string;
  createdAt: string;
};

const SAFETY_REPORTS_KEY = 'nami-safety-reports';
const SAFETY_ACTIONS_KEY = 'nami-safety-actions';

export function readSafetyReports(): SafetyReport[] {
  try {
    const savedReports = window.localStorage.getItem(SAFETY_REPORTS_KEY);

    if (!savedReports) {
      return [];
    }

    const parsedReports = JSON.parse(savedReports);

    if (!Array.isArray(parsedReports)) {
      return [];
    }

    return parsedReports.filter((report): report is SafetyReport => {
      return (
        typeof report === 'object' &&
        report !== null &&
        typeof report.id === 'string' &&
        typeof report.targetId === 'string' &&
        typeof report.targetName === 'string'
      );
    });
  } catch {
    return [];
  }
}

export function saveSafetyReports(reports: SafetyReport[]): void {
  window.localStorage.setItem(SAFETY_REPORTS_KEY, JSON.stringify(reports));
}

export function clearSafetyReports(): void {
  saveSafetyReports([]);
}

export function readSafetyReportCount(): number {
  return readSafetyReports().length;
}

export function readSafetyActions(): SafetyActionRecord[] {
  try {
    const savedActions = window.localStorage.getItem(SAFETY_ACTIONS_KEY);

    if (!savedActions) {
      return [];
    }

    const parsedActions = JSON.parse(savedActions);

    if (!Array.isArray(parsedActions)) {
      return [];
    }

    return parsedActions.filter((action): action is SafetyActionRecord => {
      return (
        typeof action === 'object' &&
        action !== null &&
        typeof action.id === 'string' &&
        typeof action.reportId === 'string' &&
        typeof action.targetId === 'string'
      );
    });
  } catch {
    return [];
  }
}

export function saveSafetyAction(action: Omit<SafetyActionRecord, 'id' | 'createdAt'>): void {
  const nextAction: SafetyActionRecord = {
    ...action,
    id: 'action-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2),
    createdAt: new Date().toLocaleString(),
  };

  window.localStorage.setItem(
    SAFETY_ACTIONS_KEY,
    JSON.stringify([nextAction, ...readSafetyActions()])
  );
}

export function clearSafetyActions(): void {
  window.localStorage.setItem(SAFETY_ACTIONS_KEY, JSON.stringify([]));
}

export function saveSafetyReport(report: Omit<SafetyReport, 'id' | 'createdAt' | 'status'>): void {
  const nextReport: SafetyReport = {
    ...report,
    id: 'report-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2),
    createdAt: new Date().toLocaleString(),
    status: 'Queued',
  };

  saveSafetyReports([nextReport, ...readSafetyReports()]);
}