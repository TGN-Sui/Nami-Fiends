import { readIndexerUrl } from './protocol-env.js';

export type NodenameLookup = {
  nodename: string;
  registered: boolean;
  identityId: string | null;
  owner: string | null;
  memberProofStatus: string | null;
  linkedProfile?: unknown;
};

async function nodenameFetch<T>(path: string): Promise<T | null> {
  const base = readIndexerUrl();

  if (!base) {
    return null;
  }

  const response = await fetch(base + path, {
    headers: { 'content-type': 'application/json' },
  });

  if (response.status === 404) {
    return null;
  }

  const payload = (await response.json()) as T & { message?: string; error?: string };

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? 'Nodename lookup failed.');
  }

  return payload;
}

export async function fetchNodenameLookup(
  nodename: string,
  options: { includeLinkedProfile?: boolean } = {}
): Promise<NodenameLookup | null> {
  const normalized = nodename.trim().toLowerCase().replace(/^@+/, '');

  if (!normalized.startsWith('fiend')) {
    return null;
  }

  const query = options.includeLinkedProfile ? '?includeLinkedProfile=true' : '';
  const payload = await nodenameFetch<{ lookup: NodenameLookup }>(
    '/api/nami/nodename/' + encodeURIComponent(normalized) + query
  );

  return payload?.lookup ?? null;
}