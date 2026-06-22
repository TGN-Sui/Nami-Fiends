import { useSyncExternalStore } from 'react';

export type GroupDisplayPhotoKind = 'guild' | 'squad';

const STORAGE_PREFIX: Record<GroupDisplayPhotoKind, string> = {
  guild: 'nami.guild.display-photo.',
  squad: 'nami.squad.display-photo.',
};

let photoVersion = 0;

function storageKey(kind: GroupDisplayPhotoKind, groupId: string): string {
  return STORAGE_PREFIX[kind] + groupId;
}

function dispatchPhotoChange(): void {
  photoVersion += 1;
  window.dispatchEvent(new CustomEvent('nami-group-display-photo-changed'));
}

export function readGroupDisplayPhoto(kind: GroupDisplayPhotoKind, groupId: string): string | null {
  try {
    const stored = window.localStorage.getItem(storageKey(kind, groupId));

    if (!stored || stored.trim() === '') {
      return null;
    }

    return stored;
  } catch {
    return null;
  }
}

export function saveGroupDisplayPhoto(
  kind: GroupDisplayPhotoKind,
  groupId: string,
  dataUrl: string
): void {
  window.localStorage.setItem(storageKey(kind, groupId), dataUrl);
  dispatchPhotoChange();
}

export function clearGroupDisplayPhoto(kind: GroupDisplayPhotoKind, groupId: string): void {
  window.localStorage.removeItem(storageKey(kind, groupId));
  dispatchPhotoChange();
}

export function resolveGroupDisplayPhotoUrl(
  kind: GroupDisplayPhotoKind,
  groupId: string
): string | undefined {
  const stored = readGroupDisplayPhoto(kind, groupId);

  return stored ?? undefined;
}

function subscribeGroupDisplayPhotos(onStoreChange: () => void): () => void {
  function handleChange(): void {
    onStoreChange();
  }

  window.addEventListener('nami-group-display-photo-changed', handleChange);

  return () => {
    window.removeEventListener('nami-group-display-photo-changed', handleChange);
  };
}

function getPhotoVersionSnapshot(): number {
  return photoVersion;
}

export function useGroupDisplayPhotoVersion(): number {
  return useSyncExternalStore(subscribeGroupDisplayPhotos, getPhotoVersionSnapshot, () => 0);
}

export function resetGroupDisplayPhotoStoreForTests(): void {
  for (const kind of Object.keys(STORAGE_PREFIX) as GroupDisplayPhotoKind[]) {
    const prefix = STORAGE_PREFIX[kind];

    try {
      const keysToRemove: string[] = [];

      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);

        if (key?.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore restricted storage environments.
    }
  }

  photoVersion = 0;
}