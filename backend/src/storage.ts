import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export interface StoredCursor {
  txDigest: string;
  eventSeq: string;
}

export type CursorStore = Record<string, StoredCursor | null>;

async function ensureParentDir(path: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
}

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