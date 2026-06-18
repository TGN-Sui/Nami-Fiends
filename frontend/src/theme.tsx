import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

export type NamiThemeMode = 'default' | 'dark' | 'light' | 'custom';
export type NamiUiShell = 'classic' | 'glass';

export type NamiCustomThemeColors = {
  background: string;
  panel: string;
  accent: string;
  text: string;
};

const STORAGE_KEY = 'nami.theme.mode';
const CUSTOM_STORAGE_KEY = 'nami.theme.custom';
const UI_SHELL_STORAGE_KEY = 'nami.ui.shell';

const DEFAULT_CUSTOM: NamiCustomThemeColors = {
  background: '#030a12',
  panel: '#121622',
  accent: '#186fff',
  text: '#eef7ff',
};

const PRESETS: Record<Exclude<NamiThemeMode, 'custom'>, NamiCustomThemeColors> = {
  default: {
    background: '#030a12',
    panel: 'rgba(18, 22, 34, 0.78)',
    accent: 'rgba(24, 111, 255, 0.7)',
    text: '#eef7ff',
  },
  dark: {
    background: '#070707',
    panel: '#111111',
    accent: 'rgba(255, 255, 255, 0.18)',
    text: '#e8e8ec',
  },
  light: {
    background: '#d0d9e3',
    panel: '#e8edf3',
    accent: 'rgba(24, 111, 255, 0.62)',
    text: '#152536',
  },
};

const LIGHT_SEMANTIC_TOKENS = {
  muted: '#2a3d52',
  subtle: '#3d5266',
  border: 'rgba(19, 48, 82, 0.16)',
  borderStrong: 'rgba(19, 48, 82, 0.24)',
  surfaceRaised: '#f4f7fa',
  shadow: 'rgba(19, 40, 70, 0.1)',
  navText: '#2a4560',
  navIcon: '#1a6fd4',
} as const;

const DEFAULT_SEMANTIC_TOKENS = {
  muted: 'rgba(190, 210, 235, 0.86)',
  subtle: '#9fb5ca',
  border: 'rgba(117, 215, 255, 0.16)',
  borderStrong: 'rgba(117, 215, 255, 0.28)',
  surfaceRaised: 'rgba(255, 255, 255, 0.06)',
  shadow: 'rgba(0, 0, 0, 0.22)',
  navText: '#84d9ff',
  navIcon: '#75d7ff',
} as const;

const DARK_MODE_SEMANTIC_TOKENS = {
  muted: '#c4c4cc',
  subtle: '#a1a1aa',
  border: 'rgba(255, 255, 255, 0.1)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  surfaceRaised: '#1a1a1a',
  shadow: 'rgba(0, 0, 0, 0.48)',
  navText: '#d4d4d8',
  navIcon: '#a1a1aa',
} as const;

type NamiSemanticTokens = {
  muted: string;
  subtle: string;
  border: string;
  borderStrong: string;
  surfaceRaised: string;
  shadow: string;
  navText: string;
  navIcon: string;
};

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

type NamiAmbientTokens = {
  bodyBackground: string;
  gridLine: string;
  gridLineStrong: string;
  gridOpacity: string;
  spotlightCore: string;
  spotlightMid: string;
  spotlightOuter: string;
  spotlightOpacity: string;
  spotlightBlendMode: string;
  spotlightGridOpacity: string;
};

function parseHexColor(input: string): RgbColor | null {
  const normalized = input.trim().replace(/^#/, '');

  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(normalized)) {
    return null;
  }

  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

function parseColor(input: string): RgbColor | null {
  const hex = parseHexColor(input);

  if (hex) {
    return hex;
  }

  const rgbMatch = input
    .trim()
    .match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);

  if (!rgbMatch) {
    return null;
  }

  return {
    r: Math.round(Number(rgbMatch[1])),
    g: Math.round(Number(rgbMatch[2])),
    b: Math.round(Number(rgbMatch[3])),
  };
}

function rgbaFrom(rgb: RgbColor, alpha: number): string {
  return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + alpha + ')';
}

function relativeLuminance(rgb: RgbColor): number {
  const channels = [rgb.r, rgb.g, rgb.b].map((value) => {
    const channel = value / 255;

    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function isLightColor(input: string): boolean {
  const rgb = parseColor(input);

  if (!rgb) {
    return false;
  }

  return relativeLuminance(rgb) > 0.58;
}

function accentRgb(colors: NamiCustomThemeColors): RgbColor {
  return parseColor(colors.accent) ?? { r: 24, g: 111, b: 255 };
}

function textRgb(colors: NamiCustomThemeColors): RgbColor {
  return parseColor(colors.text) ?? { r: 238, g: 247, b: 255 };
}

function semanticTokensForCustom(colors: NamiCustomThemeColors): NamiSemanticTokens {
  const light = isLightColor(colors.background);
  const accent = accentRgb(colors);
  const text = textRgb(colors);

  if (light) {
    return {
      muted: rgbaFrom(text, 0.82),
      subtle: rgbaFrom(text, 0.66),
      border: rgbaFrom(accent, 0.16),
      borderStrong: rgbaFrom(accent, 0.24),
      surfaceRaised: colors.panel,
      shadow: rgbaFrom(text, 0.1),
      navText: rgbaFrom(text, 0.82),
      navIcon: colors.accent,
    };
  }

  return {
    muted: rgbaFrom(text, 0.84),
    subtle: rgbaFrom(text, 0.68),
    border: rgbaFrom(accent, 0.18),
    borderStrong: rgbaFrom(accent, 0.28),
    surfaceRaised: colors.panel,
    shadow: 'rgba(0, 0, 0, 0.48)',
    navText: rgbaFrom(text, 0.88),
    navIcon: colors.accent,
  };
}

function activeTextForAccent(accentColor: string): string {
  const rgb = parseColor(accentColor);

  if (!rgb) {
    return '#ffffff';
  }

  return relativeLuminance(rgb) > 0.58 ? '#152536' : '#ffffff';
}

function applyAccentDerivatives(
  root: HTMLElement,
  colors: NamiCustomThemeColors,
  mode: NamiThemeMode
): void {
  const accent = accentRgb(colors);
  const lightScheme =
    mode === 'light' || (mode === 'custom' && isLightColor(colors.background));
  const solidAccent = rgbaFrom(accent, lightScheme ? 0.94 : 1);
  const activeBg = lightScheme
    ? solidAccent
    : mode === 'dark'
      ? 'rgba(255, 255, 255, 0.22)'
      : colors.accent;
  const activeText = lightScheme ? activeTextForAccent(solidAccent) : colors.text;

  root.style.setProperty('--nami-theme-accent-solid', solidAccent);
  root.style.setProperty('--nami-theme-accent-soft', rgbaFrom(accent, 0.08));
  root.style.setProperty('--nami-theme-accent-medium', rgbaFrom(accent, 0.16));
  root.style.setProperty('--nami-theme-accent-border', rgbaFrom(accent, 0.28));
  root.style.setProperty('--nami-theme-accent-glow', rgbaFrom(accent, 0.14));
  root.style.setProperty('--nami-theme-accent-strong', rgbaFrom(accent, 0.9));
  root.style.setProperty('--nami-theme-active-bg', activeBg);
  root.style.setProperty('--nami-theme-active-text', activeText);
  root.style.setProperty('--nami-theme-heading-accent', rgbaFrom(accent, 0.78));
}

function ambientTokensForMode(mode: NamiThemeMode, colors: NamiCustomThemeColors): NamiAmbientTokens {
  if (mode === 'light') {
    const accent = accentRgb(colors);

    return {
      bodyBackground:
        'radial-gradient(circle at 14% 0%, ' +
        rgbaFrom(accent, 0.09) +
        ', transparent 26rem), linear-gradient(180deg, #d8e0e8 0%, #ccd6e0 100%)',
      gridLine: 'rgba(19, 48, 82, 0.07)',
      gridLineStrong: 'rgba(19, 48, 82, 0.16)',
      gridOpacity: '0.42',
      spotlightCore: 'rgba(255, 255, 255, 0.82)',
      spotlightMid: rgbaFrom(accent, 0.34),
      spotlightOuter: 'rgba(19, 48, 82, 0.1)',
      spotlightOpacity: '0.5',
      spotlightBlendMode: 'normal',
      spotlightGridOpacity: '0.56',
    };
  }

  if (mode === 'dark') {
    return {
      bodyBackground:
        'radial-gradient(circle at 12% 0%, rgba(255, 255, 255, 0.03), transparent 24rem), linear-gradient(180deg, #070707 0%, #050505 100%)',
      gridLine: 'rgba(255, 255, 255, 0.04)',
      gridLineStrong: 'rgba(255, 255, 255, 0.08)',
      gridOpacity: '0.22',
      spotlightCore: 'rgba(255, 255, 255, 0.16)',
      spotlightMid: 'rgba(255, 255, 255, 0.05)',
      spotlightOuter: 'rgba(255, 255, 255, 0.02)',
      spotlightOpacity: '0.14',
      spotlightBlendMode: 'normal',
      spotlightGridOpacity: '0.28',
    };
  }

  if (mode === 'custom') {
    const light = isLightColor(colors.background);
    const accent = accentRgb(colors);
    const text = textRgb(colors);

    return {
      bodyBackground: light
        ? 'radial-gradient(circle at 14% 0%, ' +
          rgbaFrom(accent, 0.1) +
          ', transparent 26rem), linear-gradient(180deg, ' +
          colors.background +
          ' 0%, ' +
          colors.background +
          ' 100%)'
        : 'radial-gradient(circle at 12% 0%, ' +
          rgbaFrom(accent, 0.1) +
          ', transparent 24rem), linear-gradient(180deg, ' +
          colors.background +
          ' 0%, ' +
          colors.background +
          ' 100%)',
      gridLine: rgbaFrom(text, light ? 0.08 : 0.06),
      gridLineStrong: rgbaFrom(text, light ? 0.15 : 0.1),
      gridOpacity: light ? '0.4' : '0.24',
      spotlightCore: light ? 'rgba(255, 255, 255, 0.78)' : rgbaFrom(text, 0.2),
      spotlightMid: rgbaFrom(accent, light ? 0.3 : 0.14),
      spotlightOuter: rgbaFrom(text, light ? 0.08 : 0.04),
      spotlightOpacity: light ? '0.46' : '0.16',
      spotlightBlendMode: 'normal',
      spotlightGridOpacity: light ? '0.52' : '0.3',
    };
  }

  return {
    bodyBackground:
      'radial-gradient(circle at top, rgba(22, 92, 128, 0.24), transparent 36rem), ' + colors.background,
    gridLine: 'rgba(1, 9, 18, 0.1)',
    gridLineStrong: 'rgba(255, 255, 255, 0.42)',
    gridOpacity: '1',
    spotlightCore: 'rgba(255, 255, 255, 0.34)',
    spotlightMid: 'rgba(255, 255, 255, 0.102)',
    spotlightOuter: 'rgba(255, 255, 255, 0.04)',
    spotlightOpacity: '0.46',
    spotlightBlendMode: 'screen',
    spotlightGridOpacity: '1',
  };
}

function semanticTokensForMode(mode: NamiThemeMode, colors: NamiCustomThemeColors): NamiSemanticTokens {
  if (mode === 'custom') {
    return semanticTokensForCustom(colors);
  }

  if (mode === 'light') {
    return LIGHT_SEMANTIC_TOKENS;
  }

  if (mode === 'dark') {
    return DARK_MODE_SEMANTIC_TOKENS;
  }

  return DEFAULT_SEMANTIC_TOKENS;
}

type NamiThemeContextValue = {
  mode: NamiThemeMode;
  uiShell: NamiUiShell;
  customColors: NamiCustomThemeColors;
  setMode: (mode: NamiThemeMode) => void;
  setUiShell: (shell: NamiUiShell) => void;
  setCustomColor: (key: keyof NamiCustomThemeColors, value: string) => void;
  resetCustomColors: () => void;
};

const NamiThemeContext = createContext<NamiThemeContextValue | null>(null);

function readStoredMode(): NamiThemeMode {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);

    if (value === 'dark' || value === 'light' || value === 'custom' || value === 'default') {
      return value;
    }
  } catch {
    /* ignore */
  }

  return 'default';
}

function readStoredUiShell(): NamiUiShell {
  try {
    const value = window.localStorage.getItem(UI_SHELL_STORAGE_KEY);

    if (value === 'classic' || value === 'glass') {
      return value;
    }
  } catch {
    /* ignore */
  }

  return 'classic';
}

function readStoredCustom(): NamiCustomThemeColors {
  try {
    const raw = window.localStorage.getItem(CUSTOM_STORAGE_KEY);

    if (!raw) {
      return DEFAULT_CUSTOM;
    }

    const parsed = JSON.parse(raw) as Partial<NamiCustomThemeColors>;

    return {
      background: parsed.background ?? DEFAULT_CUSTOM.background,
      panel: parsed.panel ?? DEFAULT_CUSTOM.panel,
      accent: parsed.accent ?? DEFAULT_CUSTOM.accent,
      text: parsed.text ?? DEFAULT_CUSTOM.text,
    };
  } catch {
    return DEFAULT_CUSTOM;
  }
}

function applyThemeToDocument(
  mode: NamiThemeMode,
  custom: NamiCustomThemeColors,
  uiShell: NamiUiShell
): void {
  const colors = mode === 'custom' ? custom : PRESETS[mode];
  const root = document.documentElement;

  const semantic = semanticTokensForMode(mode, colors);
  const ambient = ambientTokensForMode(mode, colors);
  const lightScheme =
    mode === 'light' || (mode === 'custom' && isLightColor(colors.background));

  root.dataset.namiTheme = mode;
  root.dataset.namiUi = uiShell;

  if (lightScheme) {
    root.dataset.namiThemeLight = 'true';
  } else {
    delete root.dataset.namiThemeLight;
  }
  root.style.colorScheme = lightScheme ? 'light' : 'dark';
  root.style.setProperty('--nami-theme-bg', colors.background);
  root.style.setProperty('--nami-theme-panel', colors.panel);
  root.style.setProperty('--nami-theme-accent', colors.accent);
  root.style.setProperty('--nami-theme-text', colors.text);
  root.style.setProperty('--nami-theme-muted', semantic.muted);
  root.style.setProperty('--nami-theme-subtle', semantic.subtle);
  root.style.setProperty('--nami-theme-border', semantic.border);
  root.style.setProperty('--nami-theme-border-strong', semantic.borderStrong);
  root.style.setProperty('--nami-theme-surface-raised', semantic.surfaceRaised);
  root.style.setProperty('--nami-theme-shadow', semantic.shadow);
  root.style.setProperty('--nami-theme-nav-text', semantic.navText);
  root.style.setProperty('--nami-theme-nav-icon', colors.accent);
  root.style.setProperty('--nami-body-background', ambient.bodyBackground);
  root.style.setProperty('--nami-grid-line', ambient.gridLine);
  root.style.setProperty('--nami-grid-line-strong', ambient.gridLineStrong);
  root.style.setProperty('--nami-grid-opacity', ambient.gridOpacity);
  root.style.setProperty('--nami-spotlight-core', ambient.spotlightCore);
  root.style.setProperty('--nami-spotlight-mid', ambient.spotlightMid);
  root.style.setProperty('--nami-spotlight-outer', ambient.spotlightOuter);
  root.style.setProperty('--nami-spotlight-opacity', ambient.spotlightOpacity);
  root.style.setProperty('--nami-spotlight-blend-mode', ambient.spotlightBlendMode);
  root.style.setProperty('--nami-spotlight-grid-opacity', ambient.spotlightGridOpacity);
  applyAccentDerivatives(root, colors, mode);
  root.style.color = colors.text;
  root.style.backgroundColor = colors.background;
}

export function NamiThemeProvider(props: { children: ReactNode }): ReactElement {
  const [mode, setModeState] = useState<NamiThemeMode>(() => readStoredMode());
  const [uiShell, setUiShellState] = useState<NamiUiShell>(() => readStoredUiShell());
  const [customColors, setCustomColors] = useState<NamiCustomThemeColors>(() => readStoredCustom());

  const setMode = useCallback((nextMode: NamiThemeMode) => {
    setModeState(nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
  }, []);

  const setUiShell = useCallback((nextShell: NamiUiShell) => {
    setUiShellState(nextShell);
    window.localStorage.setItem(UI_SHELL_STORAGE_KEY, nextShell);
  }, []);

  const setCustomColor = useCallback((key: keyof NamiCustomThemeColors, value: string) => {
    setCustomColors((current) => {
      const next = { ...current, [key]: value };
      window.localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetCustomColors = useCallback(() => {
    setCustomColors(DEFAULT_CUSTOM);
    window.localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(DEFAULT_CUSTOM));
  }, []);

  useEffect(() => {
    applyThemeToDocument(mode, customColors, uiShell);
  }, [mode, customColors, uiShell]);

  const value = useMemo(
    () => ({
      mode,
      uiShell,
      customColors,
      setMode,
      setUiShell,
      setCustomColor,
      resetCustomColors,
    }),
    [mode, uiShell, customColors, setMode, setUiShell, setCustomColor, resetCustomColors]
  );

  return <NamiThemeContext.Provider value={value}>{props.children}</NamiThemeContext.Provider>;
}

export function useNamiTheme(): NamiThemeContextValue {
  const context = useContext(NamiThemeContext);

  if (!context) {
    throw new Error('useNamiTheme must be used within NamiThemeProvider');
  }

  return context;
}

const SHELL_OPTIONS: Array<{
  id: NamiUiShell;
  label: string;
  detail: string;
  previewClass: string;
}> = [
  {
    id: 'classic',
    label: 'Classic Default',
    detail: 'Solid panels with crisp borders and the original Nami layout.',
    previewClass: 'settings-appearance-shell-preview-classic',
  },
  {
    id: 'glass',
    label: 'Modern Glass',
    detail: 'Apple-style frosted glass with heavy blur, soft highlights, and readable depth.',
    previewClass: 'settings-appearance-shell-preview-glass',
  },
];

const MODE_OPTIONS: Array<{
  id: NamiThemeMode;
  label: string;
  detail: string;
}> = [
  {
    id: 'default',
    label: 'Nami Default',
    detail: 'Balanced navy tones with the standard accent glow.',
  },
  {
    id: 'dark',
    label: 'Dark Mode',
    detail: 'Neutral charcoal surfaces with no saturated accents. Glass uses a thick epoxy depth coat.',
  },
  {
    id: 'light',
    label: 'Light Mode',
    detail: 'Soft blue-gray surfaces with stronger panel contrast for daytime reading.',
  },
  {
    id: 'custom',
    label: 'Custom Mode',
    detail: 'Pick your own background, panel, accent, and text colors.',
  },
];

function AppearanceOptionCheck({ active }: { active: boolean }): ReactElement {
  return (
    <span aria-hidden="true" className="settings-appearance-option-check">
      {active ? (
        <svg fill="none" height="12" viewBox="0 0 12 12" width="12">
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      ) : null}
    </span>
  );
}

function ThemeModePreview({
  option,
  customColors,
}: {
  option: NamiThemeMode;
  customColors: NamiCustomThemeColors;
}): ReactElement {
  const colors = option === 'custom' ? customColors : PRESETS[option as Exclude<NamiThemeMode, 'custom'>];

  return (
    <span className="settings-appearance-mode-preview" aria-hidden="true">
      <span style={{ backgroundColor: colors.background }} />
      <span style={{ backgroundColor: colors.panel }} />
      <span style={{ backgroundColor: colors.accent }} />
    </span>
  );
}

export function ThemeSettingsPanel(): ReactElement {
  const { mode, uiShell, customColors, setMode, setUiShell, setCustomColor, resetCustomColors } =
    useNamiTheme();

  return (
    <article className="panel settings-card settings-theme-card">
      <div className="profile-panel-heading">
        <h2>Appearance</h2>
        <p>
          Choose how Nami looks on your device. Game channel brand colors stay controlled by
          channel owners.
        </p>
      </div>

      <section className="settings-appearance-section">
        <p className="settings-theme-section-label">Interface style</p>
        <div
          className="settings-appearance-grid settings-appearance-grid--shell"
          role="radiogroup"
          aria-label="Interface style"
        >
          {SHELL_OPTIONS.map((option) => {
            const active = uiShell === option.id;

            return (
              <button
                aria-checked={active}
                className={
                  'settings-appearance-option' + (active ? ' is-active-appearance-option' : '')
                }
                key={option.id}
                onClick={() => setUiShell(option.id)}
                role="radio"
                type="button"
              >
                <span className={'settings-appearance-option-preview ' + option.previewClass} />
                <span className="settings-appearance-option-copy">
                  <strong>{option.label}</strong>
                  <small>{option.detail}</small>
                </span>
                <AppearanceOptionCheck active={active} />
              </button>
            );
          })}
        </div>
      </section>

      <section className="settings-appearance-section">
        <p className="settings-theme-section-label">Color mode</p>
        <div
          className="settings-appearance-grid settings-appearance-grid--mode"
          role="radiogroup"
          aria-label="Theme mode"
        >
          {MODE_OPTIONS.map((option) => {
            const active = mode === option.id;

            return (
              <button
                aria-checked={active}
                className={
                  'settings-appearance-option' + (active ? ' is-active-appearance-option' : '')
                }
                key={option.id}
                onClick={() => setMode(option.id)}
                role="radio"
                type="button"
              >
                <ThemeModePreview customColors={customColors} option={option.id} />
                <span className="settings-appearance-option-copy">
                  <strong>{option.label}</strong>
                  <small>{option.detail}</small>
                </span>
                <AppearanceOptionCheck active={active} />
              </button>
            );
          })}
        </div>
      </section>

      {mode === 'custom' ? (
        <div className="settings-theme-custom-grid">
          {(
            [
              ['background', 'Background'],
              ['panel', 'Panels'],
              ['accent', 'Accents'],
              ['text', 'Text'],
            ] as Array<[keyof NamiCustomThemeColors, string]>
          ).map(([key, label]) => (
            <label className="settings-brand-color-chip settings-brand-color-chip-polished" key={key}>
              <span className="settings-brand-color-number">{label}</span>
              <span
                className="settings-brand-color-preview"
                style={{ backgroundColor: customColors[key] }}
              />
              <input
                aria-label={'Custom theme ' + label}
                onChange={(event) => setCustomColor(key, event.target.value)}
                type="color"
                value={customColors[key]}
              />
              <small>{customColors[key].toUpperCase()}</small>
            </label>
          ))}

          <button className="profile-secondary-link" onClick={resetCustomColors} type="button">
            Reset custom colors
          </button>
        </div>
      ) : null}
    </article>
  );
}