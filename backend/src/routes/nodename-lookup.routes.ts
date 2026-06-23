import type { IncomingMessage, ServerResponse } from 'node:http';

import type { ProjectionRegistry } from '../projection-registry.js';
import {
  listIndexedNodenames,
  lookupNodename,
} from '../services/nodename-lookup.service.js';

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

export function handleNodenameLookupOptions(
  _request: IncomingMessage,
  response: ServerResponse
): void {
  sendJson(response, 204, {});
}

export async function handleNodenameListGet(
  registry: ProjectionRegistry,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const limit = Number(url.searchParams.get('limit') ?? '50');
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 50;

  sendJson(response, 200, {
    nodenames: listIndexedNodenames(registry, safeLimit),
    count: listIndexedNodenames(registry, safeLimit).length,
  });
}

export async function handleNodenameLookupGet(
  registry: ProjectionRegistry,
  request: IncomingMessage,
  response: ServerResponse,
  nodename: string
): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const includeLinkedProfile = url.searchParams.get('includeLinkedProfile') === 'true';

  const lookup = await lookupNodename(registry, decodeURIComponent(nodename), {
    includeLinkedProfile,
  });

  if (!lookup) {
    sendJson(response, 400, { error: 'invalid_nodename' });
    return;
  }

  if (!lookup.registered) {
    sendJson(response, 404, { error: 'not_found', lookup });
    return;
  }

  sendJson(response, 200, { lookup });
}