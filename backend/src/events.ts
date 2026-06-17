// All canonical module list and typed events live in the single source of truth.
export {
  NAMI_EVENT_MODULES,
  PRIORITY_EVENT_TYPES,
  type NamiEventData,
  type NamiEventModule,
  type NamiTypedEvent,
  type UnknownNamiEventData,
} from './types/events.js';

export {
  KNOWN_EVENT_NAMES,
  PRIORITY_EVENT_NAMES,
  isKnownEventName,
  isPriorityEventName,
  parseEventName,
  validateEventData,
  toUnknownEventData,
  type NamiEventName,
  type PriorityEventName,
} from './event-guards.js';

import type { NamiTypedEvent } from './types/events.js';
import {
  isKnownEventName,
  parseEventName,
  toUnknownEventData,
  validateEventData,
} from './event-guards.js';

// Legacy envelope kept for the immutable raw JSONL log (auditability + replay).
// The typed path (NamiTypedEvent) is used for all projections and services.
// We do NOT duplicate shapes — types/events.ts is the sole definition.
export interface IndexedNamiEvent {
  module: import('./types/events.js').NamiEventModule;
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

/**
 * Lifts a raw IndexedNamiEvent into the typed envelope.
 *
 * Known event names are validated against canonical schemas from types/events.ts.
 * Unrecognized or malformed payloads fall back to UnknownNamiEventData.
 */
export function toTypedEvent(raw: IndexedNamiEvent): NamiTypedEvent {
  const parsedName = parseEventName(raw.type);
  const base = {
    module: raw.module,
    id: raw.id,
    packageId: raw.packageId,
    transactionModule: raw.transactionModule,
    sender: raw.sender,
    type: raw.type,
    timestampMs: raw.timestampMs,
  };

  if (parsedName && isKnownEventName(parsedName)) {
    const data = validateEventData(parsedName, raw.parsedJson);

    if (data) {
      return {
        ...base,
        eventName: parsedName,
        data,
      };
    }
  }

  return {
    ...base,
    eventName: null,
    data: toUnknownEventData(raw.parsedJson),
  };
}