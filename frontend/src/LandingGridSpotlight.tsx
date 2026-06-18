import { useEffect, type ReactElement } from 'react';

export function LandingGridSpotlight(): ReactElement {
  useEffect(() => {
    document.documentElement.classList.add('is-landing-page');

    function onPointerMove(event: PointerEvent): void {
      const x = (event.clientX / Math.max(window.innerWidth, 1)) * 100;
      const y = (event.clientY / Math.max(window.innerHeight, 1)) * 100;

      document.documentElement.style.setProperty('--nami-spotlight-x', x.toFixed(2) + '%');
      document.documentElement.style.setProperty('--nami-spotlight-y', y.toFixed(2) + '%');
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