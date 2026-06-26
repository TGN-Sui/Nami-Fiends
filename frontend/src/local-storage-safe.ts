const PROTECTED_KEYS = new Set([
  'nami.member.session',
  'nami.member.accounts',
  'nami.member.auth-links',
  'nami.member.password-credentials',
  'nami.member.cosmetic-equips',
  'nami.zklogin.session',
  'nami.zklogin.pending',
]);

const PRUNABLE_EXACT_KEYS = new Set([
  'nami.user.message-threads',
  'nami.user.channel-messages',
  'nami.user.global-chat-messages',
  'nami.user.guild-chat-messages',
  'nami.user.goon-activity',
  'nami.arcade.bubble-leaderboard',
  'nami.arcade.bubble-passport-stats',
  'nami.genre-chat.weekly-activity',
  'nami.test-launch.genesis-data-v1',
]);

const PRUNABLE_PREFIXES = [
  'nami.channel.trailer.',
  'nami.channel-media.',
  'nami.group.display-photo.',
  'nami.owner.snapshot.',
] as const;

const LARGE_VALUE_THRESHOLD_BYTES = 48 * 1024;

export function isQuotaExceededError(error: unknown): boolean {
  return error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22);
}

function isProtectedKey(key: string): boolean {
  return PROTECTED_KEYS.has(key);
}

function isPrunableKey(key: string): boolean {
  if (isProtectedKey(key)) {
    return false;
  }

  if (PRUNABLE_EXACT_KEYS.has(key)) {
    return true;
  }

  return PRUNABLE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export function estimateLocalStorageBytes(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  let total = 0;

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key) {
      continue;
    }

    const value = window.localStorage.getItem(key) ?? '';
    total += key.length + value.length;
  }

  return total * 2;
}

export function pruneLocalStorageForQuota(minBytesToFree = 256 * 1024): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const removed: string[] = [];
  let freedChars = 0;

  function removeKey(key: string): void {
    const value = window.localStorage.getItem(key);

    if (value === null) {
      return;
    }

    window.localStorage.removeItem(key);
    removed.push(key);
    freedChars += key.length + value.length;
  }

  for (const key of PRUNABLE_EXACT_KEYS) {
    if (freedChars * 2 >= minBytesToFree) {
      break;
    }

    removeKey(key);
  }

  const largeCandidates: Array<{ key: string; size: number }> = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key || isProtectedKey(key)) {
      continue;
    }

    const value = window.localStorage.getItem(key) ?? '';
    const size = key.length + value.length;

    if (isPrunableKey(key) || size >= LARGE_VALUE_THRESHOLD_BYTES) {
      largeCandidates.push({ key, size });
    }
  }

  largeCandidates.sort((left, right) => right.size - left.size);

  for (const candidate of largeCandidates) {
    if (freedChars * 2 >= minBytesToFree) {
      break;
    }

    removeKey(candidate.key);
  }

  return removed;
}

export function safeLocalStorageSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      throw error;
    }
  }

  pruneLocalStorageForQuota(Math.max(value.length * 2, 256 * 1024));

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      throw error;
    }
  }

  return false;
}