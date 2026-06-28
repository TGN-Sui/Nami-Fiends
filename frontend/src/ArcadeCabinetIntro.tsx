import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';

import { arcadeCabinetMediaSlotId } from './arcade-cabinet-media.js';
import {
  ARCADE_CABINET_INTRO_LOADING_TIMEOUT_MS,
  ARCADE_CABINET_INTRO_STALL_TIMEOUT_MS,
  resolveArcadeCabinetIntroMedia,
} from './arcade-cabinet-intro.js';
import { useChannelOwnerMediaVersion } from './channel-owner-media-store.js';
import { resolveOwnerAssetUrl } from './nami-owner-edit-mode-store.js';
import { useNamiOwnerAssets } from './nami-owner-assets-store.js';

type ArcadeCabinetIntroProps = {
  cabinetId: string;
  cabinetTitle: string;
  onComplete: () => void;
};

export function ArcadeCabinetIntro(props: ArcadeCabinetIntroProps): ReactElement {
  const persistedAssets = useNamiOwnerAssets();
  const mediaVersion = useChannelOwnerMediaVersion();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const completedRef = useRef(false);
  const playbackStartedRef = useRef(false);
  const lastProgressAtRef = useRef(performance.now());
  const lastCurrentTimeRef = useRef(0);
  const [preferPublicFallback, setPreferPublicFallback] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [playbackStalled, setPlaybackStalled] = useState(false);

  const storedIntroValue = useMemo(
    () =>
      resolveOwnerAssetUrl(
        arcadeCabinetMediaSlotId(props.cabinetId, 'intro'),
        persistedAssets,
      ),
    [mediaVersion, persistedAssets, props.cabinetId],
  );

  const introMedia = useMemo(
    () => resolveArcadeCabinetIntroMedia(props.cabinetId, storedIntroValue, preferPublicFallback),
    [preferPublicFallback, props.cabinetId, storedIntroValue],
  );

  const finishIntro = useCallback((): void => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    props.onComplete();
  }, [props.onComplete]);

  const attemptPlay = useCallback((): void => {
    const video = videoRef.current;

    if (!video || completedRef.current || introMedia.kind !== 'video' || !introMedia.url) {
      return;
    }

    void video
      .play()
      .then(() => {
        playbackStartedRef.current = true;
        lastProgressAtRef.current = performance.now();
        setNeedsGesture(false);
        setPlaybackStalled(false);
      })
      .catch(() => {
        setNeedsGesture(true);
        setPlaybackStalled(true);
      });
  }, [introMedia.kind, introMedia.url]);

  useEffect(() => {
    completedRef.current = false;
    playbackStartedRef.current = false;
    lastProgressAtRef.current = performance.now();
    lastCurrentTimeRef.current = 0;
    setNeedsGesture(false);
    setPlaybackStalled(false);
    setPreferPublicFallback(false);
  }, [introMedia.url, props.cabinetId]);

  useEffect(() => {
    if (introMedia.kind !== 'loading') {
      return;
    }

    const timer = window.setTimeout(() => {
      setPreferPublicFallback(true);
    }, ARCADE_CABINET_INTRO_LOADING_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [introMedia.kind, props.cabinetId, storedIntroValue]);

  useEffect(() => {
    if (introMedia.kind !== 'video' || !introMedia.url) {
      return;
    }

    const video = videoRef.current;

    if (!video) {
      return;
    }

    function markProgress(): void {
      const element = videoRef.current;

      if (!element || completedRef.current) {
        return;
      }

      if (element.currentTime > lastCurrentTimeRef.current + 0.02 || element.ended) {
        lastCurrentTimeRef.current = element.currentTime;
        lastProgressAtRef.current = performance.now();
        setPlaybackStalled(false);
        setNeedsGesture(false);
      }
    }

    function handleLoadedData(): void {
      const element = videoRef.current;

      if (!element || playbackStartedRef.current || completedRef.current) {
        return;
      }

      element.currentTime = 0;
      attemptPlay();
    }

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', markProgress);
    video.addEventListener('playing', markProgress);

    if (video.readyState >= 2) {
      handleLoadedData();
    }

    const stallTimer = window.setInterval(() => {
      const element = videoRef.current;

      if (!element || completedRef.current || element.ended) {
        return;
      }

      const stalledFor = performance.now() - lastProgressAtRef.current;

      if (stalledFor >= ARCADE_CABINET_INTRO_STALL_TIMEOUT_MS) {
        setPlaybackStalled(true);
        setNeedsGesture(true);
      }
    }, 500);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', markProgress);
      video.removeEventListener('playing', markProgress);
      window.clearInterval(stallTimer);
    };
  }, [attemptPlay, introMedia.kind, introMedia.url]);

  if (introMedia.kind === 'loading') {
    return (
      <div
        aria-busy="true"
        aria-label={props.cabinetTitle + ' walk-up intro loading'}
        className="arcade-cabinet-intro is-loading"
      />
    );
  }

  if (introMedia.kind !== 'video' || !introMedia.url) {
    return (
      <div
        aria-label={props.cabinetTitle + ' walk-up intro unavailable'}
        className="arcade-cabinet-intro is-unavailable is-interactive"
      >
        <button className="arcade-cabinet-intro-continue" onClick={finishIntro} type="button">
          Continue to {props.cabinetTitle}
        </button>
      </div>
    );
  }

  const showContinue = needsGesture || playbackStalled;

  return (
    <div
      aria-label={props.cabinetTitle + ' walk-up intro'}
      className={
        'arcade-cabinet-intro' + (showContinue ? ' is-interactive needs-gesture' : '')
      }
      onPointerDown={() => {
        if (showContinue) {
          attemptPlay();
        }
      }}
    >
      <video
        aria-label={props.cabinetTitle + ' walk-up video'}
        autoPlay
        className="arcade-cabinet-intro-video"
        key={introMedia.url}
        muted
        onEnded={finishIntro}
        onError={finishIntro}
        playsInline
        preload="auto"
        ref={videoRef}
        src={introMedia.url}
      />

      {showContinue ? (
        <button className="arcade-cabinet-intro-continue" onClick={attemptPlay} type="button">
          Tap to start walk-up
        </button>
      ) : null}
    </div>
  );
}