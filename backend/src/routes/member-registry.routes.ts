import type { IncomingMessage, ServerResponse } from 'node:http';

import { config } from '../config.js';
import { syncRegisteredMemberAccount } from '../services/officials-submissions.service.js';

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  const payload = `${JSON.stringify(body, null, 2)}\n`;

  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
  });
  response.end(payload);
}

async function readJsonBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();

  if (raw.length === 0) {
    return {};
  }

  return JSON.parse(raw) as Record<string, unknown>;
}

export function handleMemberRegistryOptions(
  _request: IncomingMessage,
  response: ServerResponse
): void {
  sendJson(response, 204, {});
}

export async function handleMemberRegistrySync(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  if (!config.testLaunch) {
    sendJson(response, 404, { error: 'not_available' });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const projection = await syncRegisteredMemberAccount(body.account);
    sendJson(response, 200, { submissions: projection });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not sync member registry.';

    if (message === 'invalid_member_account') {
      sendJson(response, 400, { error: message });
      return;
    }

    sendJson(response, 400, {
      error: 'invalid_request',
      message,
    });
  }
}