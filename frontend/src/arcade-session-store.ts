import { useSyncExternalStore } from 'react';

type ArcadeSessionState = {
  stageCabinetId: string | null;
};

const listeners = new Set<() => void>();
let sessionState: ArcadeSessionState = {
  stageCabinetId: null,
};

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readSessionState(): ArcadeSessionState {
  return sessionState;
}

export function readArcadeStageCabinetId(): string | null {
  return sessionState.stageCabinetId;
}

export function setArcadeStageCabinetId(cabinetId: string | null): void {
  sessionState = {
    stageCabinetId: cabinetId,
  };
  emit();
}

export function clearArcadeSession(): void {
  sessionState = {
    stageCabinetId: null,
  };
  emit();
}

export function useArcadeStageCabinetId(): string | null {
  return useSyncExternalStore(subscribe, () => readSessionState().stageCabinetId, () => null);
}

export function resetArcadeSessionStoreForTests(): void {
  sessionState = {
    stageCabinetId: null,
  };
  listeners.forEach((listener) => listener());
}