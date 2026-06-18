import { uploadChannelCoverToBackend } from './channel-preferences-api.js';
import { uploadAvatarToBackend } from './member-preferences-api.js';
import { uploadStudioLogoToBackend } from './studio-preferences-api.js';

export const MEDIA_UPLOAD_ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
export const MEDIA_UPLOAD_ACCEPTED_LABEL = 'PNG, JPG, WebP';

export type MediaUploadKind = 'avatar' | 'channel-cover' | 'studio-logo';

const MEDIA_UPLOAD_LIMITS: Record<MediaUploadKind, number> = {
  avatar: 2 * 1024 * 1024,
  'channel-cover': 4 * 1024 * 1024,
  'studio-logo': 2 * 1024 * 1024,
};

const MEDIA_UPLOAD_SIZE_LABELS: Record<MediaUploadKind, string> = {
  avatar: '2 MB',
  'channel-cover': '4 MB',
  'studio-logo': '2 MB',
};

export function validateMediaFile(file: File, kind: MediaUploadKind): string | null {
  if (!MEDIA_UPLOAD_ACCEPTED_TYPES.has(file.type)) {
    return 'Use a PNG, JPG, or WebP image.';
  }

  const maxBytes = MEDIA_UPLOAD_LIMITS[kind];

  if (file.size > maxBytes) {
    return kind === 'channel-cover'
      ? 'Cover image must be ' + MEDIA_UPLOAD_SIZE_LABELS[kind] + ' or smaller.'
      : 'Image must be ' + MEDIA_UPLOAD_SIZE_LABELS[kind] + ' or smaller.';
  }

  return null;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read image.'));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => reject(new Error('Could not read image.'));
    reader.readAsDataURL(file);
  });
}

export function readFileAsBase64(file: File): Promise<string> {
  return readFileAsDataUrl(file).then((dataUrl) => {
    const commaIndex = dataUrl.indexOf(',');

    if (commaIndex < 0) {
      throw new Error('Could not read image.');
    }

    return dataUrl.slice(commaIndex + 1);
  });
}

export async function uploadMediaImage(input: {
  kind: MediaUploadKind;
  owner: string;
  file: File;
  channelId?: string;
  studioId?: string;
}): Promise<{ url: string } | null> {
  const dataBase64 = await readFileAsBase64(input.file);

  if (input.kind === 'avatar') {
    const uploaded = await uploadAvatarToBackend({
      owner: input.owner,
      contentType: input.file.type,
      dataBase64,
    });

    return uploaded ? { url: uploaded.url } : null;
  }

  if (input.kind === 'channel-cover') {
    if (!input.channelId) {
      throw new Error('Channel cover upload requires a channel id.');
    }

    const uploaded = await uploadChannelCoverToBackend({
      owner: input.owner,
      channelId: input.channelId,
      contentType: input.file.type,
      dataBase64,
    });

    return uploaded ? { url: uploaded.url } : null;
  }

  if (!input.studioId) {
    throw new Error('Studio logo upload requires a studio id.');
  }

  const uploaded = await uploadStudioLogoToBackend({
    owner: input.owner,
    studioId: input.studioId,
    contentType: input.file.type,
    dataBase64,
  });

  return uploaded ? { url: uploaded.url } : null;
}

export async function persistMediaImage(input: {
  kind: MediaUploadKind;
  owner: string | null;
  file: File;
  dataUrl: string;
  channelId?: string;
  studioId?: string;
  isApiAvailable: boolean;
  onSaved: (url: string) => void;
  onLocalFallback: (dataUrl: string) => void;
}): Promise<void> {
  if (input.isApiAvailable && input.owner?.startsWith('0x')) {
    const uploadInput = {
      kind: input.kind,
      owner: input.owner,
      file: input.file,
      ...(input.channelId ? { channelId: input.channelId } : {}),
      ...(input.studioId ? { studioId: input.studioId } : {}),
    };

    const uploaded = await uploadMediaImage(uploadInput);

    if (uploaded?.url) {
      input.onSaved(uploaded.url);
      return;
    }
  }

  input.onLocalFallback(input.dataUrl);
}