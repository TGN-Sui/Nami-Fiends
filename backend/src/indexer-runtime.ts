import { config } from './config.js';

export interface IndexerPollSnapshot {
  atMs: number;
  success: boolean;
  eventsIndexed: number;
  error: string | null;
}

export interface IndexerRuntimeSnapshot {
  startedAtMs: number;
  uptimeMs: number;
  network: string;
  packageId: string;
  pollIntervalMs: number;
  totalPolls: number;
  totalEventsIndexed: number;
  consecutiveFailures: number;
  lastPoll: IndexerPollSnapshot | null;
  ready: boolean;
  healthy: boolean;
}

const DEFAULT_FAILURE_THRESHOLD = 5;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export class IndexerRuntime {
  private readonly startedAtMs = Date.now();
  private totalPolls = 0;
  private totalEventsIndexed = 0;
  private consecutiveFailures = 0;
  private lastPoll: IndexerPollSnapshot | null = null;
  private alertSentForStreak = false;

  recordPollSuccess(eventsIndexed: number): void {
    const atMs = Date.now();

    this.totalPolls += 1;
    this.totalEventsIndexed += eventsIndexed;
    this.consecutiveFailures = 0;
    this.alertSentForStreak = false;
    this.lastPoll = {
      atMs,
      success: true,
      eventsIndexed,
      error: null,
    };
  }

  recordPollFailure(error: unknown): void {
    const atMs = Date.now();
    const message = toErrorMessage(error);

    this.totalPolls += 1;
    this.consecutiveFailures += 1;
    this.lastPoll = {
      atMs,
      success: false,
      eventsIndexed: 0,
      error: message,
    };

    void this.maybeSendAlert(message);
  }

  isReady(): boolean {
    return this.lastPoll?.success === true;
  }

  isHealthy(failureThreshold = DEFAULT_FAILURE_THRESHOLD): boolean {
    return this.consecutiveFailures < failureThreshold;
  }

  getSnapshot(): IndexerRuntimeSnapshot {
    const now = Date.now();

    return {
      startedAtMs: this.startedAtMs,
      uptimeMs: now - this.startedAtMs,
      network: config.network,
      packageId: config.packageId,
      pollIntervalMs: config.pollIntervalMs,
      totalPolls: this.totalPolls,
      totalEventsIndexed: this.totalEventsIndexed,
      consecutiveFailures: this.consecutiveFailures,
      lastPoll: this.lastPoll,
      ready: this.isReady(),
      healthy: this.isHealthy(config.alertFailureThreshold),
    };
  }

  private async maybeSendAlert(errorMessage: string): Promise<void> {
    const webhookUrl = config.alertWebhookUrl.trim();

    if (!webhookUrl) {
      return;
    }

    if (this.consecutiveFailures < config.alertFailureThreshold) {
      return;
    }

    if (this.alertSentForStreak) {
      return;
    }

    this.alertSentForStreak = true;

    const payload = {
      service: 'nami-indexer',
      network: config.network,
      packageId: config.packageId,
      consecutiveFailures: this.consecutiveFailures,
      lastError: errorMessage,
      at: new Date().toISOString(),
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(
          `[nami-indexer] alert webhook failed: HTTP ${response.status}`
        );
      } else {
        console.warn(
          `[nami-indexer] alert webhook sent after ${this.consecutiveFailures} consecutive poll failure(s)`
        );
      }
    } catch (error) {
      console.error('[nami-indexer] alert webhook request failed');
      console.error(error);
    }
  }
}