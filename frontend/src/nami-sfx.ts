type SfxKind = 'button' | 'bubble' | 'chat';

type TonePatch = {
  frequency: number;
  durationMs: number;
  type: OscillatorType;
  gainPeak: number;
  frequencyEnd?: number;
  delayMs?: number;
};

let audioContext: AudioContext | null = null;
let soundEnabled = true;

const BUTTON_CLICK_PATCHES: TonePatch[][] = [
  [{ frequency: 520, durationMs: 70, type: 'triangle', gainPeak: 0.045 }],
  [{ frequency: 440, durationMs: 62, type: 'square', gainPeak: 0.038 }],
  [{ frequency: 610, durationMs: 58, type: 'sine', gainPeak: 0.042, frequencyEnd: 720 }],
  [
    { frequency: 380, durationMs: 48, type: 'triangle', gainPeak: 0.03 },
    { frequency: 540, durationMs: 56, type: 'sine', gainPeak: 0.028, delayMs: 24 },
  ],
  [{ frequency: 680, durationMs: 54, type: 'square', gainPeak: 0.034, frequencyEnd: 520 }],
  [{ frequency: 470, durationMs: 66, type: 'triangle', gainPeak: 0.04, frequencyEnd: 390 }],
  [{ frequency: 560, durationMs: 64, type: 'sine', gainPeak: 0.041, frequencyEnd: 430 }],
  [
    { frequency: 410, durationMs: 52, type: 'square', gainPeak: 0.033 },
    { frequency: 620, durationMs: 48, type: 'triangle', gainPeak: 0.028, delayMs: 20 },
  ],
];

const BUBBLE_POP_PATCHES: TonePatch[][] = [
  [
    { frequency: 280, durationMs: 120, type: 'sine', gainPeak: 0.06, frequencyEnd: 180 },
    { frequency: 420, durationMs: 90, type: 'sine', gainPeak: 0.035, frequencyEnd: 640, delayMs: 30 },
  ],
  [
    { frequency: 240, durationMs: 110, type: 'triangle', gainPeak: 0.055, frequencyEnd: 160 },
    { frequency: 360, durationMs: 80, type: 'sine', gainPeak: 0.03, frequencyEnd: 520, delayMs: 28 },
  ],
  [
    { frequency: 310, durationMs: 95, type: 'sine', gainPeak: 0.058, frequencyEnd: 210 },
    { frequency: 500, durationMs: 70, type: 'triangle', gainPeak: 0.032, delayMs: 22 },
  ],
  [{ frequency: 260, durationMs: 130, type: 'sine', gainPeak: 0.062, frequencyEnd: 140 }],
];

const CHAT_SEND_PATCHES: TonePatch[][] = [
  [{ frequency: 360, durationMs: 100, type: 'triangle', gainPeak: 0.05, frequencyEnd: 720 }],
  [{ frequency: 420, durationMs: 88, type: 'sine', gainPeak: 0.048, frequencyEnd: 680 }],
  [
    { frequency: 300, durationMs: 72, type: 'triangle', gainPeak: 0.04 },
    { frequency: 540, durationMs: 84, type: 'sine', gainPeak: 0.036, frequencyEnd: 760, delayMs: 18 },
  ],
  [{ frequency: 390, durationMs: 92, type: 'square', gainPeak: 0.042, frequencyEnd: 610 }],
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

  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }

  return audioContext;
}

function playTone(patch: TonePatch): void {
  if (!soundEnabled) {
    return;
  }

  const context = getAudioContext();

  if (!context) {
    return;
  }

  const startAt = context.currentTime + (patch.delayMs ?? 0) / 1000;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = patch.type;
  oscillator.frequency.setValueAtTime(patch.frequency, startAt);

  if (patch.frequencyEnd !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(40, patch.frequencyEnd),
      startAt + patch.durationMs / 1000
    );
  }

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(patch.gainPeak, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + patch.durationMs / 1000);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + patch.durationMs / 1000 + 0.02);
}

function pickRandomPatch(patches: TonePatch[][]): TonePatch[] {
  return patches[Math.floor(Math.random() * patches.length)] ?? patches[0]!;
}

function playPatchSet(patches: TonePatch[][]): void {
  for (const patch of pickRandomPatch(patches)) {
    playTone(patch);
  }
}

export function playButtonClickSfx(): void {
  playPatchSet(BUTTON_CLICK_PATCHES);
}

export function playBubblePopSfx(): void {
  playPatchSet(BUBBLE_POP_PATCHES);
}

export function playChatSendSfx(): void {
  playPatchSet(CHAT_SEND_PATCHES);
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
    'button, .primary-action, .secondary-action, .nami-surface-button, .onboarding-primary-btn, .onboarding-secondary-btn, .profile-secondary-link, .crypto-community-bubble, input[type="submit"]'
  );
}

export function initNamiSoundscape(): void {
  if (typeof window === 'undefined') {
    return;
  }

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

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Enter' || !(event.target instanceof HTMLInputElement)) {
        return;
      }

      if (
        !event.target.closest(
          '.chat-composer-row, .chat-composer-with-emojis, .global-chat-composer, .message-log-composer'
        )
      ) {
        return;
      }

      playChatSendSfx();
    },
    true
  );
}