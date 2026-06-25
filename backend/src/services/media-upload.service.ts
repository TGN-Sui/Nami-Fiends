import { readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { mkdir } from 'node:fs/promises';

import { config } from '../config.js';
import { paymentConfig } from '../payment-config.js';

const UPLOAD_ROOT = 'data/uploads';
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_CHANNEL_COVER_BYTES = 4 * 1024 * 1024;
const MAX_STUDIO_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_PLATFORM_OWNER_ASSET_BYTES = 2 * 1024 * 1024;
const MAX_PLATFORM_OWNER_SCENE_BYTES = 48 * 1024 * 1024;
const MAX_BORDER_ART_BYTES = 2 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

function normalizeOwner(owner: string): string {
  return owner.trim().toLowerCase();
}

function ownerUploadDir(owner: string): string {
  return join(UPLOAD_ROOT, normalizeOwner(owner));
}

function safeChannelId(channelId: string): string {
  return channelId.replace(/[^a-zA-Z0-9._-]/g, '');
}

function safeStudioId(studioId: string): string {
  return studioId.replace(/[^a-zA-Z0-9._-]/g, '');
}

function safePlatformAssetSlotId(slotId: string): string {
  return slotId.replace(/[^a-zA-Z0-9._-]/g, '');
}

function safeBorderRewardId(rewardId: string): string {
  return rewardId.replace(/[^a-zA-Z0-9._-]/g, '');
}

export function buildMediaPublicUrl(owner: string, filename: string): string {
  const base =
    config.publicApiUrl !== ''
      ? config.publicApiUrl
      : 'http://127.0.0.1:' + paymentConfig.httpPort;
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

export type ChannelCoverUploadInput = {
  owner: string;
  channelId: string;
  contentType: string;
  dataBase64: string;
};

export async function saveChannelCoverUpload(
  input: ChannelCoverUploadInput
): Promise<{ url: string; filename: string }> {
  if (!input.owner.startsWith('0x') || !input.channelId.trim()) {
    throw new Error('invalid_payload');
  }

  const extension = MIME_EXTENSIONS[input.contentType];

  if (!extension) {
    throw new Error('unsupported_content_type');
  }

  const buffer = Buffer.from(input.dataBase64, 'base64');

  if (buffer.byteLength === 0 || buffer.byteLength > MAX_CHANNEL_COVER_BYTES) {
    throw new Error('invalid_file_size');
  }

  const owner = normalizeOwner(input.owner);
  const dir = ownerUploadDir(owner);
  await mkdir(dir, { recursive: true });

  const filename = 'cover-' + safeChannelId(input.channelId) + '-' + randomUUID() + extension;
  const filePath = join(dir, filename);

  await writeFile(filePath, buffer);

  return {
    filename,
    url: buildMediaPublicUrl(owner, filename),
  };
}

export type StudioLogoUploadInput = {
  owner: string;
  studioId: string;
  contentType: string;
  dataBase64: string;
};

export async function saveStudioLogoUpload(
  input: StudioLogoUploadInput
): Promise<{ url: string; filename: string }> {
  if (!input.owner.startsWith('0x') || !input.studioId.trim()) {
    throw new Error('invalid_payload');
  }

  const extension = MIME_EXTENSIONS[input.contentType];

  if (!extension) {
    throw new Error('unsupported_content_type');
  }

  const buffer = Buffer.from(input.dataBase64, 'base64');

  if (buffer.byteLength === 0 || buffer.byteLength > MAX_STUDIO_LOGO_BYTES) {
    throw new Error('invalid_file_size');
  }

  const owner = normalizeOwner(input.owner);
  const dir = ownerUploadDir(owner);
  await mkdir(dir, { recursive: true });

  const filename = 'studio-' + safeStudioId(input.studioId) + '-' + randomUUID() + extension;
  const filePath = join(dir, filename);

  await writeFile(filePath, buffer);

  return {
    filename,
    url: buildMediaPublicUrl(owner, filename),
  };
}

export type PlatformOwnerAssetUploadInput = {
  owner: string;
  slotId: string;
  contentType: string;
  dataBase64: string;
  maxBytes?: number;
};

export async function savePlatformOwnerAssetUpload(
  input: PlatformOwnerAssetUploadInput
): Promise<{ url: string; filename: string }> {
  if (!input.owner.startsWith('0x') || !input.slotId.trim()) {
    throw new Error('invalid_payload');
  }

  const extension = MIME_EXTENSIONS[input.contentType];

  if (!extension) {
    throw new Error('unsupported_content_type');
  }

  const buffer = Buffer.from(input.dataBase64, 'base64');
  const maxBytes = input.maxBytes ?? MAX_PLATFORM_OWNER_ASSET_BYTES;

  if (buffer.byteLength === 0 || buffer.byteLength > maxBytes) {
    throw new Error('invalid_file_size');
  }

  const owner = normalizeOwner(input.owner);
  const dir = ownerUploadDir(owner);
  await mkdir(dir, { recursive: true });

  const filename =
    'platform-asset-' + safePlatformAssetSlotId(input.slotId) + '-' + randomUUID() + extension;
  const filePath = join(dir, filename);

  await writeFile(filePath, buffer);

  return {
    filename,
    url: buildMediaPublicUrl(owner, filename),
  };
}

export type BorderArtUploadInput = {
  owner: string;
  rewardId: string;
  artKind: 'static' | 'animated';
  contentType: string;
  dataBase64: string;
};

export async function saveBorderArtUpload(
  input: BorderArtUploadInput
): Promise<{ url: string; filename: string }> {
  if (!input.owner.startsWith('0x') || !input.rewardId.trim()) {
    throw new Error('invalid_payload');
  }

  const extension = MIME_EXTENSIONS[input.contentType];

  if (!extension) {
    throw new Error('unsupported_content_type');
  }

  const buffer = Buffer.from(input.dataBase64, 'base64');

  if (buffer.byteLength === 0 || buffer.byteLength > MAX_BORDER_ART_BYTES) {
    throw new Error('invalid_file_size');
  }

  const owner = normalizeOwner(input.owner);
  const dir = ownerUploadDir(owner);
  await mkdir(dir, { recursive: true });

  const filename =
    'border-art-' +
    safeBorderRewardId(input.rewardId) +
    '-' +
    input.artKind +
    '-' +
    randomUUID() +
    extension;
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
            : extension === '.gif'
              ? 'image/gif'
              : extension === '.mp4'
                ? 'video/mp4'
                : extension === '.webm'
                  ? 'video/webm'
                  : 'application/octet-stream';

    return { buffer, contentType };
  } catch {
    return null;
  }
}