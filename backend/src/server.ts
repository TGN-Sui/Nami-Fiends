import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import { config } from './config.js';
import type { ProjectionRegistry } from './projection-registry.js';
import {
  handlePaymentConfigGet,
  handlePaymentIntentCreate,
  handlePaymentIntentCryptoConfirm,
  handlePaymentIntentGet,
  handlePaymentIntentMockConfirm,
  handlePaymentOptions,
  handlePayPalWebhookPost,
  handleStripeWebhookPost,
} from './routes/membership-payments.routes.js';
import {
  handleMembershipSubscriptionGet,
  handleMembershipSubscriptionSync,
} from './routes/membership-subscriptions.routes.js';
import {
  handleMemberPreferencesGet,
  handleMemberPreferencesUpsert,
} from './routes/member-preferences.routes.js';
import {
  handleAvatarUploadPost,
  handleChannelCoverUploadPost,
  handleMediaFileGet,
  handleStudioLogoUploadPost,
} from './routes/media-upload.routes.js';
import {
  handleStudioPreferencesGet,
  handleStudioPreferencesUpsert,
} from './routes/studio-preferences.routes.js';
import {
  handleChannelPreferencesGet,
  handleChannelPreferencesUpsert,
} from './routes/channel-preferences.routes.js';
import {
  handleMembershipFulfillmentComplete,
  handleMembershipFulfillmentOwnerGet,
  handleMembershipFulfillmentPendingGet,
} from './routes/membership-fulfillment.routes.js';
import {
  handleOfficialsSubmissionsGet,
  handleOfficialsSubmissionsOptions,
  handleOfficialsSubmissionsSync,
} from './routes/officials-submissions.routes.js';
import {
  handlePlatformOwnerAssetsGet,
  handlePlatformOwnerAssetsOptions,
  handlePlatformOwnerAssetsSync,
} from './routes/platform-owner-assets.routes.js';
import {
  handleGlobalChatMessagesGet,
  handleGlobalChatMessagesOptions,
  handleGlobalChatMessagesPost,
} from './routes/global-chat-messages.routes.js';
import {
  handleChatFavoritesGet,
  handleChatFavoritesOptions,
  handleChatFavoritesUpsert,
  handleChatRoomRead,
  handleChatUnreadGet,
} from './routes/chat-favorites.routes.js';
import type { TimelineCategory } from './services/passport-timeline.service.js';
import {
  buildChannelDiscoveryRankings,
  buildGuildDiscoveryRankings,
  listDiscoveryChannelCategories,
} from './services/discovery.service.js';
import { buildLaunchOpsSummary } from './services/launch-ops.service.js';
import type { IndexerRuntime } from './indexer-runtime.js';
import { collectIndexerStats } from './stats.js';

const TIMELINE_CATEGORIES = new Set<TimelineCategory>([
  'origin',
  'progression',
  'verification',
  'conduct',
  'customization',
  'moderation',
]);

type RouteHandler = (
  registry: ProjectionRegistry,
  request: IncomingMessage,
  response: ServerResponse,
  params: Record<string, string>,
  runtime: IndexerRuntime
) => Promise<void> | void;

type HttpMethod = 'GET' | 'POST' | 'OPTIONS';

interface Route {
  method: HttpMethod | HttpMethod[];
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

function routeMethods(method: HttpMethod | HttpMethod[]): HttpMethod[] {
  return Array.isArray(method) ? method : [method];
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  const payload = `${JSON.stringify(body, null, 2)}\n`;

  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  });
  response.end(payload);
}

function notFound(response: ServerResponse): void {
  sendJson(response, 404, { error: 'not_found' });
}

const routes: Route[] = [
  {
    method: 'GET',
    pattern: /^\/health$/,
    paramNames: [],
    handler: (_registry, _request, response, _params, runtime) => {
      const snapshot = runtime.getSnapshot();

      sendJson(response, 200, {
        ok: snapshot.healthy,
        service: 'nami-receiving-server',
        network: snapshot.network,
        packageId: snapshot.packageId,
        uptimeMs: snapshot.uptimeMs,
        indexer: {
          consecutiveFailures: snapshot.consecutiveFailures,
          lastPollAt: snapshot.lastPoll
            ? new Date(snapshot.lastPoll.atMs).toISOString()
            : null,
        },
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/ready$/,
    paramNames: [],
    handler: (_registry, _request, response, _params, runtime) => {
      const snapshot = runtime.getSnapshot();
      const body = {
        ready: snapshot.ready,
        network: snapshot.network,
        packageId: snapshot.packageId,
        pollIntervalMs: snapshot.pollIntervalMs,
        totalPolls: snapshot.totalPolls,
        totalEventsIndexed: snapshot.totalEventsIndexed,
        consecutiveFailures: snapshot.consecutiveFailures,
        lastPoll: snapshot.lastPoll
          ? {
              at: new Date(snapshot.lastPoll.atMs).toISOString(),
              success: snapshot.lastPoll.success,
              eventsIndexed: snapshot.lastPoll.eventsIndexed,
              error: snapshot.lastPoll.error,
            }
          : null,
      };

      sendJson(response, snapshot.ready ? 200 : 503, body);
    },
  },
  {
    method: 'GET',
    pattern: /^\/stats$/,
    paramNames: [],
    handler: async (registry, _request, response) => {
      const stats = await collectIndexerStats(registry);
      sendJson(response, 200, stats);
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/guilds$/,
    paramNames: [],
    handler: (registry, _request, response) => {
      sendJson(response, 200, {
        guilds: registry.guilds.getAll(),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/guilds\/public$/,
    paramNames: [],
    handler: (registry, request, response) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const limit = Number(url.searchParams.get('limit') ?? '50');

      sendJson(response, 200, {
        guilds: registry.guilds.listPublicGuilds(
          Number.isFinite(limit) ? limit : 50
        ),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/guilds\/member\/([^/]+)$/,
    paramNames: ['member'],
    handler: (registry, _request, response, params) => {
      const member = params.member ?? '';

      sendJson(response, 200, {
        member,
        guilds: registry.guilds.getMemberGuilds(member),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/guilds\/([^/]+)$/,
    paramNames: ['guildId'],
    handler: (registry, _request, response, params) => {
      const guildId = params.guildId ?? '';
      const guild = registry.guilds.getGuild(guildId);

      if (!guild) {
        notFound(response);
        return;
      }

      sendJson(response, 200, { guild });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/recovery$/,
    paramNames: [],
    handler: (registry, _request, response) => {
      sendJson(response, 200, {
        requests: registry.recovery.getAll(),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/recovery\/open$/,
    paramNames: [],
    handler: (registry, request, response) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const limit = Number(url.searchParams.get('limit') ?? '50');

      sendJson(response, 200, {
        requests: registry.recovery.listOpen(
          Number.isFinite(limit) ? limit : 50
        ),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/recovery\/passport\/([^/]+)$/,
    paramNames: ['passportId'],
    handler: (registry, _request, response, params) => {
      const passportId = params.passportId ?? '';

      sendJson(response, 200, {
        passport_id: passportId,
        requests: registry.recovery.listByPassport(passportId),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/recovery\/identity\/([^/]+)$/,
    paramNames: ['identityId'],
    handler: (registry, _request, response, params) => {
      const identityId = params.identityId ?? '';

      sendJson(response, 200, {
        identity_id: identityId,
        requests: registry.recovery.listByIdentity(identityId),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/recovery\/requester\/([^/]+)$/,
    paramNames: ['requester'],
    handler: (registry, _request, response, params) => {
      const requester = params.requester ?? '';

      sendJson(response, 200, {
        requester,
        requests: registry.recovery.listByRequester(requester),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/recovery\/([^/]+)$/,
    paramNames: ['recoveryId'],
    handler: (registry, _request, response, params) => {
      const recoveryId = params.recoveryId ?? '';
      const request = registry.recovery.getRecovery(recoveryId);

      if (!request) {
        notFound(response);
        return;
      }

      sendJson(response, 200, { request });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/passports\/timelines$/,
    paramNames: [],
    handler: (registry, request, response) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const limit = Number(url.searchParams.get('limit') ?? '50');

      sendJson(response, 200, {
        timelines: registry.passportTimelines.listSummaries(
          Number.isFinite(limit) ? limit : 50
        ),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/passports\/([^/]+)\/timeline\/snapshot$/,
    paramNames: ['passportId'],
    handler: (registry, _request, response, params) => {
      const passportId = params.passportId ?? '';
      const snapshot = registry.passportTimelines.getSnapshot(passportId);

      if (!snapshot) {
        notFound(response);
        return;
      }

      sendJson(response, 200, {
        passport_id: passportId,
        snapshot,
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/passports\/([^/]+)\/timeline$/,
    paramNames: ['passportId'],
    handler: (registry, request, response, params) => {
      const passportId = params.passportId ?? '';
      const url = new URL(request.url ?? '/', 'http://localhost');
      const limit = Number(url.searchParams.get('limit') ?? '0');
      const categoryParam = url.searchParams.get('category');
      const category =
        categoryParam && TIMELINE_CATEGORIES.has(categoryParam as TimelineCategory)
          ? (categoryParam as TimelineCategory)
          : undefined;

      const query: {
        category?: TimelineCategory;
        limit?: number;
      } = {};

      if (category) {
        query.category = category;
      }

      if (limit > 0) {
        query.limit = limit;
      }

      const timeline = registry.passportTimelines.getTimeline(passportId, query);

      if (!timeline) {
        notFound(response);
        return;
      }

      sendJson(response, 200, { timeline });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/appeals$/,
    paramNames: [],
    handler: (registry, _request, response) => {
      sendJson(response, 200, { appeals: registry.appeals.getAll() });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/appeals\/open$/,
    paramNames: [],
    handler: (registry, request, response) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const limit = Number(url.searchParams.get('limit') ?? '50');

      sendJson(response, 200, {
        appeals: registry.appeals.listOpen(
          Number.isFinite(limit) ? limit : 50
        ),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/appeals\/passport\/([^/]+)$/,
    paramNames: ['passportId'],
    handler: (registry, _request, response, params) => {
      const passportId = params.passportId ?? '';

      sendJson(response, 200, {
        passport_id: passportId,
        appeals: registry.appeals.listByPassport(passportId),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/appeals\/([^/]+)$/,
    paramNames: ['appealId'],
    handler: (registry, _request, response, params) => {
      const appealId = params.appealId ?? '';
      const appeal = registry.appeals.getAppeal(appealId);

      if (!appeal) {
        notFound(response);
        return;
      }

      sendJson(response, 200, { appeal });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/jury$/,
    paramNames: [],
    handler: (registry, _request, response) => {
      sendJson(response, 200, { cases: registry.jury.getAll() });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/jury\/open$/,
    paramNames: [],
    handler: (registry, request, response) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const limit = Number(url.searchParams.get('limit') ?? '50');

      sendJson(response, 200, {
        cases: registry.jury.listOpen(Number.isFinite(limit) ? limit : 50),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/jury\/appeal\/([^/]+)$/,
    paramNames: ['appealId'],
    handler: (registry, _request, response, params) => {
      const appealId = params.appealId ?? '';

      sendJson(response, 200, {
        appeal_id: appealId,
        cases: registry.jury.listByAppeal(appealId),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/jury\/([^/]+)$/,
    paramNames: ['juryCaseId'],
    handler: (registry, _request, response, params) => {
      const juryCaseId = params.juryCaseId ?? '';
      const juryCase = registry.jury.getCase(juryCaseId);

      if (!juryCase) {
        notFound(response);
        return;
      }

      sendJson(response, 200, { case: juryCase });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/squads$/,
    paramNames: [],
    handler: (registry, _request, response) => {
      sendJson(response, 200, { squads: registry.squads.getAll() });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/squads\/member\/([^/]+)$/,
    paramNames: ['member'],
    handler: (registry, _request, response, params) => {
      const member = params.member ?? '';

      sendJson(response, 200, {
        member,
        squads: registry.squads.getMemberSquads(member),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/squads\/([^/]+)$/,
    paramNames: ['squadId'],
    handler: (registry, _request, response, params) => {
      const squadId = params.squadId ?? '';
      const squad = registry.squads.getSquad(squadId);

      if (!squad) {
        notFound(response);
        return;
      }

      sendJson(response, 200, { squad });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/profiles$/,
    paramNames: [],
    handler: (registry, _request, response) => {
      sendJson(response, 200, { profiles: registry.profiles.getAll() });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/profiles\/public$/,
    paramNames: [],
    handler: (registry, request, response) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const limit = Number(url.searchParams.get('limit') ?? '50');

      sendJson(response, 200, {
        profiles: registry.profiles.listPublic(
          Number.isFinite(limit) ? limit : 50
        ),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/profiles\/owner\/([^/]+)$/,
    paramNames: ['owner'],
    handler: (registry, _request, response, params) => {
      const owner = params.owner ?? '';
      const profile = registry.profiles.getByOwner(owner);

      if (!profile) {
        notFound(response);
        return;
      }

      sendJson(response, 200, { profile });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/profiles\/([^/]+)$/,
    paramNames: ['profileId'],
    handler: (registry, _request, response, params) => {
      const profileId = params.profileId ?? '';
      const profile = registry.profiles.getProfile(profileId);

      if (!profile) {
        notFound(response);
        return;
      }

      sendJson(response, 200, { profile });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/channels$/,
    paramNames: [],
    handler: (registry, _request, response) => {
      sendJson(response, 200, { channels: registry.channels.getAll() });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/channels\/public$/,
    paramNames: [],
    handler: (registry, request, response) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const limit = Number(url.searchParams.get('limit') ?? '50');

      sendJson(response, 200, {
        channels: registry.channels.listPublic(
          Number.isFinite(limit) ? limit : 50
        ),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/channels\/verified$/,
    paramNames: [],
    handler: (registry, request, response) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const limit = Number(url.searchParams.get('limit') ?? '50');

      sendJson(response, 200, {
        channels: registry.channels.listVerified(
          Number.isFinite(limit) ? limit : 50
        ),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/channels\/owner\/([^/]+)$/,
    paramNames: ['owner'],
    handler: (registry, _request, response, params) => {
      const owner = params.owner ?? '';

      sendJson(response, 200, {
        owner,
        channels: registry.channels.getOwnerChannels(owner),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/channels\/([^/]+)$/,
    paramNames: ['channelId'],
    handler: (registry, _request, response, params) => {
      const channelId = params.channelId ?? '';
      const channel = registry.channels.getChannel(channelId);

      if (!channel) {
        notFound(response);
        return;
      }

      sendJson(response, 200, { channel });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/moderation$/,
    paramNames: [],
    handler: (registry, _request, response) => {
      sendJson(response, 200, { records: registry.moderation.getAll() });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/moderation\/active$/,
    paramNames: [],
    handler: (registry, request, response) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const limit = Number(url.searchParams.get('limit') ?? '50');

      sendJson(response, 200, {
        records: registry.moderation.listActive(
          Number.isFinite(limit) ? limit : 50
        ),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/moderation\/passport\/([^/]+)$/,
    paramNames: ['passportId'],
    handler: (registry, _request, response, params) => {
      const passportId = params.passportId ?? '';

      sendJson(response, 200, {
        passport_id: passportId,
        records: registry.moderation.listByPassport(passportId),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/moderation\/target\/([^/]+)$/,
    paramNames: ['targetOwner'],
    handler: (registry, _request, response, params) => {
      const targetOwner = params.targetOwner ?? '';

      sendJson(response, 200, {
        target_owner: targetOwner,
        records: registry.moderation.listByTarget(targetOwner),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/moderation\/([^/]+)$/,
    paramNames: ['recordId'],
    handler: (registry, _request, response, params) => {
      const recordId = params.recordId ?? '';
      const record = registry.moderation.getRecord(recordId);

      if (!record) {
        notFound(response);
        return;
      }

      sendJson(response, 200, { record });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/badges\/history$/,
    paramNames: [],
    handler: (registry, _request, response) => {
      sendJson(response, 200, { entries: registry.badgeHistory.getAll() });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/badges\/history\/owner\/([^/]+)$/,
    paramNames: ['owner'],
    handler: (registry, request, response, params) => {
      const owner = params.owner ?? '';
      const url = new URL(request.url ?? '/', 'http://localhost');
      const limit = Number(url.searchParams.get('limit') ?? '50');

      sendJson(response, 200, {
        owner,
        entries: registry.badgeHistory.listByOwner(
          owner,
          Number.isFinite(limit) ? limit : 50
        ),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/badges\/history\/([^/]+)$/,
    paramNames: ['entryId'],
    handler: (registry, _request, response, params) => {
      const entryId = params.entryId ?? '';
      const entry = registry.badgeHistory.getEntry(entryId);

      if (!entry) {
        notFound(response);
        return;
      }

      sendJson(response, 200, { entry });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/boosts\/history$/,
    paramNames: [],
    handler: (registry, _request, response) => {
      sendJson(response, 200, { entries: registry.boostHistory.getAll() });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/boosts\/history\/owner\/([^/]+)$/,
    paramNames: ['owner'],
    handler: (registry, request, response, params) => {
      const owner = params.owner ?? '';
      const url = new URL(request.url ?? '/', 'http://localhost');
      const limit = Number(url.searchParams.get('limit') ?? '50');

      sendJson(response, 200, {
        owner,
        entries: registry.boostHistory.listByOwner(
          owner,
          Number.isFinite(limit) ? limit : 50
        ),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/boosts\/history\/channel\/([^/]+)$/,
    paramNames: ['channelId'],
    handler: (registry, request, response, params) => {
      const channelId = params.channelId ?? '';
      const url = new URL(request.url ?? '/', 'http://localhost');
      const limit = Number(url.searchParams.get('limit') ?? '50');

      sendJson(response, 200, {
        channel_id: channelId,
        entries: registry.boostHistory.listByChannel(
          channelId,
          Number.isFinite(limit) ? limit : 50
        ),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/boosts\/history\/([^/]+)$/,
    paramNames: ['entryId'],
    handler: (registry, _request, response, params) => {
      const entryId = params.entryId ?? '';
      const entry = registry.boostHistory.getEntry(entryId);

      if (!entry) {
        notFound(response);
        return;
      }

      sendJson(response, 200, { entry });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/channel-access$/,
    paramNames: [],
    handler: (registry, _request, response) => {
      sendJson(response, 200, { policies: registry.channelAccess.getAll() });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/channel-access\/owner\/([^/]+)$/,
    paramNames: ['owner'],
    handler: (registry, _request, response, params) => {
      const owner = params.owner ?? '';

      sendJson(response, 200, {
        owner,
        policies: registry.channelAccess.getOwnerPolicies(owner),
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/channel-access\/channel\/([^/]+)$/,
    paramNames: ['channelId'],
    handler: (registry, _request, response, params) => {
      const channelId = params.channelId ?? '';
      const policy = registry.channelAccess.getPolicy(channelId);

      if (!policy) {
        notFound(response);
        return;
      }

      sendJson(response, 200, { policy });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/discovery\/channels$/,
    paramNames: [],
    handler: (registry, request, response) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const limit = Number(url.searchParams.get('limit') ?? '50');
      const weekId = url.searchParams.get('weekId');
      const category = url.searchParams.get('category');
      const parsedWeekId =
        weekId !== null && weekId.trim() !== '' ? Number(weekId) : undefined;

      const rankingOptions: { limit?: number; weekId?: number; category?: string } = {
        limit: Number.isFinite(limit) ? limit : 50,
      };

      if (typeof parsedWeekId === 'number' && Number.isFinite(parsedWeekId)) {
        rankingOptions.weekId = parsedWeekId;
      }

      if (category) {
        rankingOptions.category = category;
      }

      const result = buildChannelDiscoveryRankings(registry, rankingOptions);

      sendJson(response, 200, result);
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/discovery\/categories$/,
    paramNames: [],
    handler: (_registry, _request, response) => {
      sendJson(response, 200, { categories: listDiscoveryChannelCategories() });
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/ops\/launch-summary$/,
    paramNames: [],
    handler: async (registry, _request, response) => {
      const summary = await buildLaunchOpsSummary(registry);
      sendJson(response, 200, summary);
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/discovery\/guilds$/,
    paramNames: [],
    handler: (registry, request, response) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const limit = Number(url.searchParams.get('limit') ?? '50');

      const result = buildGuildDiscoveryRankings(registry, {
        limit: Number.isFinite(limit) ? limit : 50,
      });

      sendJson(response, 200, result);
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/payments\/membership\/config$/,
    paramNames: [],
    handler: (_registry, request, response) => handlePaymentConfigGet(request, response),
  },
  {
    method: 'POST',
    pattern: /^\/api\/payments\/membership\/intents$/,
    paramNames: [],
    handler: (_registry, request, response) => handlePaymentIntentCreate(request, response),
  },
  {
    method: 'GET',
    pattern: /^\/api\/payments\/membership\/intents\/([^/]+)$/,
    paramNames: ['paymentId'],
    handler: (_registry, request, response, params) =>
      handlePaymentIntentGet(request, response, params.paymentId ?? ''),
  },
  {
    method: 'POST',
    pattern: /^\/api\/payments\/membership\/intents\/([^/]+)\/mock\/confirm$/,
    paramNames: ['paymentId'],
    handler: (_registry, request, response, params) =>
      handlePaymentIntentMockConfirm(request, response, params.paymentId ?? ''),
  },
  {
    method: 'POST',
    pattern: /^\/api\/payments\/membership\/intents\/([^/]+)\/crypto\/confirm$/,
    paramNames: ['paymentId'],
    handler: (_registry, request, response, params) =>
      handlePaymentIntentCryptoConfirm(request, response, params.paymentId ?? ''),
  },
  {
    method: 'POST',
    pattern: /^\/api\/payments\/webhooks\/stripe$/,
    paramNames: [],
    handler: (_registry, request, response) => handleStripeWebhookPost(request, response),
  },
  {
    method: 'POST',
    pattern: /^\/api\/payments\/webhooks\/paypal$/,
    paramNames: [],
    handler: (_registry, request, response) => handlePayPalWebhookPost(request, response),
  },
  {
    method: 'GET',
    pattern: /^\/api\/memberships\/subscriptions\/owner\/([^/]+)$/,
    paramNames: ['owner'],
    handler: (_registry, request, response, params) =>
      handleMembershipSubscriptionGet(request, response, params.owner ?? ''),
  },
  {
    method: 'POST',
    pattern: /^\/api\/memberships\/subscriptions\/sync$/,
    paramNames: [],
    handler: (_registry, request, response) => handleMembershipSubscriptionSync(request, response),
  },
  {
    method: 'GET',
    pattern: /^\/api\/member-preferences\/owner\/([^/]+)$/,
    paramNames: ['owner'],
    handler: (_registry, request, response, params) =>
      handleMemberPreferencesGet(request, response, params.owner ?? ''),
  },
  {
    method: 'POST',
    pattern: /^\/api\/member-preferences\/sync$/,
    paramNames: [],
    handler: (_registry, request, response) => handleMemberPreferencesUpsert(request, response),
  },
  {
    method: 'POST',
    pattern: /^\/api\/media\/avatar$/,
    paramNames: [],
    handler: (_registry, request, response) => handleAvatarUploadPost(request, response),
  },
  {
    method: 'GET',
    pattern: /^\/api\/media\/files\/([^/]+)\/([^/]+)$/,
    paramNames: ['owner', 'filename'],
    handler: (_registry, request, response, params) =>
      handleMediaFileGet(request, response, params.owner ?? '', params.filename ?? ''),
  },
  {
    method: 'POST',
    pattern: /^\/api\/media\/channel-cover$/,
    paramNames: [],
    handler: (_registry, request, response) => handleChannelCoverUploadPost(request, response),
  },
  {
    method: 'POST',
    pattern: /^\/api\/media\/studio-logo$/,
    paramNames: [],
    handler: (_registry, request, response) => handleStudioLogoUploadPost(request, response),
  },
  {
    method: 'GET',
    pattern: /^\/api\/studio-preferences\/([^/]+)$/,
    paramNames: ['studioId'],
    handler: (_registry, request, response, params) =>
      handleStudioPreferencesGet(request, response, params.studioId ?? ''),
  },
  {
    method: 'POST',
    pattern: /^\/api\/studio-preferences\/sync$/,
    paramNames: [],
    handler: (_registry, request, response) => handleStudioPreferencesUpsert(request, response),
  },
  {
    method: 'GET',
    pattern: /^\/api\/channel-preferences\/([^/]+)$/,
    paramNames: ['channelId'],
    handler: (_registry, request, response, params) =>
      handleChannelPreferencesGet(request, response, params.channelId ?? ''),
  },
  {
    method: 'POST',
    pattern: /^\/api\/channel-preferences\/sync$/,
    paramNames: [],
    handler: (_registry, request, response) => handleChannelPreferencesUpsert(request, response),
  },
  {
    method: 'GET',
    pattern: /^\/api\/memberships\/fulfillment\/pending$/,
    paramNames: [],
    handler: (_registry, request, response) => handleMembershipFulfillmentPendingGet(request, response),
  },
  {
    method: 'GET',
    pattern: /^\/api\/memberships\/fulfillment\/owner\/([^/]+)$/,
    paramNames: ['owner'],
    handler: (_registry, request, response, params) =>
      handleMembershipFulfillmentOwnerGet(request, response, params.owner ?? ''),
  },
  {
    method: 'POST',
    pattern: /^\/api\/memberships\/fulfillment\/([^/]+)\/complete$/,
    paramNames: ['fulfillmentId'],
    handler: (_registry, request, response, params) =>
      handleMembershipFulfillmentComplete(request, response, params.fulfillmentId ?? ''),
  },
  {
    method: 'OPTIONS',
    pattern: /^\/api\/officials\/submissions$/,
    paramNames: [],
    handler: (_registry, request, response) => handleOfficialsSubmissionsOptions(request, response),
  },
  {
    method: 'GET',
    pattern: /^\/api\/officials\/submissions$/,
    paramNames: [],
    handler: (_registry, request, response) => handleOfficialsSubmissionsGet(request, response),
  },
  {
    method: 'POST',
    pattern: /^\/api\/officials\/submissions\/sync$/,
    paramNames: [],
    handler: (_registry, request, response) => handleOfficialsSubmissionsSync(request, response),
  },
  {
    method: 'OPTIONS',
    pattern: /^\/api\/platform\/owner-assets$/,
    paramNames: [],
    handler: (_registry, request, response) => handlePlatformOwnerAssetsOptions(request, response),
  },
  {
    method: 'GET',
    pattern: /^\/api\/platform\/owner-assets$/,
    paramNames: [],
    handler: (_registry, request, response) => handlePlatformOwnerAssetsGet(request, response),
  },
  {
    method: 'POST',
    pattern: /^\/api\/platform\/owner-assets\/sync$/,
    paramNames: [],
    handler: (_registry, request, response) => handlePlatformOwnerAssetsSync(request, response),
  },
  {
    method: 'OPTIONS',
    pattern: /^\/api\/global-chats\/([^/]+)\/messages$/,
    paramNames: ['roomId'],
    handler: (_registry, request, response) => handleGlobalChatMessagesOptions(request, response),
  },
  {
    method: 'GET',
    pattern: /^\/api\/global-chats\/([^/]+)\/messages$/,
    paramNames: ['roomId'],
    handler: (_registry, request, response, params) =>
      handleGlobalChatMessagesGet(request, response, params.roomId ?? ''),
  },
  {
    method: 'POST',
    pattern: /^\/api\/global-chats\/([^/]+)\/messages$/,
    paramNames: ['roomId'],
    handler: (_registry, request, response, params) =>
      handleGlobalChatMessagesPost(request, response, params.roomId ?? ''),
  },
  {
    method: 'OPTIONS',
    pattern: /^\/api\/chats\/favorites$/,
    paramNames: [],
    handler: (_registry, request, response) => handleChatFavoritesOptions(request, response),
  },
  {
    method: 'GET',
    pattern: /^\/api\/chats\/favorites$/,
    paramNames: [],
    handler: (_registry, request, response) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const owner = url.searchParams.get('owner') ?? '';
      const memberId = url.searchParams.get('memberId') ?? '';

      return handleChatFavoritesGet(request, response, owner, memberId);
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/chats\/favorites$/,
    paramNames: [],
    handler: (_registry, request, response) => handleChatFavoritesUpsert(request, response),
  },
  {
    method: 'GET',
    pattern: /^\/api\/chats\/unread$/,
    paramNames: [],
    handler: (_registry, request, response) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const owner = url.searchParams.get('owner') ?? '';
      const memberId = url.searchParams.get('memberId') ?? '';
      const roomIdsParam = url.searchParams.get('roomIds') ?? '';
      const roomIds = roomIdsParam
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

      return handleChatUnreadGet(request, response, owner, memberId, roomIds);
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/chats\/rooms\/([^/]+)\/read$/,
    paramNames: ['roomId'],
    handler: (_registry, request, response, params) =>
      handleChatRoomRead(request, response, params.roomId ?? ''),
  },
];

function matchRoute(
  method: string,
  pathname: string
): { route: Route; params: Record<string, string> } | null {
  for (const route of routes) {
    if (!routeMethods(route.method).includes(method as HttpMethod)) {
      continue;
    }

    const match = pathname.match(route.pattern);

    if (!match) {
      continue;
    }

    const params: Record<string, string> = {};

    route.paramNames.forEach((name, index) => {
      params[name] = decodeURIComponent(match[index + 1] ?? '');
    });

    return { route, params };
  }

  return null;
}

export function startReadOnlyServer(
  registry: ProjectionRegistry,
  runtime: IndexerRuntime
): void {
  const server = createServer((request, response) => {
    void (async () => {
      const method = request.method ?? 'GET';

      if (method === 'OPTIONS') {
        await handlePaymentOptions(request, response);
        return;
      }

      if (method !== 'GET' && method !== 'POST') {
        sendJson(response, 405, { error: 'method_not_allowed' });
        return;
      }

      const url = new URL(request.url ?? '/', 'http://localhost');
      const matched = matchRoute(method, url.pathname);

      if (!matched) {
        notFound(response);
        return;
      }

      await matched.route.handler(
        registry,
        request,
        response,
        matched.params,
        runtime
      );
    })().catch((error) => {
      console.error('[nami-http] request failed');
      console.error(error);
      sendJson(response, 500, { error: 'internal_error' });
    });
  });

  server.listen(config.httpPort, '0.0.0.0', () => {
    console.log(`[nami-http] read-only API listening on http://0.0.0.0:${config.httpPort}`);
    console.log('[nami-http] routes: /health, /ready, /stats, /api/payments/*, /api/memberships/*, /api/member-preferences/*, /api/media/*, /api/guilds/*, /api/squads/*, /api/recovery/*, /api/appeals/*, /api/jury/*, /api/passports/*, /api/profiles/*, /api/channels/*, /api/channel-access/*, /api/moderation/*, /api/badges/history/*, /api/boosts/history/*');
  });
}