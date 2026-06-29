import { useEffect, useState } from 'react';

/** Ignore result-screen button clicks briefly after a run ends. */
export const ARCADE_RESULTS_INPUT_LOCK_MS = 1_100;

export function useArcadeResultsInputLock(): boolean {
  const [inputLocked, setInputLocked] = useState(true);

  useEffect(() => {
    setInputLocked(true);

    const timeout = globalThis.setTimeout(() => {
      setInputLocked(false);
    }, ARCADE_RESULTS_INPUT_LOCK_MS);

    return () => {
      globalThis.clearTimeout(timeout);
    };
  }, []);

  return inputLocked;
}