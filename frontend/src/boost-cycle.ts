export const BOOST_RESET_TIME_ZONE = 'America/Chicago';
export const BOOST_RESET_WEEKDAY = 'Friday';
export const BOOST_RESET_HOUR = 12;
export const BOOST_RESET_MINUTE = 0;

const MS_PER_DAY = 86_400_000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: string;
};

function readZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(date);

  const map: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
    weekday: map.weekday ?? 'Mon',
  };
}

function serialMinute(parts: Pick<ZonedParts, 'year' | 'month' | 'day' | 'hour' | 'minute'>): number {
  return (((parts.year * 372 + parts.month) * 31 + parts.day) * 24 + parts.hour) * 60 + parts.minute;
}

/** Convert a wall-clock time in `timeZone` to UTC epoch ms. */
export function zonedLocalTimeToUtcMs(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): number {
  let utcMs = Date.UTC(year, month - 1, day, hour + 6, minute, second);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const actual = readZonedParts(new Date(utcMs), timeZone);

    if (
      actual.year === year &&
      actual.month === month &&
      actual.day === day &&
      actual.hour === hour &&
      actual.minute === minute &&
      actual.second === second
    ) {
      return utcMs;
    }

    const minuteDelta =
      serialMinute({ year, month, day, hour, minute }) -
      serialMinute(actual);
    utcMs += minuteDelta * 60_000 + (second - actual.second) * 1000;
  }

  return utcMs;
}

/** Latest Friday 12:00 PM Central at or before `now`. */
export function getBoostCycleStartMs(now = new Date()): number {
  const nowMs = now.getTime();

  for (let daysBack = 0; daysBack <= 7; daysBack += 1) {
    const probe = new Date(nowMs - daysBack * MS_PER_DAY);
    const parts = readZonedParts(probe, BOOST_RESET_TIME_ZONE);

    if (parts.weekday !== 'Fri') {
      continue;
    }

    const resetMs = zonedLocalTimeToUtcMs(
      parts.year,
      parts.month,
      parts.day,
      BOOST_RESET_HOUR,
      BOOST_RESET_MINUTE,
      0,
      BOOST_RESET_TIME_ZONE,
    );

    if (resetMs <= nowMs) {
      return resetMs;
    }
  }

  return nowMs - MS_PER_WEEK;
}

export function getBoostCycleId(now = new Date()): number {
  return getBoostCycleStartMs(now);
}

export function getNextBoostCycleResetMs(now = new Date()): number {
  return getBoostCycleStartMs(now) + MS_PER_WEEK;
}

export function getBoostCycleResetTimeZone(): string {
  if (typeof Intl === 'undefined') {
    return 'UTC';
  }

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function formatBoostCycleResetAt(
  utcMs: number,
  timeZone: string = getBoostCycleResetTimeZone(),
  locale?: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(utcMs));
}

export function formatBoostCycleResetLocal(locale?: string): string {
  return formatBoostCycleResetAt(getNextBoostCycleResetMs(), getBoostCycleResetTimeZone(), locale);
}

export function formatBoostCycleResetCentral(locale?: string): string {
  return formatBoostCycleResetAt(getNextBoostCycleResetMs(), BOOST_RESET_TIME_ZONE, locale);
}

export function formatBoostCycleCountdown(now = new Date()): string {
  const remainingMs = Math.max(0, getNextBoostCycleResetMs(now) - now.getTime());
  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 60 * 24) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return days + 'd ' + hours + 'h';
  }

  if (hours > 0) {
    return hours + 'h ' + minutes + 'm';
  }

  return minutes + 'm';
}