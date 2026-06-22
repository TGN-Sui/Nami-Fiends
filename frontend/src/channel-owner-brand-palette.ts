const BRAND_PALETTE_KEY = 'nami-channel-brand-palette';

const DEFAULT_BRAND_PALETTE = ['#4da3ff', '#e11d48', '#34d399', '#f97316'];

export function readOwnerBrandPalette(): string[] {
  try {
    const savedPalette = window.localStorage.getItem(BRAND_PALETTE_KEY);

    if (!savedPalette) {
      return [...DEFAULT_BRAND_PALETTE];
    }

    const parsedPalette = JSON.parse(savedPalette) as unknown;

    if (!Array.isArray(parsedPalette)) {
      return [...DEFAULT_BRAND_PALETTE];
    }

    return parsedPalette
      .filter((color): color is string => typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color))
      .slice(0, 4);
  } catch {
    return [...DEFAULT_BRAND_PALETTE];
  }
}

export function saveOwnerBrandPalette(palette: string[]): void {
  window.localStorage.setItem(BRAND_PALETTE_KEY, JSON.stringify(palette.slice(0, 4)));
}

export function defaultOwnerBrandPalette(): string[] {
  return [...DEFAULT_BRAND_PALETTE];
}