import { useCallback, useEffect, useRef, useState } from 'react';

import {
  advanceGameHubSwipeDeckIndex,
  shuffleGameHubBrowserDeckEntries,
  type GameHubBrowserDeckEntry,
} from './gamehub-browser-deck.js';
import { playGameHubDeckFlipSfx, playGameHubDeckReshuffleSfx } from './nami-sfx.js';

const DECK_FLIP_MS = 440;
const DECK_SETTLE_MS = 360;
const DECK_RESHUFFLE_FLASH_MS = 280;

export type GameHubSwipeDeckMotion = 'idle' | 'next' | 'previous' | 'settle' | 'reshuffle';

export function useGameHubSwipeDeck(sourceEntries: GameHubBrowserDeckEntry[]): {
  deckEntries: GameHubBrowserDeckEntry[];
  deckIndex: number;
  deckMotion: GameHubSwipeDeckMotion;
  reshuffleCount: number;
  canGoPrevious: boolean;
  advanceDeck: (direction: 'next' | 'previous') => void;
} {
  const [deckEntries, setDeckEntries] = useState(() => shuffleGameHubBrowserDeckEntries(sourceEntries));
  const [deckIndex, setDeckIndex] = useState(0);
  const [deckMotion, setDeckMotion] = useState<GameHubSwipeDeckMotion>('idle');
  const [reshuffleCount, setReshuffleCount] = useState(0);
  const animatingRef = useRef(false);
  const motionTimersRef = useRef<number[]>([]);

  const clearMotionTimers = useCallback((): void => {
    for (const timerId of motionTimersRef.current) {
      window.clearTimeout(timerId);
    }

    motionTimersRef.current = [];
  }, []);

  const queueMotionTimer = useCallback((callback: () => void, delayMs: number): void => {
    const timerId = window.setTimeout(callback, delayMs);
    motionTimersRef.current.push(timerId);
  }, []);

  useEffect(() => {
    clearMotionTimers();
    animatingRef.current = false;
    setDeckEntries(shuffleGameHubBrowserDeckEntries(sourceEntries));
    setDeckIndex(0);
    setDeckMotion('idle');
  }, [clearMotionTimers, sourceEntries]);

  useEffect(() => {
    return () => {
      clearMotionTimers();
    };
  }, [clearMotionTimers]);

  const finishSettle = useCallback((): void => {
    setDeckMotion('settle');
    queueMotionTimer(() => {
      setDeckMotion('idle');
      animatingRef.current = false;
    }, DECK_SETTLE_MS);
  }, [queueMotionTimer]);

  const advanceDeck = useCallback(
    (direction: 'next' | 'previous'): void => {
      if (animatingRef.current || deckEntries.length === 0) {
        return;
      }

      const advanceResult = advanceGameHubSwipeDeckIndex(deckIndex, deckEntries.length, direction);

      if (!advanceResult) {
        return;
      }

      clearMotionTimers();
      animatingRef.current = true;
      setDeckMotion(direction);
      playGameHubDeckFlipSfx(direction);

      queueMotionTimer(() => {
        if (advanceResult.reshuffled) {
          setDeckEntries(shuffleGameHubBrowserDeckEntries(deckEntries));
          setDeckIndex(0);
          setReshuffleCount((value) => value + 1);
          setDeckMotion('reshuffle');
          playGameHubDeckReshuffleSfx();

          queueMotionTimer(() => {
            finishSettle();
          }, DECK_RESHUFFLE_FLASH_MS);

          return;
        }

        setDeckIndex(advanceResult.nextIndex);
        finishSettle();
      }, DECK_FLIP_MS);
    },
    [clearMotionTimers, deckEntries, deckIndex, finishSettle, queueMotionTimer],
  );

  return {
    deckEntries,
    deckIndex,
    deckMotion,
    reshuffleCount,
    canGoPrevious: deckIndex > 0,
    advanceDeck,
  };
}