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
    background: '#010408',
    panel: 'rgba(8, 12, 20, 0.92)',
    accent: 'rgba(72, 132, 255, 0.75)',
    text: '#f4f8ff',
  },
  light: {
    background: '#f3f7fc',
    panel: 'rgba(255, 255, 255, 0.94)',
    accent: 'rgba(24, 111, 255, 0.55)',
    text: '#0d1b2a',
  },
};

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

  root.dataset.namiTheme = mode;
  root.dataset.namiUi = uiShell;
  root.style.setProperty('--nami-theme-bg', colors.background);
  root.style.setProperty('--nami-theme-panel', colors.panel);
  root.style.setProperty('--nami-theme-accent', colors.accent);
  root.style.setProperty('--nami-theme-text', colors.text);
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
    detail: 'Frosted blur, translucent depth, and softer panel edges.',
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
    detail: 'Deeper blacks and higher contrast for low-light use.',
  },
  {
    id: 'light',
    label: 'Light Mode',
    detail: 'Bright surfaces and dark text for daytime reading.',
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