import { duckArcadeGameMusic, readArcadeAudioPreferences } from './arcade-audio-store.js';

type SfxKind = 'button' | 'bubble' | 'chat';

type TonePatch = {
  frequency: number;
  durationMs: number;
  type: OscillatorType;
  gainPeak: number;
  frequencyEnd?: number;
  delayMs?: number;
  filterFreq?: number;
  filterQ?: number;
};

let audioContext: AudioContext | null = null;
let soundEnabled = true;
let soundscapeInitialized = false;
let audioUnlocked = false;

const SFX_MASTER_GAIN = 1.55;

const HOVER_THROTTLE_MS = 48;
const HOVER_ELEMENT_COOLDOWN_MS = 220;
const TYPE_THROTTLE_MS = 34;
const BUBBLE_COLLISION_THROTTLE_MS = 110;
const BUBBLE_MOTION_THROTTLE_MS = 180;

let lastHoverSfxAt = 0;
let lastTypeSfxAt = 0;
let lastBubbleCollisionSfxAt = 0;
let lastBubbleMotionSfxAt = 0;
const hoverElementCooldown = new WeakMap<HTMLElement, number>();

const BUTTON_CLICK_PATCHES: TonePatch[][] = [
  [
    { frequency: 180, durationMs: 58, type: 'square', gainPeak: 0.042, frequencyEnd: 120, filterFreq: 520 },
    { frequency: 360, durationMs: 42, type: 'triangle', gainPeak: 0.022, delayMs: 18 },
  ],
  [
    { frequency: 140, durationMs: 64, type: 'square', gainPeak: 0.04, frequencyEnd: 90 },
    { frequency: 280, durationMs: 36, type: 'sine', gainPeak: 0.018, delayMs: 22 },
  ],
  [{ frequency: 220, durationMs: 52, type: 'triangle', gainPeak: 0.038, frequencyEnd: 160, filterFreq: 640 }],
  [
    { frequency: 110, durationMs: 44, type: 'square', gainPeak: 0.034 },
    { frequency: 440, durationMs: 28, type: 'square', gainPeak: 0.016, delayMs: 16, filterFreq: 900 },
  ],
];

const BUTTON_HOVER_PATCHES: TonePatch[][] = [
  [
    { frequency: 220, durationMs: 32, type: 'square', gainPeak: 0.024, frequencyEnd: 320, filterFreq: 680 },
    { frequency: 440, durationMs: 22, type: 'triangle', gainPeak: 0.012, delayMs: 12 },
  ],
  [
    { frequency: 180, durationMs: 34, type: 'square', gainPeak: 0.022, frequencyEnd: 260, filterFreq: 520 },
    { frequency: 360, durationMs: 20, type: 'sine', gainPeak: 0.011, delayMs: 14 },
  ],
  [{ frequency: 240, durationMs: 30, type: 'triangle', gainPeak: 0.021, frequencyEnd: 380, filterFreq: 900 }],
];

const SIDEBAR_HOVER_PATCHES: TonePatch[][] = [
  [
    { frequency: 92, durationMs: 46, type: 'square', gainPeak: 0.02, frequencyEnd: 68, filterFreq: 280 },
    { frequency: 184, durationMs: 34, type: 'triangle', gainPeak: 0.012, delayMs: 14 },
  ],
  [
    { frequency: 78, durationMs: 52, type: 'square', gainPeak: 0.022, frequencyEnd: 58 },
    { frequency: 156, durationMs: 38, type: 'sine', gainPeak: 0.011, delayMs: 16, filterFreq: 420 },
  ],
  [{ frequency: 104, durationMs: 40, type: 'triangle', gainPeak: 0.018, frequencyEnd: 82, filterFreq: 360 }],
];

const TYPE_KEY_PATCHES: TonePatch[][] = [
  [{ frequency: 180, durationMs: 20, type: 'square', gainPeak: 0.02, filterFreq: 1200 }],
  [{ frequency: 210, durationMs: 18, type: 'triangle', gainPeak: 0.018, frequencyEnd: 300 }],
  [{ frequency: 165, durationMs: 22, type: 'square', gainPeak: 0.019, filterFreq: 900 }],
  [{ frequency: 230, durationMs: 16, type: 'sine', gainPeak: 0.017 }],
];

const BUBBLE_POP_PATCHES: TonePatch[][] = [
  [
    { frequency: 120, durationMs: 110, type: 'sine', gainPeak: 0.055, frequencyEnd: 70 },
    { frequency: 240, durationMs: 72, type: 'triangle', gainPeak: 0.028, delayMs: 24, filterFreq: 700 },
  ],
  [
    { frequency: 96, durationMs: 100, type: 'square', gainPeak: 0.05, frequencyEnd: 64, filterFreq: 420 },
    { frequency: 320, durationMs: 58, type: 'sine', gainPeak: 0.022, delayMs: 20 },
  ],
];

const BUBBLE_COLLISION_PATCHES: TonePatch[][] = [
  [
    { frequency: 72, durationMs: 72, type: 'square', gainPeak: 0.044, frequencyEnd: 48, filterFreq: 220 },
    { frequency: 180, durationMs: 36, type: 'triangle', gainPeak: 0.018, delayMs: 10 },
  ],
  [{ frequency: 88, durationMs: 64, type: 'sine', gainPeak: 0.04, frequencyEnd: 58 }],
  [
    { frequency: 64, durationMs: 80, type: 'square', gainPeak: 0.038, filterFreq: 180 },
    { frequency: 200, durationMs: 28, type: 'square', gainPeak: 0.014, delayMs: 12, filterFreq: 900 },
  ],
];

const BUBBLE_MOTION_PATCHES: TonePatch[][] = [
  [
    { frequency: 280, durationMs: 62, type: 'triangle', gainPeak: 0.022, frequencyEnd: 120, filterFreq: 520 },
    { frequency: 96, durationMs: 38, type: 'square', gainPeak: 0.012, delayMs: 16, filterFreq: 280 },
  ],
  [
    { frequency: 240, durationMs: 56, type: 'sine', gainPeak: 0.02, frequencyEnd: 96 },
    { frequency: 120, durationMs: 34, type: 'triangle', gainPeak: 0.011, delayMs: 14 },
  ],
  [{ frequency: 320, durationMs: 52, type: 'triangle', gainPeak: 0.019, frequencyEnd: 140, filterFreq: 640 }],
];

const CHAT_SEND_PATCHES: TonePatch[][] = [
  [
    { frequency: 200, durationMs: 88, type: 'triangle', gainPeak: 0.044, frequencyEnd: 520 },
    { frequency: 640, durationMs: 42, type: 'square', gainPeak: 0.014, delayMs: 36, filterFreq: 1400 },
  ],
  [{ frequency: 240, durationMs: 76, type: 'sine', gainPeak: 0.04, frequencyEnd: 480 }],
];

const ARCADE_GAME_START_PATCHES: TonePatch[][] = [
  [
    { frequency: 110, durationMs: 120, type: 'square', gainPeak: 0.05 },
    { frequency: 165, durationMs: 120, type: 'square', gainPeak: 0.048, delayMs: 90 },
    { frequency: 220, durationMs: 180, type: 'triangle', gainPeak: 0.055, delayMs: 180 },
  ],
];

const ARCADE_BUBBLE_CHARGE_PATCHES: TonePatch[][] = [
  [{ frequency: 180, durationMs: 42, type: 'triangle', gainPeak: 0.028, frequencyEnd: 260 }],
  [{ frequency: 200, durationMs: 38, type: 'sine', gainPeak: 0.026, frequencyEnd: 300 }],
];

const ARCADE_BUBBLE_BIG_POP_PATCHES: TonePatch[][] = [
  [
    { frequency: 96, durationMs: 140, type: 'sine', gainPeak: 0.07, frequencyEnd: 58 },
    { frequency: 260, durationMs: 110, type: 'triangle', gainPeak: 0.04, delayMs: 36 },
    { frequency: 420, durationMs: 90, type: 'sine', gainPeak: 0.028, delayMs: 72 },
  ],
];

const ARCADE_BUBBLE_SMALL_POP_PATCHES: TonePatch[][] = [
  [
    { frequency: 120, durationMs: 95, type: 'sine', gainPeak: 0.058, frequencyEnd: 82 },
    { frequency: 240, durationMs: 72, type: 'triangle', gainPeak: 0.032, delayMs: 24 },
  ],
];

const ARCADE_GAME_TICK_PATCHES: TonePatch[][] = [
  [{ frequency: 440, durationMs: 48, type: 'square', gainPeak: 0.03, frequencyEnd: 330, filterFreq: 1200 }],
];

const ARCADE_GAME_COUNTDOWN_TICK_PATCHES: TonePatch[][] = [
  [
    { frequency: 660, durationMs: 78, type: 'square', gainPeak: 0.068, frequencyEnd: 440, filterFreq: 1500 },
    { frequency: 990, durationMs: 42, type: 'triangle', gainPeak: 0.034, delayMs: 36, filterFreq: 1800 },
  ],
];

const ARCADE_GAME_COUNTDOWN_URGENT_PATCHES: TonePatch[][] = [
  [
    { frequency: 880, durationMs: 92, type: 'square', gainPeak: 0.082, frequencyEnd: 520, filterFreq: 1700 },
    { frequency: 1320, durationMs: 56, type: 'square', gainPeak: 0.048, delayMs: 44, filterFreq: 2200 },
    { frequency: 220, durationMs: 110, type: 'sine', gainPeak: 0.04, delayMs: 18, frequencyEnd: 140 },
  ],
];

const ARCADE_GAME_OVER_PATCHES: TonePatch[][] = [
  [
    { frequency: 210, durationMs: 160, type: 'triangle', gainPeak: 0.05, frequencyEnd: 120 },
    { frequency: 90, durationMs: 220, type: 'sine', gainPeak: 0.045, delayMs: 120, frequencyEnd: 55 },
  ],
];

const ARCADE_SCORE_REVEAL_PATCHES: TonePatch[][] = [
  [
    { frequency: 165, durationMs: 90, type: 'triangle', gainPeak: 0.04 },
    { frequency: 247, durationMs: 110, type: 'sine', gainPeak: 0.042, delayMs: 70 },
    { frequency: 330, durationMs: 150, type: 'triangle', gainPeak: 0.048, delayMs: 150 },
  ],
];

const ARCADE_MENU_SELECT_PATCHES: TonePatch[][] = [
  [{ frequency: 270, durationMs: 54, type: 'square', gainPeak: 0.034, frequencyEnd: 360, filterFreq: 800 }],
];

const ARCADE_DROP_WINDOW_BUZZER_PATCHES: TonePatch[][] = [
  [
    { frequency: 210, durationMs: 280, type: 'square', gainPeak: 0.128, frequencyEnd: 72, filterFreq: 520 },
    { frequency: 148, durationMs: 220, type: 'sawtooth', gainPeak: 0.078, delayMs: 42, frequencyEnd: 58 },
    { frequency: 92, durationMs: 180, type: 'square', gainPeak: 0.052, delayMs: 88, frequencyEnd: 48, filterFreq: 280 },
  ],
  [
    { frequency: 180, durationMs: 300, type: 'square', gainPeak: 0.122, frequencyEnd: 68, filterFreq: 420 },
    { frequency: 120, durationMs: 200, type: 'triangle', gainPeak: 0.072, delayMs: 52, frequencyEnd: 54 },
    { frequency: 84, durationMs: 160, type: 'sawtooth', gainPeak: 0.048, delayMs: 96, frequencyEnd: 42 },
  ],
];

const ARCADE_STASH_BULLET_HIT_PATCHES: TonePatch[][] = [
  [{ frequency: 520, durationMs: 36, type: 'square', gainPeak: 0.028, frequencyEnd: 360, filterFreq: 1100 }],
];

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!audioContext) {
    const AudioContextCtor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) {
      return null;
    }

    audioContext = new AudioContextCtor();
  }

  return audioContext;
}

function ensureAudioUnlocked(): void {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  if (context.state === 'running') {
    audioUnlocked = true;
    return;
  }

  if (audioUnlocked) {
    return;
  }

  void context.resume().then(() => {
    audioUnlocked = context.state === 'running';
  });
}

function playNoiseBurst(durationMs: number, gainPeak: number, filterFreq = 900): void {
  if (!soundEnabled) {
    return;
  }

  ensureAudioUnlocked();

  const context = getAudioContext();

  if (!context) {
    return;
  }

  const bufferSize = Math.max(1, Math.floor(context.sampleRate * (durationMs / 1000)));
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < bufferSize; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / bufferSize);
  }

  const source = context.createBufferSource();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.7;

  const startAt = context.currentTime;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(gainPeak, startAt + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationMs / 1000);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);

  source.start(startAt);
  source.stop(startAt + durationMs / 1000 + 0.01);
}

function playTone(patch: TonePatch): void {
  if (!soundEnabled) {
    return;
  }

  ensureAudioUnlocked();

  const context = getAudioContext();

  if (!context) {
    return;
  }

  const startAt = context.currentTime + (patch.delayMs ?? 0) / 1000;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  if (patch.filterFreq) {
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = patch.filterFreq;
    filter.Q.value = patch.filterQ ?? 0.8;
    oscillator.connect(filter);
    filter.connect(gain);
  } else {
    oscillator.connect(gain);
  }

  oscillator.type = patch.type;
  oscillator.frequency.setValueAtTime(patch.frequency, startAt);

  if (patch.frequencyEnd !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(40, patch.frequencyEnd),
      startAt + patch.durationMs / 1000
    );
  }

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(patch.gainPeak, startAt + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + patch.durationMs / 1000);

  gain.connect(context.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + patch.durationMs / 1000 + 0.02);
}

function pickRandomPatch(patches: TonePatch[][]): TonePatch[] {
  return patches[Math.floor(Math.random() * patches.length)] ?? patches[0]!;
}

function playPatchSet(patches: TonePatch[][], intensity = 1): void {
  const scale = Math.max(0.35, Math.min(1.4, intensity)) * SFX_MASTER_GAIN;

  for (const patch of pickRandomPatch(patches)) {
    playTone({
      ...patch,
      gainPeak: Math.min(0.12, patch.gainPeak * scale),
    });
  }
}

function readArcadeSfxIntensityScale(): number {
  const preferences = readArcadeAudioPreferences();

  if (preferences.muted) {
    return 0;
  }

  return preferences.volume;
}

function playArcadePatchSet(patches: TonePatch[][], intensity = 1): void {
  const arcadeScale = readArcadeSfxIntensityScale();

  if (arcadeScale <= 0) {
    return;
  }

  playPatchSet(patches, intensity * arcadeScale);
}

function shouldThrottle(lastAt: number, throttleMs: number): boolean {
  const now = performance.now();

  if (now - lastAt < throttleMs) {
    return true;
  }

  return false;
}

export function setNamiSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

export function isNamiSoundEnabled(): boolean {
  return soundEnabled;
}

export function playButtonClickSfx(): void {
  playPatchSet(BUTTON_CLICK_PATCHES);
  playNoiseBurst(14, 0.009 * SFX_MASTER_GAIN, 1600);
}

export function playButtonHoverSfx(): void {
  playPatchSet(BUTTON_HOVER_PATCHES);
  playNoiseBurst(8, 0.0035 * SFX_MASTER_GAIN, 720);
}

export function playSidebarHoverSfx(): void {
  playPatchSet(SIDEBAR_HOVER_PATCHES);
  playNoiseBurst(10, 0.004 * SFX_MASTER_GAIN, 420);
}

export function playTypeKeySfx(): void {
  playPatchSet(TYPE_KEY_PATCHES);
  playNoiseBurst(6, 0.0028 * SFX_MASTER_GAIN, 1100);
}

export function playBubblePopSfx(): void {
  playPatchSet(BUBBLE_POP_PATCHES);
}

export function playBubbleCollisionSfx(intensity = 0.6): void {
  if (shouldThrottle(lastBubbleCollisionSfxAt, BUBBLE_COLLISION_THROTTLE_MS)) {
    return;
  }

  lastBubbleCollisionSfxAt = performance.now();
  playPatchSet(BUBBLE_COLLISION_PATCHES, intensity);
  playNoiseBurst(14, 0.005 * intensity * SFX_MASTER_GAIN, 320);
}

export function playBubbleMotionSfx(intensity = 0.5): void {
  if (shouldThrottle(lastBubbleMotionSfxAt, BUBBLE_MOTION_THROTTLE_MS)) {
    return;
  }

  lastBubbleMotionSfxAt = performance.now();
  playPatchSet(BUBBLE_MOTION_PATCHES, intensity);
}

export function playChatSendSfx(): void {
  playPatchSet(CHAT_SEND_PATCHES);
}

export function playArcadeGameStartSfx(): void {
  playArcadePatchSet(ARCADE_GAME_START_PATCHES);
}

export function playArcadeBubbleChargeSfx(progress = 0.5): void {
  const arcadeScale = readArcadeSfxIntensityScale();

  if (arcadeScale <= 0) {
    return;
  }

  const patches = pickRandomPatch(ARCADE_BUBBLE_CHARGE_PATCHES).map((patch) => ({
    ...patch,
    frequency: patch.frequency + progress * 80,
    gainPeak: (patch.gainPeak + progress * 0.01) * arcadeScale,
  }));

  for (const patch of patches) {
    playTone(patch);
  }
}

export function playArcadeBubblePopSfx(size: 'small' | 'big' = 'small'): void {
  playArcadePatchSet(size === 'big' ? ARCADE_BUBBLE_BIG_POP_PATCHES : ARCADE_BUBBLE_SMALL_POP_PATCHES);
}

export function playArcadeGameTickSfx(): void {
  playArcadePatchSet(ARCADE_GAME_TICK_PATCHES);
}

export function playArcadeGameCountdownTickSfx(secondsRemaining: number): void {
  const arcadeScale = readArcadeSfxIntensityScale();

  if (arcadeScale <= 0) {
    return;
  }

  const clampedSeconds = Math.min(10, Math.max(1, secondsRemaining));
  const urgency = (10 - clampedSeconds) / 9;
  const intensity = 2.4 + urgency * 2.4;

  duckArcadeGameMusic(360 + urgency * 220, 0.08 + urgency * 0.05);
  playArcadePatchSet(
    urgency >= 0.55 ? ARCADE_GAME_COUNTDOWN_URGENT_PATCHES : ARCADE_GAME_COUNTDOWN_TICK_PATCHES,
    intensity,
  );

  if (urgency >= 0.35) {
    playNoiseBurst(12 + urgency * 18, 0.02 + urgency * 0.035, 1100 + urgency * 700);
  }
}

export function playArcadeGameOverSfx(): void {
  playArcadePatchSet(ARCADE_GAME_OVER_PATCHES);
}

export function playArcadeScoreRevealSfx(): void {
  playArcadePatchSet(ARCADE_SCORE_REVEAL_PATCHES);
}

export function playArcadeMenuSelectSfx(): void {
  playArcadePatchSet(ARCADE_MENU_SELECT_PATCHES);
}

export function playArcadeDropWindowBuzzerSfx(): void {
  playArcadePatchSet(ARCADE_DROP_WINDOW_BUZZER_PATCHES, 1.45);
}

export function playArcadeStashBulletHitSfx(): void {
  playArcadePatchSet(ARCADE_STASH_BULLET_HIT_PATCHES, 0.9);
}

export function playSfx(kind: SfxKind): void {
  if (kind === 'button') {
    playButtonClickSfx();
    return;
  }

  if (kind === 'bubble') {
    playBubblePopSfx();
    return;
  }

  playChatSendSfx();
}

function isInteractiveTarget(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  return target.closest(
    'button, .primary-action, .secondary-action, .nami-surface-button, .onboarding-primary-btn, .onboarding-secondary-btn, .profile-secondary-link, .crypto-community-bubble, input[type="submit"], a[href], [role="button"]'
  );
}

function isSidebarNavTarget(element: HTMLElement): boolean {
  return Boolean(
    element.closest(
      '.sidebar-nav button, .sidebar-profile-menu button, .sidebar-player-progress-button, .nami-pinned-profile-trigger, .sidebar-profile-tag-bell'
    )
  );
}

function isTypingTarget(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement {
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
    return false;
  }

  if (target.disabled || target.readOnly) {
    return false;
  }

  if (target instanceof HTMLInputElement) {
    const type = target.type.toLowerCase();

    if (type === 'password' || type === 'checkbox' || type === 'radio' || type === 'file' || type === 'hidden') {
      return false;
    }
  }

  return true;
}

function handleHoverSfx(event: MouseEvent): void {
  const target = event.target;
  const related = event.relatedTarget;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const interactive = isInteractiveTarget(target);

  if (!interactive) {
    return;
  }

  if (related instanceof Node && interactive.contains(related)) {
    return;
  }

  const now = performance.now();

  if (now - lastHoverSfxAt < HOVER_THROTTLE_MS) {
    return;
  }

  const elementCooldown = hoverElementCooldown.get(interactive) ?? 0;

  if (now - elementCooldown < HOVER_ELEMENT_COOLDOWN_MS) {
    return;
  }

  hoverElementCooldown.set(interactive, now);
  lastHoverSfxAt = now;

  if (isSidebarNavTarget(interactive)) {
    playSidebarHoverSfx();
    return;
  }

  playButtonHoverSfx();
}

function handleTypingSfx(event: KeyboardEvent): void {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  if (event.key.length !== 1) {
    return;
  }

  if (!isTypingTarget(event.target)) {
    return;
  }

  const now = performance.now();

  if (now - lastTypeSfxAt < TYPE_THROTTLE_MS) {
    return;
  }

  lastTypeSfxAt = now;
  playTypeKeySfx();
}

export function initNamiSoundscape(): void {
  if (typeof window === 'undefined' || soundscapeInitialized) {
    return;
  }

  soundscapeInitialized = true;

  document.addEventListener('pointerdown', ensureAudioUnlocked, true);
  document.addEventListener('keydown', ensureAudioUnlocked, true);

  document.addEventListener(
    'click',
    (event) => {
      const interactive = isInteractiveTarget(event.target);

      if (!interactive) {
        return;
      }

      if (interactive.classList.contains('crypto-community-bubble') || interactive.closest('.crypto-community-bubble')) {
        playBubblePopSfx();
        return;
      }

      playButtonClickSfx();
    },
    true
  );

  document.addEventListener('mouseover', handleHoverSfx, true);

  document.addEventListener('keydown', handleTypingSfx, true);

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Enter' || !(event.target instanceof HTMLInputElement)) {
        return;
      }

      if (
        !event.target.closest(
          '.chat-composer-row, .chat-composer-with-emojis, .global-chat-composer-bar, .message-log-composer'
        )
      ) {
        return;
      }

      playChatSendSfx();
    },
    true
  );
}