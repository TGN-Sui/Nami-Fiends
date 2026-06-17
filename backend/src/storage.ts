import { createReadStream } from 'node:fs';
import { mkdir, readFile, stat, writeFile, appendFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { dirname } from 'node:path';

/**
 * Storage layer — deliberately simple and file-based for Phase 2 MVP.
 *
 * Architectural decisions (clean, no patch accumulation):
 * - Raw event log (events.jsonl) is IMMUTABLE append-only source of truth.
 *   Never rewrite it. Used for replay, audit, and future migration.
 * - Projections are derived views persisted as JSON. They can be
 *   rebuilt from the raw log at any time.
 * - Cursors are lightweight per-module progress.
 *
 * New projection helpers replace any future ad-hoc file logic.
 * All paths go through ensureParentDir. No duplication of I/O concerns.
 */

export interface StoredCursor {
  txDigest: string;
  eventSeq: string;
}

export type CursorStore = Record<string, StoredCursor | null>;

async function ensureParentDir(path: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
}

// ---------------------------------------------------------------------------
// Generic JSON + line helpers (existing, now documented for the architecture)
// ---------------------------------------------------------------------------

export async function readJsonFile<T>(path: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw) as T;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === 'ENOENT') {
      return fallback;
    }

    throw error;
  }
}

export async function writeJsonFile<T>(path: string, data: T): Promise<void> {
  await ensureParentDir(path);
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function appendJsonLine(path: string, data: unknown): Promise<void> {
  await ensureParentDir(path);
  await appendFile(path, `${JSON.stringify(data)}\n`, 'utf8');
}

export async function readJsonLines<T>(path: string): Promise<T[]> {
  const rows: T[] = [];

  try {
    const stream = createReadStream(path, { encoding: 'utf8' });
    const lines = createInterface({ input: stream, crlfDelay: Infinity });

    for await (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.length === 0) {
        continue;
      }

      rows.push(JSON.parse(trimmed) as T);
    }
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === 'ENOENT') {
      return [];
    }

    throw error;
  }

  return rows;
}

export async function getFileSizeBytes(path: string): Promise<number | null> {
  try {
    const file = await stat(path);
    return file.size;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

// ---------------------------------------------------------------------------
// Projection helpers (new for clean Phase 2)
// Projections are the "app-ready views" (guilds, timelines, etc.).
// These functions make future services trivial and prevent scattered file code.
// ---------------------------------------------------------------------------

export async function readProjection<T>(path: string, fallback: T): Promise<T> {
  return readJsonFile<T>(path, fallback);
}

export async function writeProjection<T>(path: string, data: T): Promise<void> {
  // Overwrite is intentional for projections (they are derived state).
  await writeJsonFile(path, data);
}

/**
 * Atomic-ish update helper for projections.
 * In a real system we would use a lock or write-ahead, but for concise MVP
 * this + the immutable event log gives us replay safety.
 */
export async function updateProjection<T>(
  path: string,
  updater: (current: T) => T,
  fallback: T
): Promise<T> {
  const current = await readProjection<T>(path, fallback);
  const next = updater(current);
  await writeProjection(path, next);
  return next;
}