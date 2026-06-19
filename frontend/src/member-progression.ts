import { members, type NamiMember } from './uiMockData.js';

export type NamiProgressionSnapshot = {
  level: number;
  levelPercent: number;
  currentXp: number;
  nextLevelXp: number;
  seasonXp: number;
  guilds: string[];
  squads: string[];
};

function percentForNamiLevel(level: number, currentXp = 0, nextLevelXp = 1000): number {
  const safeLevel = Math.min(100, Math.max(1, level));
  const safeXpPercent = Math.min(1, Math.max(0, currentXp / nextLevelXp));
  const preciseLevel = safeLevel - 1 + safeXpPercent;

  return Math.min(100, Math.max(0, (preciseLevel / 99) * 100));
}

export function getNamiProgression(member: NamiMember, tick = Date.now()): NamiProgressionSnapshot {
  const memberIndex = Math.max(0, members.findIndex((currentMember) => currentMember.id === member.id));
  const baseLevel = Math.min(100, 18 + memberIndex * 9 + (member.name.length % 8));
  const nextLevelXp = 1000;
  const liveXpPulse = Math.floor((tick / 1000) % 120);
  const currentXp = Math.min(nextLevelXp - 1, 420 + memberIndex * 73 + liveXpPulse);
  const levelPercent = percentForNamiLevel(baseLevel, currentXp, nextLevelXp);

  const guildSets = [
    ['Wave Raiders', 'Creator Circle'],
    ['Night Market PvP', 'Retro Arena'],
    ['Builder League', 'Sui Creators'],
    ['Ocean Mint Crew', 'Signal Watch'],
  ];

  const squadSets = [
    ['Alpha Squad', 'Mint Watch'],
    ['Raid Team', 'Patch Crew'],
    ['Builder Squad', 'Event Ops'],
    ['Support Squad', 'Lore Team'],
  ];

  return {
    level: baseLevel,
    levelPercent,
    currentXp,
    nextLevelXp,
    seasonXp: baseLevel * nextLevelXp + currentXp,
    guilds: guildSets[memberIndex % guildSets.length] ?? guildSets[0]!,
    squads: squadSets[memberIndex % squadSets.length] ?? squadSets[0]!,
  };
}

export function percentForNamiSeasonLevel(level: number, currentXp = 0, nextLevelXp = 1000): number {
  return percentForNamiLevel(level, currentXp, nextLevelXp);
}