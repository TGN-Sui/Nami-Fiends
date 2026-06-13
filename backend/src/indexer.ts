import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

import { config } from './config.js';
import {
  NAMI_EVENT_MODULES,
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

export class NamiEventIndexer {
  private cursors: CursorStore = {};

  constructor(private readonly client: SuiJsonRpcClient) {}

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

      for (const event of response.data) {
        await this.storeEvent(moduleName, event);
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

  private async storeEvent(
    moduleName: NamiEventModule,
    event: SuiEvent
  ): Promise<void> {
    const indexedEvent: IndexedNamiEvent = {
      module: moduleName,
      id: {
        txDigest: event.id.txDigest,
        eventSeq: event.id.eventSeq
      },
      packageId: event.packageId,
      transactionModule: event.transactionModule,
      sender: event.sender,
      type: event.type,
      parsedJson: event.parsedJson,
      timestampMs: event.timestampMs ?? null
    };

    await appendJsonLine(config.eventLogPath, indexedEvent);
  }
}