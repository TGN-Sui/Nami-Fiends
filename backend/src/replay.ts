import { config } from './config.js';
import { toTypedEvent, type IndexedNamiEvent } from './events.js';
import { ProjectionRegistry } from './projection-registry.js';
import { readJsonLines } from './storage.js';

export interface ReplayResult {
  processed: number;
  services: string[];
}

export async function replayProjections(
  registry: ProjectionRegistry
): Promise<ReplayResult> {
  const events = await readJsonLines<IndexedNamiEvent>(config.eventLogPath);

  await registry.clear();

  for (const raw of events) {
    const typed = toTypedEvent(raw);
    await registry.processEvent(typed);
  }

  await registry.save();

  return {
    processed: events.length,
    services: registry.getServiceNames(),
  };
}

async function main(): Promise<void> {
  const registry = new ProjectionRegistry();

  console.log('[nami-replay] rebuilding projections from immutable event log');
  console.log(`[nami-replay] source: ${config.eventLogPath}`);

  const result = await replayProjections(registry);

  console.log(`[nami-replay] processed ${result.processed} event(s)`);
  console.log(`[nami-replay] services: ${result.services.join(', ')}`);
  console.log(
    `[nami-replay] guild projection: ${registry.guilds.getAll().length} guild(s)`
  );
  console.log(
    `[nami-replay] recovery projection: ${registry.recovery.getAll().length} request(s) (${registry.recovery.getStats().openCount} open)`
  );
  console.log(
    `[nami-replay] passport timelines: ${registry.passportTimelines.getStats().passportCount} passport(s) (${registry.passportTimelines.getStats().totalEntries} entries)`
  );
  console.log(
    `[nami-replay] appeals: ${registry.appeals.getAll().length} (${registry.appeals.getStats().openCount} open)`
  );
  console.log(
    `[nami-replay] jury cases: ${registry.jury.getAll().length} (${registry.jury.getStats().openCount} open)`
  );
  console.log(`[nami-replay] squads: ${registry.squads.getAll().length}`);
  console.log(`[nami-replay] profiles: ${registry.profiles.getAll().length}`);
  console.log(`[nami-replay] channels: ${registry.channels.getAll().length}`);
  console.log(
    `[nami-replay] moderation records: ${registry.moderation.getAll().length} (${registry.moderation.getStats().activeCount} active)`
  );
  console.log(`[nami-replay] badge history: ${registry.badgeHistory.getAll().length}`);
  console.log(`[nami-replay] boost history: ${registry.boostHistory.getAll().length}`);
  console.log(`[nami-replay] channel access policies: ${registry.channelAccess.getAll().length}`);
  console.log(
    `[nami-replay] nodename registry: ${registry.nodenameRegistry.getStats().count} nodename(s)`
  );
}

void main().catch((error) => {
  console.error('[nami-replay] failed');
  console.error(error);
  process.exit(1);
});