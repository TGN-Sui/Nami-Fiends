import type { IncomingMessage, ServerResponse } from 'node:http';

import { config } from '../config.js';
import { buildWalletAuthProbe } from '../services/wallet-auth-probe.service.js';

type JsonRecord = Record<string, unknown>;

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

export function handleWalletAuthProbeOptions(
  _request: IncomingMessage,
  response: ServerResponse
): void {
  sendJson(response, 204, {});
}

export async function handleWalletAuthProbePost(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  if (!config.testLaunch) {
    sendJson(response, 404, { error: 'not_found' });
    return;
  }

  const body = await readJsonBody(request);
  const probe = await buildWalletAuthProbe(body);
  sendJson(response, 200, probe);
}