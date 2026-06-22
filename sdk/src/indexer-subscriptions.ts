import type { NamiIndexerClient, TimelineQuery } from './indexer-client.js';
import type {
  AppealProjection,
  BadgeHistoryEntry,
  BoostHistoryEntry,
  ChannelAccessProjection,
  ChannelDiscoveryResponse,
  ChannelProjection,
  GuildDiscoveryResponse,
  GuildProjection,
  JuryCaseProjection,
  ModerationRecordProjection,
  PassportTimelineProjection,
  ProfileProjection,
  RecoveryProjection,
  SquadProjection,
} from './projections.js';

export interface IndexerPollOptions {
  /** Poll interval in milliseconds. Default 15_000. */
  pollIntervalMs?: number;
  /** Run the first fetch immediately. Default true. */
  runImmediately?: boolean;
}

export interface IndexerPollSnapshot<T> {
  data: T;
  polledAt: string;
}

export type IndexerUnsubscribe = () => void;

export const NAMI_INDEXER_SUBSCRIPTION_KEYS = [
  'guilds',
  'squads',
  'profiles',
  'channels',
  'channelAccess',
  'moderation',
  'appeals',
  'jury',
  'recovery',
  'discoveryChannels',
  'discoveryGuilds',
] as const;

export type NamiIndexerSubscriptionKey = (typeof NAMI_INDEXER_SUBSCRIPTION_KEYS)[number];

function pollIndexer<T>(
  fetcher: () => Promise<T>,
  onData: (snapshot: IndexerPollSnapshot<T>) => void,
  options: IndexerPollOptions = {}
): IndexerUnsubscribe {
  const pollIntervalMs = options.pollIntervalMs ?? 15_000;
  const runImmediately = options.runImmediately ?? true;
  let cancelled = false;

  const poll = async (): Promise<void> => {
    if (cancelled) {
      return;
    }

    try {
      const data = await fetcher();

      if (!cancelled) {
        onData({
          data,
          polledAt: new Date().toISOString(),
        });
      }
    } catch {
      // Swallow poll errors; dashboards can keep the last good snapshot.
    }
  };

  if (runImmediately) {
    void poll();
  }

  const intervalId = setInterval(() => {
    void poll();
  }, pollIntervalMs);

  return () => {
    cancelled = true;
    clearInterval(intervalId);
  };
}

export function subscribeToGuildProjections(
  indexer: NamiIndexerClient,
  onData: (snapshot: IndexerPollSnapshot<GuildProjection[]>) => void,
  options?: IndexerPollOptions
): IndexerUnsubscribe {
  return pollIndexer(() => indexer.getGuilds(), onData, options);
}

export function subscribeToSquadProjections(
  indexer: NamiIndexerClient,
  onData: (snapshot: IndexerPollSnapshot<SquadProjection[]>) => void,
  options?: IndexerPollOptions
): IndexerUnsubscribe {
  return pollIndexer(() => indexer.getSquads(), onData, options);
}

export function subscribeToProfileProjections(
  indexer: NamiIndexerClient,
  onData: (snapshot: IndexerPollSnapshot<ProfileProjection[]>) => void,
  options?: IndexerPollOptions
): IndexerUnsubscribe {
  return pollIndexer(() => indexer.getProfiles(), onData, options);
}

export function subscribeToChannelProjections(
  indexer: NamiIndexerClient,
  onData: (snapshot: IndexerPollSnapshot<ChannelProjection[]>) => void,
  options?: IndexerPollOptions
): IndexerUnsubscribe {
  return pollIndexer(() => indexer.getChannels(), onData, options);
}

export function subscribeToChannelAccessProjections(
  indexer: NamiIndexerClient,
  onData: (snapshot: IndexerPollSnapshot<ChannelAccessProjection[]>) => void,
  options?: IndexerPollOptions
): IndexerUnsubscribe {
  return pollIndexer(() => indexer.getChannelAccessPolicies(), onData, options);
}

export function subscribeToModerationProjections(
  indexer: NamiIndexerClient,
  onData: (snapshot: IndexerPollSnapshot<ModerationRecordProjection[]>) => void,
  options?: IndexerPollOptions
): IndexerUnsubscribe {
  return pollIndexer(() => indexer.getActiveModerationRecords(), onData, options);
}

export function subscribeToAppealProjections(
  indexer: NamiIndexerClient,
  onData: (snapshot: IndexerPollSnapshot<AppealProjection[]>) => void,
  options?: IndexerPollOptions
): IndexerUnsubscribe {
  return pollIndexer(() => indexer.getAppeals(), onData, options);
}

export function subscribeToJuryProjections(
  indexer: NamiIndexerClient,
  onData: (snapshot: IndexerPollSnapshot<JuryCaseProjection[]>) => void,
  options?: IndexerPollOptions
): IndexerUnsubscribe {
  return pollIndexer(() => indexer.getJuryCases(), onData, options);
}

export function subscribeToRecoveryProjections(
  indexer: NamiIndexerClient,
  onData: (snapshot: IndexerPollSnapshot<RecoveryProjection[]>) => void,
  options?: IndexerPollOptions
): IndexerUnsubscribe {
  return pollIndexer(() => indexer.getRecoveryRequests(), onData, options);
}

export function subscribeToDiscoveryChannelRankings(
  indexer: NamiIndexerClient,
  onData: (snapshot: IndexerPollSnapshot<ChannelDiscoveryResponse>) => void,
  options?: IndexerPollOptions & { limit?: number; weekId?: number }
): IndexerUnsubscribe {
  const limit = options?.limit ?? 20;
  const weekId = options?.weekId;

  return pollIndexer(
    () => indexer.getDiscoveryChannels(limit, weekId),
    onData,
    options
  );
}

export function subscribeToDiscoveryGuildRankings(
  indexer: NamiIndexerClient,
  onData: (snapshot: IndexerPollSnapshot<GuildDiscoveryResponse>) => void,
  options?: IndexerPollOptions & { limit?: number }
): IndexerUnsubscribe {
  const limit = options?.limit ?? 20;

  return pollIndexer(() => indexer.getDiscoveryGuilds(limit), onData, options);
}

export function subscribeToPassportTimeline(
  indexer: NamiIndexerClient,
  passportId: string,
  onData: (snapshot: IndexerPollSnapshot<PassportTimelineProjection | null>) => void,
  options?: IndexerPollOptions & TimelineQuery
): IndexerUnsubscribe {
  const query: TimelineQuery = {
    ...(options?.category !== undefined ? { category: options.category } : {}),
    ...(options?.limit !== undefined ? { limit: options.limit } : {}),
  };

  return pollIndexer(() => indexer.getPassportTimeline(passportId, query), onData, options);
}

export function subscribeToBadgeHistory(
  indexer: NamiIndexerClient,
  owner: string,
  onData: (snapshot: IndexerPollSnapshot<BadgeHistoryEntry[]>) => void,
  options?: IndexerPollOptions & { limit?: number }
): IndexerUnsubscribe {
  const limit = options?.limit ?? 50;

  return pollIndexer(() => indexer.getBadgeHistoryByOwner(owner, limit), onData, options);
}

export function subscribeToBoostHistory(
  indexer: NamiIndexerClient,
  owner: string,
  onData: (snapshot: IndexerPollSnapshot<BoostHistoryEntry[]>) => void,
  options?: IndexerPollOptions & { limit?: number }
): IndexerUnsubscribe {
  const limit = options?.limit ?? 50;

  return pollIndexer(() => indexer.getBoostHistoryByOwner(owner, limit), onData, options);
}

export interface IndexerProjectionSubscriptionOptions extends IndexerPollOptions {
  limit?: number;
  weekId?: number;
}

/**
 * Unified dispatcher for standard indexer projection polls.
 * Parameterized helpers (timeline, badge/boost history) have dedicated subscribe functions.
 */
export function subscribeToIndexerProjection(
  indexer: NamiIndexerClient,
  key: NamiIndexerSubscriptionKey,
  onData: (snapshot: IndexerPollSnapshot<unknown>) => void,
  options: IndexerProjectionSubscriptionOptions = {}
): IndexerUnsubscribe {
  switch (key) {
    case 'guilds':
      return subscribeToGuildProjections(indexer, onData, options);
    case 'squads':
      return subscribeToSquadProjections(indexer, onData, options);
    case 'profiles':
      return subscribeToProfileProjections(indexer, onData, options);
    case 'channels':
      return subscribeToChannelProjections(indexer, onData, options);
    case 'channelAccess':
      return subscribeToChannelAccessProjections(indexer, onData, options);
    case 'moderation':
      return subscribeToModerationProjections(indexer, onData, options);
    case 'appeals':
      return subscribeToAppealProjections(indexer, onData, options);
    case 'jury':
      return subscribeToJuryProjections(indexer, onData, options);
    case 'recovery':
      return subscribeToRecoveryProjections(indexer, onData, options);
    case 'discoveryChannels':
      return subscribeToDiscoveryChannelRankings(indexer, onData, options);
    case 'discoveryGuilds':
      return subscribeToDiscoveryGuildRankings(indexer, onData, options);
    default: {
      const exhaustive: never = key;
      throw new Error(`Unsupported indexer subscription key: ${exhaustive}`);
    }
  }
}