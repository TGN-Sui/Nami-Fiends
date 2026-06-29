import type { NamiCustomEmoji } from '../nami-custom-emojis-store.js';

function svgEmojiDataUrl(label: string, glyph: string, accent: string): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    '<rect width="64" height="64" rx="14" fill="#0b1420"/>' +
    '<circle cx="32" cy="32" r="24" fill="' +
    accent +
    '"/>' +
    '<text x="32" y="40" text-anchor="middle" font-size="24" font-family="Segoe UI Emoji, Apple Color Emoji, sans-serif" fill="#fff">' +
    glyph +
    '</text>' +
    '</svg>';

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/** Local-dev showcase emojis when the official owner library is still empty. */
export const bootstrapNamiChatEmojis: NamiCustomEmoji[] = [
  {
    id: 'bootstrap-emoji-wave',
    shortcode: 'wave',
    label: 'Wave',
    imageUrl: svgEmojiDataUrl('Wave', '👋', '#2f7fbf'),
    uploadedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'bootstrap-emoji-gg',
    shortcode: 'gg',
    label: 'GG',
    imageUrl: svgEmojiDataUrl('GG', 'GG', '#6b4fd6'),
    uploadedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'bootstrap-emoji-fire',
    shortcode: 'fire',
    label: 'Fire',
    imageUrl: svgEmojiDataUrl('Fire', '🔥', '#d65a1f'),
    uploadedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'bootstrap-emoji-heart',
    shortcode: 'heart',
    label: 'Heart',
    imageUrl: svgEmojiDataUrl('Heart', '💜', '#9b3f8f'),
    uploadedAt: '2026-01-01T00:00:00.000Z',
  },
];