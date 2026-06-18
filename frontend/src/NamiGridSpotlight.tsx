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

    function onPointerMove(event: PointerEvent): void {
      document.documentElement.style.setProperty('--nami-spotlight-x', event.clientX + 'px');
      document.documentElement.style.setProperty('--nami-spotlight-y', event.clientY + 'px');
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.classList.remove(scopeClass);
      document.documentElement.style.removeProperty('--nami-spotlight-x');
      document.documentElement.style.removeProperty('--nami-spotlight-y');
    };
  }, [props.scope]);

  return <div aria-hidden="true" className="nami-landing-grid-spotlight" />;
}