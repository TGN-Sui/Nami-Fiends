import { useEffect, type ReactElement } from 'react';

import { subscribeVisibilityPause } from './perf-utils.js';

type NamiGridSpotlightProps = {
  scope: 'landing' | 'app';
};

const SCOPE_CLASS = {
  landing: 'is-landing-page',
  app: 'is-nami-app-spotlight',
} as const;

export function NamiGridSpotlight(props: NamiGridSpotlightProps): ReactElement {
  useEffect(() => {
    const scopeClass = SCOPE_CLASS[props.scope];

    document.documentElement.classList.add(scopeClass);

    const unsubscribeVisibility = subscribeVisibilityPause((hidden) => {
      document.documentElement.classList.toggle('is-ambient-motion-paused', hidden);
    });

    return () => {
      unsubscribeVisibility();
      document.documentElement.classList.remove(scopeClass);
      document.documentElement.classList.remove('is-ambient-motion-paused');
    };
  }, [props.scope]);

  return <div aria-hidden="true" className="nami-landing-grid-spotlight" />;
}