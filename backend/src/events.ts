export const NAMI_EVENT_MODULES = [
  'identity',
  'passport',
  'verification',
  'badge',
  'badge_issuer',
  'boost',
  'channel',
  'channel_access',
  'conduct',
  'moderation',
  'admin',
  'appeals',
  'jury',
  'squad',
  'guild',
  'profile',
  'title',
  'cosmetics',
  'recovery'
] as const;

export type NamiEventModule = (typeof NAMI_EVENT_MODULES)[number];

export interface IndexedNamiEvent {
  module: NamiEventModule;
  id: {
    txDigest: string;
    eventSeq: string;
  };
  packageId: string;
  transactionModule: string;
  sender: string;
  type: string;
  parsedJson: unknown;
  timestampMs: string | null;
}