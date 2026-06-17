import {
  guildByName,
  NAMI_GUILD_NAMES,
  NAMI_SQUAD_NAMES,
  namiGuilds,
  namiSquads,
  squadByName,
} from './nami-affiliations.js';
import { channels, developers, members } from './uiMockData.js';

export type NamiTagKind = 'member' | 'channel' | 'studio' | 'dev' | 'squad' | 'guild';

export type NamiTagTarget = {
  kind: NamiTagKind;
  id: string;
  label: string;
  prefix: string;
};

export type ParsedMessageSegment =
  | { type: 'text'; value: string }
  | { type: 'tag'; target: NamiTagTarget; raw: string };

const TAG_PREFIX_TO_KIND: Record<string, NamiTagKind> = {
  '@': 'member',
  '#': 'channel',
  '~': 'studio',
  '^': 'dev',
  '%': 'squad',
  '&': 'guild',
};

let cachedRegistry: NamiTagTarget[] | null = null;

function buildRegistry(): NamiTagTarget[] {
  const entries: NamiTagTarget[] = [];

  for (const member of members) {
    entries.push({
      kind: 'member',
      id: member.id,
      label: member.name,
      prefix: '@',
    });
  }

  for (const channel of channels) {
    entries.push({
      kind: 'channel',
      id: channel.id,
      label: channel.name,
      prefix: '#',
    });

    const handleLabel = channel.handle.replace(/^@/, '');

    if (handleLabel.toLowerCase() !== channel.name.toLowerCase()) {
      entries.push({
        kind: 'channel',
        id: channel.id,
        label: handleLabel,
        prefix: '#',
      });
    }
  }

  for (const studio of developers) {
    entries.push({
      kind: 'studio',
      id: studio.id,
      label: studio.name,
      prefix: '~',
    });

    entries.push({
      kind: 'dev',
      id: studio.id,
      label: studio.name,
      prefix: '^',
    });

    const handleLabel = studio.handle.replace(/^@/, '').replace(/-dev$/, '');

    if (handleLabel.toLowerCase() !== studio.name.toLowerCase()) {
      entries.push({
        kind: 'studio',
        id: studio.id,
        label: handleLabel,
        prefix: '~',
      });

      entries.push({
        kind: 'dev',
        id: studio.id,
        label: handleLabel,
        prefix: '^',
      });
    }
  }

  for (const squadName of NAMI_SQUAD_NAMES) {
    const squad = squadByName(squadName);

    entries.push({
      kind: 'squad',
      id: squad?.id ?? 'squad-' + squadName.toLowerCase().replace(/\s+/g, '-'),
      label: squadName,
      prefix: '%',
    });
  }

  for (const guildName of NAMI_GUILD_NAMES) {
    const guild = guildByName(guildName);

    entries.push({
      kind: 'guild',
      id: guild?.id ?? 'guild-' + guildName.toLowerCase().replace(/\s+/g, '-'),
      label: guildName,
      prefix: '&',
    });
  }

  return entries;
}

export function readNamiTagRegistry(): NamiTagTarget[] {
  if (!cachedRegistry) {
    cachedRegistry = buildRegistry();
  }

  return cachedRegistry;
}

export function lookupTagTarget(kind: NamiTagKind, label: string): NamiTagTarget | undefined {
  const normalized = label.trim().toLowerCase();

  return readNamiTagRegistry().find(
    (entry) => entry.kind === kind && entry.label.toLowerCase() === normalized
  );
}

export function extractTagsFromMessage(body: string): NamiTagTarget[] {
  const segments = parseTaggedMessage(body);

  return segments
    .filter((segment): segment is Extract<ParsedMessageSegment, { type: 'tag' }> => segment.type === 'tag')
    .map((segment) => segment.target);
}

function candidatesForKind(kind: NamiTagKind): NamiTagTarget[] {
  return readNamiTagRegistry()
    .filter((entry) => entry.kind === kind)
    .sort((left, right) => right.label.length - left.label.length);
}

function isTagBoundary(body: string, index: number): boolean {
  return index >= body.length || /[\s,.!?;:()[\]{}]/.test(body[index]!);
}

function parseTagAt(body: string, start: number): { segment: ParsedMessageSegment; end: number } | null {
  const prefix = body[start];

  if (!prefix || !TAG_PREFIX_TO_KIND[prefix]) {
    return null;
  }

  const kind = TAG_PREFIX_TO_KIND[prefix]!;
  let cursor = start + 1;

  if (body[cursor] === '"') {
    const closeQuote = body.indexOf('"', cursor + 1);

    if (closeQuote === -1) {
      return null;
    }

    const label = body.slice(cursor + 1, closeQuote);
    const target = lookupTagTarget(kind, label);
    const raw = body.slice(start, closeQuote + 1);

    if (!target) {
      return { segment: { type: 'text', value: raw }, end: closeQuote + 1 };
    }

    return { segment: { type: 'tag', target, raw }, end: closeQuote + 1 };
  }

  const rest = body.slice(cursor);
  const kindCandidates = candidatesForKind(kind);

  for (const candidate of kindCandidates) {
    if (rest.toLowerCase().startsWith(candidate.label.toLowerCase())) {
      const end = cursor + candidate.label.length;

      if (isTagBoundary(body, end)) {
        return {
          segment: { type: 'tag', target: candidate, raw: body.slice(start, end) },
          end,
        };
      }
    }
  }

  const wordMatch = rest.match(/^[\w-]+/);

  if (!wordMatch) {
    return null;
  }

  const label = wordMatch[0]!;
  const target = lookupTagTarget(kind, label);
  const end = cursor + label.length;
  const raw = body.slice(start, end);

  if (!target) {
    return { segment: { type: 'text', value: raw }, end };
  }

  return { segment: { type: 'tag', target, raw }, end };
}

export function parseTaggedMessage(body: string): ParsedMessageSegment[] {
  const segments: ParsedMessageSegment[] = [];
  let cursor = 0;

  while (cursor < body.length) {
    const nextTagIndex = body.slice(cursor).search(/[@#~^%&]/);

    if (nextTagIndex === -1) {
      segments.push({ type: 'text', value: body.slice(cursor) });
      break;
    }

    const absoluteIndex = cursor + nextTagIndex;

    if (absoluteIndex > cursor) {
      segments.push({ type: 'text', value: body.slice(cursor, absoluteIndex) });
    }

    const parsedTag = parseTagAt(body, absoluteIndex);

    if (!parsedTag) {
      segments.push({ type: 'text', value: body[absoluteIndex]! });
      cursor = absoluteIndex + 1;
      continue;
    }

    segments.push(parsedTag.segment);
    cursor = parsedTag.end;
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: body }];
}

export function tagSuggestionHint(): string {
  return '@member · #channel · ~studio · ^dev · %squad · &guild';
}

export function resolveTagMemberId(target: NamiTagTarget): string | null {
  if (target.kind !== 'member') {
    return null;
  }

  return target.id;
}

export function resolveTagGuildId(target: NamiTagTarget): string | null {
  if (target.kind !== 'guild') {
    return null;
  }

  return namiGuilds.find((guild) => guild.id === target.id || guild.name === target.label)?.id ?? target.id;
}

export function resolveTagSquadId(target: NamiTagTarget): string | null {
  if (target.kind !== 'squad') {
    return null;
  }

  return namiSquads.find((squad) => squad.id === target.id || squad.name === target.label)?.id ?? target.id;
}