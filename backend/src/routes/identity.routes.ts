import type { IncomingMessage, ServerResponse } from 'node:http';

import type { ProjectionRegistry } from '../projection-registry.js';

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  const payload = `${JSON.stringify(body, null, 2)}\n`;

  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
  });
  response.end(payload);
}

export function handleIdentityOptions(
  _request: IncomingMessage,
  response: ServerResponse
): void {
  sendJson(response, 204, {});
}

export function handleIdentityListGet(
  registry: ProjectionRegistry,
  request: IncomingMessage,
  response: ServerResponse
): void {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const limit = Number(url.searchParams.get('limit') ?? '50');
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 50;
  const identities = registry.identities.list(safeLimit);

  sendJson(response, 200, {
    identities,
    count: identities.length,
  });
}

export function handleIdentityByOwnerGet(
  registry: ProjectionRegistry,
  _request: IncomingMessage,
  response: ServerResponse,
  owner: string
): void {
  const identity = registry.identities.getByOwner(decodeURIComponent(owner));

  if (!identity) {
    sendJson(response, 404, { error: 'not_found' });
    return;
  }

  sendJson(response, 200, { identity });
}