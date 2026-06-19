import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';

import { subscribeMessagesStore } from './messages-store.js';
import { subscribeIntersectionPause } from './perf-utils.js';

export function scrollChatStackToBottom(stack: HTMLElement | null | undefined): void {
  if (!stack) {
    return;
  }

  stack.scrollTop = stack.scrollHeight;
}

export function usePausedMessagesStoreSignal(paused: boolean): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (paused) {
      return;
    }

    return subscribeMessagesStore(() => {
      setTick((value) => value + 1);
    });
  }, [paused]);

  return tick;
}

type ChatViewportPauseState = {
  paused: boolean;
  resumeCount: number;
  viewportRef: (node: HTMLElement | null) => void;
  messageStackRef: RefObject<HTMLDivElement | null>;
};

export function useChatViewportPause(): ChatViewportPauseState {
  const messageStackRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [resumeCount, setResumeCount] = useState(0);
  const wasPausedRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const viewportRef = useCallback((node: HTMLElement | null) => {
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (!node) {
      return;
    }

    cleanupRef.current = subscribeIntersectionPause(node, (isPaused) => {
      if (wasPausedRef.current && !isPaused) {
        setResumeCount((count) => count + 1);
      }

      wasPausedRef.current = isPaused;
      setPaused(isPaused);
    });
  }, []);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return { paused, resumeCount, viewportRef, messageStackRef };
}

export function useFrozenChatMessages<T>(
  paused: boolean,
  resumeCount: number,
  storeSignal: number,
  computeMessages: () => T
): T {
  const frozenRef = useRef<T>(computeMessages());

  useEffect(() => {
    if (paused) {
      frozenRef.current = computeMessages();
    }
  }, [paused, storeSignal, computeMessages]);

  return useMemo(() => {
    if (paused) {
      return frozenRef.current;
    }

    const next = computeMessages();
    frozenRef.current = next;
    return next;
  }, [paused, resumeCount, storeSignal, computeMessages]);
}

export function useChatAutoScroll(
  stackRef: RefObject<HTMLElement | null>,
  options: {
    paused: boolean;
    resumeCount: number;
    messageCount: number;
  }
): void {
  const { paused, resumeCount, messageCount } = options;

  useEffect(() => {
    if (paused) {
      return;
    }

    scrollChatStackToBottom(stackRef.current);
  }, [messageCount, paused, stackRef]);

  useEffect(() => {
    if (resumeCount === 0) {
      return;
    }

    window.requestAnimationFrame(() => {
      scrollChatStackToBottom(stackRef.current);
    });
  }, [resumeCount, messageCount, stackRef]);
}