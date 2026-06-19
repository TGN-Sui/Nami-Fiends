import { useEffect, useRef, type ReactElement } from 'react';

import { startSpotlightMotion } from './nami-spotlight-motion.js';
import { subscribeVisibilityPause } from './perf-utils.js';

type NamiGridSpotlightProps = {
  scope: 'landing' | 'app';
};

const SCOPE_CLASS = {
  landing: 'is-landing-page',
  app: 'is-nami-app-spotlight',
} as const;

export function NamiGridSpotlight(props: NamiGridSpotlightProps): ReactElement {
  const motionPausedRef = useRef(false);

  useEffect(() => {
    const scopeClass = SCOPE_CLASS[props.scope];

    document.documentElement.classList.add(scopeClass);

    const unsubscribeVisibility = subscribeVisibilityPause((hidden) => {
      motionPausedRef.current = hidden;
      document.documentElement.classList.toggle('is-ambient-motion-paused', hidden);
    });

    const stopSpotlightMotion = startSpotlightMotion(() => motionPausedRef.current);

    return () => {
      unsubscribeVisibility();
      stopSpotlightMotion();
      document.documentElement.classList.remove(scopeClass);
      document.documentElement.classList.remove('is-ambient-motion-paused');
    };
  }, [props.scope]);

  return <div aria-hidden="true" className="nami-landing-grid-spotlight" />;
}