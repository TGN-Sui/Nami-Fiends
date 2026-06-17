import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

import { config } from './config.js';
import {
  NAMI_EVENT_MODULES,
  toTypedEvent,
  type IndexedNamiEvent,
  type NamiEventModule
} from './events.js';
import {
  appendJsonLine,
  readJsonFile,
  writeJsonFile,
  type CursorStore
} from './storage.js';

type QueryEventsResponse = Awaited<
  ReturnType<SuiJsonRpcClient['queryEvents']>
>;

type QueryEventsParams = Parameters<
  SuiJsonRpcClient['queryEvents']
>[0];

type SuiEvent = QueryEventsResponse['data'][number];

/**
 * Clean Phase 2 architecture (no duplicated patches):
 *
 * 1. Raw log (events.jsonl) = immutable source of truth. Always appended exactly.
 * 2. Typed events (from types/events.ts) = the contract for all downstream logic.
 * 3. Projections (future) = derived, replayable views (Guilds, Passport timelines, etc.).
 *
 * The indexer owns polling + typing. Projections are applied via pluggable processors
 * (we start with a no-op placeholder that will be replaced by real projectors in later steps).
 */

export interface EventProcessor {
  process(typed: ReturnType<typeof toTypedEvent>): Promise<void>;
}

export class NamiEventIndexer {
  private cursors: CursorStore = {};
  private processors: EventProcessor[] = [];

  constructor(private readonly client: SuiJsonRpcClient) {}

  /**
   * Register processors (domain projections / services).
   * This keeps the indexer itself concise and focused on Sui polling + ordering.
   */
  registerProcessor(processor: EventProcessor): void {
    this.processors.push(processor);
  }

  async load(): Promise<void> {
    this.cursors = await readJsonFile<CursorStore>(config.cursorPath, {});
  }

  async save(): Promise<void> {
    await writeJsonFile(config.cursorPath, this.cursors);
  }

  async pollOnce(): Promise<number> {
    let totalIndexed = 0;

    for (const moduleName of NAMI_EVENT_MODULES) {
      const indexed = await this.indexModule(moduleName);
      totalIndexed += indexed;
    }

    if (totalIndexed > 0) {
      await this.save();
    }

    return totalIndexed;
  }

  private async indexModule(moduleName: NamiEventModule): Promise<number> {
    let indexed = 0;
    let pagesRead = 0;
    let hasNextPage = true;

    while (hasNextPage && pagesRead < config.maxPagesPerModule) {
      const params: QueryEventsParams = {
        query: {
          MoveModule: {
            package: config.packageId,
            module: moduleName
          }
        },
        cursor: this.cursors[moduleName] ?? null,
        limit: config.pageLimit,
        order: 'ascending'
      };

      const response = await this.client.queryEvents(params);

      for (const suiEvent of response.data) {
        await this.storeAndProcess(moduleName, suiEvent);
        indexed += 1;
      }

      if (response.nextCursor) {
        this.cursors[moduleName] = {
          txDigest: response.nextCursor.txDigest,
          eventSeq: response.nextCursor.eventSeq
        };
      }

      hasNextPage = response.hasNextPage;
      pagesRead += 1;
    }

    if (indexed > 0) {
      console.log(`[indexer] ${moduleName}: indexed ${indexed} event(s)`);
    }

    return indexed;
  }

  private async storeAndProcess(
    moduleName: NamiEventModule,
    suiEvent: SuiEvent
  ): Promise<void> {
    const raw: IndexedNamiEvent = {
      module: moduleName,
      id: {
        txDigest: suiEvent.id.txDigest,
        eventSeq: suiEvent.id.eventSeq
      },
      packageId: suiEvent.packageId,
      transactionModule: suiEvent.transactionModule,
      sender: suiEvent.sender,
      type: suiEvent.type,
      parsedJson: suiEvent.parsedJson,
      timestampMs: suiEvent.timestampMs ?? null
    };

    // 1. Always persist the raw immutable event (source of truth).
    await appendJsonLine(config.eventLogPath, raw);

    // 2. Lift to typed form (the architectural contract).
    const typed = toTypedEvent(raw);

    // 3. Run registered processors / projectors (replaces any future scattered logic).
    for (const processor of this.processors) {
      await processor.process(typed);
    }
  }
}