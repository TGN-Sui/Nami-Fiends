import { readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { mkdir } from 'node:fs/promises';

import { paymentConfig } from '../payment-config.js';

const UPLOAD_ROOT = 'data/uploads';
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

function normalizeOwner(owner: string): string {
  return owner.trim().toLowerCase();
}

function ownerUploadDir(owner: string): string {
  return join(UPLOAD_ROOT, normalizeOwner(owner));
}

export function buildMediaPublicUrl(owner: string, filename: string): string {
  const base = 'http://127.0.0.1:' + paymentConfig.httpPort;
  return (
    base +
    '/api/media/files/' +
    encodeURIComponent(normalizeOwner(owner)) +
    '/' +
    encodeURIComponent(filename)
  );
}

export type AvatarUploadInput = {
  owner: string;
  contentType: string;
  dataBase64: string;
};

export async function saveAvatarUpload(input: AvatarUploadInput): Promise<{ url: string; filename: string }> {
  if (!input.owner.startsWith('0x')) {
    throw new Error('invalid_owner');
  }

  const extension = MIME_EXTENSIONS[input.contentType];

  if (!extension) {
    throw new Error('unsupported_content_type');
  }

  const buffer = Buffer.from(input.dataBase64, 'base64');

  if (buffer.byteLength === 0 || buffer.byteLength > MAX_AVATAR_BYTES) {
    throw new Error('invalid_file_size');
  }

  const owner = normalizeOwner(input.owner);
  const dir = ownerUploadDir(owner);
  await mkdir(dir, { recursive: true });

  const filename = 'avatar-' + randomUUID() + extension;
  const filePath = join(dir, filename);

  await writeFile(filePath, buffer);

  return {
    filename,
    url: buildMediaPublicUrl(owner, filename),
  };
}

export async function readUploadedMediaFile(owner: string, filename: string): Promise<{
  buffer: Buffer;
  contentType: string;
} | null> {
  const safeOwner = normalizeOwner(owner);
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '');

  if (!safeName || safeName !== filename) {
    return null;
  }

  const filePath = join(ownerUploadDir(safeOwner), safeName);

  try {
    const buffer = await readFile(filePath);
    const extension = extname(safeName).toLowerCase();
    const contentType =
      extension === '.png'
        ? 'image/png'
        : extension === '.jpg' || extension === '.jpeg'
          ? 'image/jpeg'
          : extension === '.webp'
            ? 'image/webp'
            : 'application/octet-stream';

    return { buffer, contentType };
  } catch {
    return null;
  }
}