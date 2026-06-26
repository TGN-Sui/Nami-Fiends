import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  getMemberPreferences,
  upsertMemberPreferences,
  type TutorialStatus,
} from '../services/member-preferences.service.js';
import {
  assertWalletAuthFromBody,
} from '../services/wallet-auth.service.js';

type JsonRecord = Record<string, unknown>;

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  const payload = `${JSON.stringify(body, null, 2)}\n`;

  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
  });
  response.end(payload);
}

async function readJsonBody(request: IncomingMessage): Promise<JsonRecord> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();

  if (raw.length === 0) {
    return {};
  }

  return JSON.parse(raw) as JsonRecord;
}

export async function handleMemberPreferencesGet(
  _request: IncomingMessage,
  response: ServerResponse,
  owner: string
): Promise<void> {
  const preferences = await getMemberPreferences(owner);

  sendJson(response, 200, {
    preferences: preferences ?? {
      owner: owner.trim().toLowerCase(),
      avatarUrl: null,
      streamingOnline: false,
      hubFirstVisitCompleted: false,
      superBannerSeenIds: [],
      tutorialStatus: 'pending',
      tutorialVersion: 0,
      updatedAtMs: Date.now(),
    },
  });
}

export async function handleMemberPreferencesUpsert(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody(request);
    const owner = typeof body.owner === 'string' ? body.owner : '';

    if (!owner.startsWith('0x')) {
      sendJson(response, 400, { error: 'invalid_owner' });
      return;
    }

    await assertWalletAuthFromBody(owner, body);

    const patch: Parameters<typeof upsertMemberPreferences>[0] = { owner };

    if (body.avatarUrl === null) {
      patch.avatarUrl = null;
    } else if (typeof body.avatarUrl === 'string') {
      patch.avatarUrl = body.avatarUrl;
    }

    if (typeof body.streamingOnline === 'boolean') {
      patch.streamingOnline = body.streamingOnline;
    }

    if (typeof body.hubFirstVisitCompleted === 'boolean') {
      patch.hubFirstVisitCompleted = body.hubFirstVisitCompleted;
    }

    if (Array.isArray(body.superBannerSeenIds)) {
      patch.superBannerSeenIds = body.superBannerSeenIds.filter((id) => typeof id === 'string');
    }

    if (typeof body.appendSuperBannerSeenId === 'string') {
      patch.appendSuperBannerSeenId = body.appendSuperBannerSeenId;
    }

    if (
      body.tutorialStatus === 'pending' ||
      body.tutorialStatus === 'completed' ||
      body.tutorialStatus === 'skipped'
    ) {
      patch.tutorialStatus = body.tutorialStatus as TutorialStatus;
    }

    if (typeof body.tutorialVersion === 'number') {
      patch.tutorialVersion = body.tutorialVersion;
    }

    const preferences = await upsertMemberPreferences(patch);

    sendJson(response, 200, { preferences });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'wallet_auth_required' || message === 'wallet_auth_invalid') {
      sendJson(response, 401, { error: message });
      return;
    }

    console.error('[nami-preferences] upsert failed', error);
    sendJson(response, 500, {
      error: 'preferences_upsert_failed',
      message,
    });
  }
}