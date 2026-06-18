import { useEffect, type ReactElement } from 'react';

export function LandingGridSpotlight(): ReactElement {
  useEffect(() => {
    document.documentElement.classList.add('is-landing-page');

    function onPointerMove(event: PointerEvent): void {
      document.documentElement.style.setProperty('--nami-spotlight-x', event.clientX + 'px');
      document.documentElement.style.setProperty('--nami-spotlight-y', event.clientY + 'px');
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.classList.remove('is-landing-page');
      document.documentElement.style.removeProperty('--nami-spotlight-x');
      document.documentElement.style.removeProperty('--nami-spotlight-y');
    };
  }, []);

  return <div aria-hidden="true" className="nami-landing-grid-spotlight" />;
}