import { canSendChatMessages } from './member-access.js';
import { readNamiCustomEmojis, type NamiCustomEmoji } from './nami-custom-emojis-store.js';

export function mergeQualifiedChatEmojis(contextEmojis: NamiCustomEmoji[] = []): NamiCustomEmoji[] {
  if (!canSendChatMessages()) {
    return contextEmojis;
  }

  const officialEmojis = readNamiCustomEmojis();

  if (officialEmojis.length === 0) {
    return contextEmojis;
  }

  if (contextEmojis.length === 0) {
    return officialEmojis;
  }

  const seenShortcodes = new Set(officialEmojis.map((emoji) => emoji.shortcode));
  const merged = [...officialEmojis];

  for (const emoji of contextEmojis) {
    if (!seenShortcodes.has(emoji.shortcode)) {
      merged.push(emoji);
      seenShortcodes.add(emoji.shortcode);
    }
  }

  return merged;
}