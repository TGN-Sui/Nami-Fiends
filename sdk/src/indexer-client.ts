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
  PassportTimelineSnapshot,
  ProfileProjection,
  RecoveryProjection,
  SquadProjection,
  TimelineCategory,
} from './projections.js';

export interface NamiIndexerConfig {
  baseUrl: string;
}

export interface TimelineQuery {
  category?: TimelineCategory;
  limit?: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Indexer request failed (${response.status}): ${url}`);
  }

  return (await response.json()) as T;
}

export class NamiIndexerClient {
  private readonly baseUrl: string;

  constructor(config: NamiIndexerConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
  }

  async getHealth(): Promise<{
    ok: boolean;
    service?: string;
    network?: string;
    packageId?: string;
    uptimeMs?: number;
  }> {
    return fetchJson(`${this.baseUrl}/health`);
  }

  async getReady(): Promise<{
    ready: boolean;
    network?: string;
    packageId?: string;
    totalPolls?: number;
    totalEventsIndexed?: number;
  }> {
    const response = await fetch(`${this.baseUrl}/ready`);
    const body = (await response.json()) as {
      ready: boolean;
      network?: string;
      packageId?: string;
      totalPolls?: number;
      totalEventsIndexed?: number;
    };

    if (!response.ok && response.status !== 503) {
      throw new Error(`Indexer request failed (${response.status}): ${this.baseUrl}/ready`);
    }

    return body;
  }

  async getStats(): Promise<{
    network: string;
    packageId: string;
    eventLog: { totalEvents: number };
    projections: { services: string[] };
  }> {
    return fetchJson(`${this.baseUrl}/stats`);
  }

  async getGuilds(): Promise<GuildProjection[]> {
    const body = await fetchJson<{ guilds: GuildProjection[] }>(
      `${this.baseUrl}/api/guilds`
    );

    return body.guilds;
  }

  async getPublicGuilds(limit = 50): Promise<GuildProjection[]> {
    const body = await fetchJson<{ guilds: GuildProjection[] }>(
      `${this.baseUrl}/api/guilds/public?limit=${limit}`
    );

    return body.guilds;
  }

  async getGuild(guildId: string): Promise<GuildProjection | null> {
    try {
      const body = await fetchJson<{ guild: GuildProjection }>(
        `${this.baseUrl}/api/guilds/${encodeURIComponent(guildId)}`
      );

      return body.guild;
    } catch {
      return null;
    }
  }

  async getMemberGuilds(member: string): Promise<GuildProjection[]> {
    const body = await fetchJson<{ guilds: GuildProjection[] }>(
      `${this.baseUrl}/api/guilds/member/${encodeURIComponent(member)}`
    );

    return body.guilds;
  }

  async getPassportTimeline(
    passportId: string,
    query: TimelineQuery = {}
  ): Promise<PassportTimelineProjection | null> {
    const params = new URLSearchParams();

    if (query.category) {
      params.set('category', query.category);
    }

    if (query.limit !== undefined) {
      params.set('limit', String(query.limit));
    }

    const suffix = params.size > 0 ? `?${params.toString()}` : '';

    try {
      const body = await fetchJson<{ timeline: PassportTimelineProjection }>(
        `${this.baseUrl}/api/passports/${encodeURIComponent(passportId)}/timeline${suffix}`
      );

      return body.timeline;
    } catch {
      return null;
    }
  }

  async getPassportTimelineSnapshot(
    passportId: string
  ): Promise<PassportTimelineSnapshot | null> {
    try {
      const body = await fetchJson<{ snapshot: PassportTimelineSnapshot }>(
        `${this.baseUrl}/api/passports/${encodeURIComponent(passportId)}/timeline/snapshot`
      );

      return body.snapshot;
    } catch {
      return null;
    }
  }

  async getRecoveryRequests(): Promise<RecoveryProjection[]> {
    const body = await fetchJson<{ requests: RecoveryProjection[] }>(
      `${this.baseUrl}/api/recovery`
    );

    return body.requests;
  }

  async getOpenRecoveryRequests(limit = 50): Promise<RecoveryProjection[]> {
    const body = await fetchJson<{ requests: RecoveryProjection[] }>(
      `${this.baseUrl}/api/recovery/open?limit=${limit}`
    );

    return body.requests;
  }

  async getAppeals(): Promise<AppealProjection[]> {
    const body = await fetchJson<{ appeals: AppealProjection[] }>(
      `${this.baseUrl}/api/appeals`
    );

    return body.appeals;
  }

  async getOpenAppeals(limit = 50): Promise<AppealProjection[]> {
    const body = await fetchJson<{ appeals: AppealProjection[] }>(
      `${this.baseUrl}/api/appeals/open?limit=${limit}`
    );

    return body.appeals;
  }

  async getJuryCases(): Promise<JuryCaseProjection[]> {
    const body = await fetchJson<{ cases: JuryCaseProjection[] }>(
      `${this.baseUrl}/api/jury`
    );

    return body.cases;
  }

  async getOpenJuryCases(limit = 50): Promise<JuryCaseProjection[]> {
    const body = await fetchJson<{ cases: JuryCaseProjection[] }>(
      `${this.baseUrl}/api/jury/open?limit=${limit}`
    );

    return body.cases;
  }

  async getSquads(): Promise<SquadProjection[]> {
    const body = await fetchJson<{ squads: SquadProjection[] }>(
      `${this.baseUrl}/api/squads`
    );

    return body.squads;
  }

  async getMemberSquads(member: string): Promise<SquadProjection[]> {
    const body = await fetchJson<{ squads: SquadProjection[] }>(
      `${this.baseUrl}/api/squads/member/${encodeURIComponent(member)}`
    );

    return body.squads;
  }

  async getProfiles(): Promise<ProfileProjection[]> {
    const body = await fetchJson<{ profiles: ProfileProjection[] }>(
      `${this.baseUrl}/api/profiles`
    );

    return body.profiles;
  }

  async getProfileByOwner(owner: string): Promise<ProfileProjection | null> {
    try {
      const body = await fetchJson<{ profile: ProfileProjection }>(
        `${this.baseUrl}/api/profiles/owner/${encodeURIComponent(owner)}`
      );

      return body.profile;
    } catch {
      return null;
    }
  }

  async getChannels(): Promise<ChannelProjection[]> {
    const body = await fetchJson<{ channels: ChannelProjection[] }>(
      `${this.baseUrl}/api/channels`
    );

    return body.channels;
  }

  async getOwnerChannels(owner: string): Promise<ChannelProjection[]> {
    const body = await fetchJson<{ channels: ChannelProjection[] }>(
      `${this.baseUrl}/api/channels/owner/${encodeURIComponent(owner)}`
    );

    return body.channels;
  }

  async getChannelAccessPolicies(): Promise<ChannelAccessProjection[]> {
    const body = await fetchJson<{ policies: ChannelAccessProjection[] }>(
      `${this.baseUrl}/api/channel-access`
    );

    return body.policies;
  }

  async getOwnerChannelAccessPolicies(
    owner: string
  ): Promise<ChannelAccessProjection[]> {
    const body = await fetchJson<{ policies: ChannelAccessProjection[] }>(
      `${this.baseUrl}/api/channel-access/owner/${encodeURIComponent(owner)}`
    );

    return body.policies;
  }

  async getChannelAccessPolicy(
    channelId: string
  ): Promise<ChannelAccessProjection | null> {
    try {
      const body = await fetchJson<{ policy: ChannelAccessProjection }>(
        `${this.baseUrl}/api/channel-access/channel/${encodeURIComponent(channelId)}`
      );

      return body.policy;
    } catch {
      return null;
    }
  }

  async getActiveModerationRecords(limit = 50): Promise<ModerationRecordProjection[]> {
    const body = await fetchJson<{ records: ModerationRecordProjection[] }>(
      `${this.baseUrl}/api/moderation/active?limit=${limit}`
    );

    return body.records;
  }

  async getBadgeHistoryByOwner(
    owner: string,
    limit = 50
  ): Promise<BadgeHistoryEntry[]> {
    const body = await fetchJson<{ entries: BadgeHistoryEntry[] }>(
      `${this.baseUrl}/api/badges/history/owner/${encodeURIComponent(owner)}?limit=${limit}`
    );

    return body.entries;
  }

  async getBoostHistoryByOwner(
    owner: string,
    limit = 50
  ): Promise<BoostHistoryEntry[]> {
    const body = await fetchJson<{ entries: BoostHistoryEntry[] }>(
      `${this.baseUrl}/api/boosts/history/owner/${encodeURIComponent(owner)}?limit=${limit}`
    );

    return body.entries;
  }

  async getDiscoveryChannels(
    limit = 20,
    options: { weekId?: number; category?: string } = {},
  ): Promise<ChannelDiscoveryResponse> {
    const params = new URLSearchParams({ limit: String(limit) });

    if (options.weekId !== undefined) {
      params.set('weekId', String(options.weekId));
    }

    if (options.category) {
      params.set('category', options.category);
    }

    return fetchJson<ChannelDiscoveryResponse>(
      `${this.baseUrl}/api/discovery/channels?${params.toString()}`
    );
  }

  async getDiscoveryCategories(): Promise<import('./projections.js').DiscoveryCategoriesResponse> {
    return fetchJson(`${this.baseUrl}/api/discovery/categories`);
  }

  async getDiscoveryGuilds(limit = 20): Promise<GuildDiscoveryResponse> {
    return fetchJson<GuildDiscoveryResponse>(
      `${this.baseUrl}/api/discovery/guilds?limit=${limit}`
    );
  }
}

export function createNamiIndexerClient(
  config: NamiIndexerConfig
): NamiIndexerClient {
  return new NamiIndexerClient(config);
}