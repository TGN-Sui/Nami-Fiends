export function formatArcadeG(points: number, withPlus = false): string {
  const label = points + ' G';

  return withPlus ? '+' + label : label;
}