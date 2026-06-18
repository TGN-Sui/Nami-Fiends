import { useEffect, type ReactElement } from 'react';

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

    return () => {
      document.documentElement.classList.remove(scopeClass);
    };
  }, [props.scope]);

  return <div aria-hidden="true" className="nami-landing-grid-spotlight" />;
}