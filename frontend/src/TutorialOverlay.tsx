import { useEffect, useLayoutEffect, useState, type ReactElement } from 'react';

import { persistTutorialStatus } from './tutorial-queue.js';
import { TUTORIAL_STEPS_V1, type TutorialStep } from './tutorial-registry.js';

type TutorialPlayDetail = {
  owner: string;
  force?: boolean;
  steps?: TutorialStep[];
};

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function readSpotlight(target?: string): SpotlightRect | null {
  if (!target) {
    return null;
  }

  const element = document.querySelector(target);

  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();

  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export function TutorialOverlay(): ReactElement | null {
  const [active, setActive] = useState(false);
  const [owner, setOwner] = useState<string | null>(null);
  const [steps, setSteps] = useState<TutorialStep[]>(TUTORIAL_STEPS_V1);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

  const step = steps[stepIndex];
  const isLastStep = stepIndex >= steps.length - 1;

  function closeTutorial(status: 'completed' | 'skipped'): void {
    if (owner?.startsWith('0x')) {
      void persistTutorialStatus(owner, status);
    }

    setActive(false);
    setStepIndex(0);
    setOwner(null);
    setSpotlight(null);
    window.dispatchEvent(new CustomEvent('nami-tutorial-complete'));
  }

  useEffect(() => {
    function handlePlay(event: Event): void {
      const detail = (event as CustomEvent<TutorialPlayDetail>).detail;

      if (!detail?.owner?.startsWith('0x')) {
        return;
      }

      setOwner(detail.owner);
      setSteps(detail.steps ?? TUTORIAL_STEPS_V1);
      setStepIndex(0);
      setActive(true);
    }

    function handleRestart(event: Event): void {
      const detail = (event as CustomEvent<{ owner?: string }>).detail;
      const nextOwner = detail?.owner;

      if (!nextOwner?.startsWith('0x')) {
        return;
      }

      setOwner(nextOwner);
      setSteps(TUTORIAL_STEPS_V1);
      setStepIndex(0);
      setActive(true);
    }

    window.addEventListener('nami-tutorial-play', handlePlay as EventListener);
    window.addEventListener('nami-tutorial-restart', handleRestart as EventListener);

    return () => {
      window.removeEventListener('nami-tutorial-play', handlePlay as EventListener);
      window.removeEventListener('nami-tutorial-restart', handleRestart as EventListener);
    };
  }, []);

  useLayoutEffect(() => {
    const currentStep = steps[stepIndex];

    if (!active || !currentStep) {
      return;
    }

    const spotlightTarget = currentStep.target;

    function updateSpotlight(): void {
      setSpotlight(readSpotlight(spotlightTarget));
    }

    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);

    return () => {
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
    };
  }, [active, stepIndex, steps]);

  if (!active || !step) {
    return null;
  }

  const cardStyle = spotlight
    ? {
        top: Math.min(window.innerHeight - 220, spotlight.top + spotlight.height + 16),
        left: Math.min(
          window.innerWidth - 340,
          Math.max(16, spotlight.left + spotlight.width / 2 - 170),
        ),
      }
    : undefined;

  return (
    <div className="nami-tutorial-overlay" role="presentation">
      {spotlight ? (
        <span
          aria-hidden="true"
          className="nami-tutorial-spotlight"
          style={{
            top: spotlight.top - 6,
            left: spotlight.left - 6,
            width: spotlight.width + 12,
            height: spotlight.height + 12,
          }}
        />
      ) : null}

      <article
        className={
          'nami-tutorial-card' + (spotlight ? ' is-anchored' : ' is-centered')
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="nami-tutorial-title"
        style={cardStyle}
      >
        <span className="mini-badge">Realm guide</span>
        <h2 id="nami-tutorial-title">{step.title}</h2>
        <p>{step.body}</p>
        <div className="nami-tutorial-progress" aria-hidden="true">
          {steps.map((entry, index) => (
            <span
              key={entry.id}
              className={'nami-tutorial-progress-dot' + (index === stepIndex ? ' is-active' : '')}
            />
          ))}
        </div>
        <div className="nami-tutorial-actions">
          <button
            className="nami-surface-button"
            onClick={() => closeTutorial('skipped')}
            type="button"
          >
            Skip tour
          </button>
          {isLastStep ? (
            <button
              className="nami-surface-button is-primary-surface-button"
              onClick={() => closeTutorial('completed')}
              type="button"
            >
              Enter Nami
            </button>
          ) : (
            <button
              className="nami-surface-button is-primary-surface-button"
              onClick={() => setStepIndex((value) => value + 1)}
              type="button"
            >
              Next
            </button>
          )}
        </div>
      </article>
    </div>
  );
}