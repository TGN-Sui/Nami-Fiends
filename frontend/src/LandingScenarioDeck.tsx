import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';

import { LANDING_SCENARIOS, type LandingScenario } from './landing-content.js';

const FLIP_DELAY_MS = 520;
const DRAW_ANIMATION_MS = 360;

function shuffleDeck(size: number): number[] {
  const order = Array.from({ length: size }, (_, index) => index);

  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = order[index]!;
    order[index] = order[swapIndex]!;
    order[swapIndex] = current;
  }

  return order;
}

type DeckPhase = 'ready' | 'drawing' | 'revealed';

export function LandingScenarioDeck(): ReactElement {
  const [deckOrder, setDeckOrder] = useState(() => shuffleDeck(LANDING_SCENARIOS.length));
  const [deckCursor, setDeckCursor] = useState(0);
  const [phase, setPhase] = useState<DeckPhase>('ready');
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeScenario, setActiveScenario] = useState<LandingScenario | null>(null);
  const flipTimerRef = useRef<number | null>(null);
  const drawTimerRef = useRef<number | null>(null);

  const cardsRemaining = Math.max(0, deckOrder.length - deckCursor);

  const clearTimers = useCallback((): void => {
    if (flipTimerRef.current !== null) {
      window.clearTimeout(flipTimerRef.current);
      flipTimerRef.current = null;
    }

    if (drawTimerRef.current !== null) {
      window.clearTimeout(drawTimerRef.current);
      drawTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  function beginDraw(order: number[], cursor: number): void {
    const scenario = LANDING_SCENARIOS[order[cursor]!]!;

    setDeckCursor(cursor + 1);
    setPhase('drawing');
    setIsFlipped(false);
    setActiveScenario(scenario);

    drawTimerRef.current = window.setTimeout(() => {
      setPhase('revealed');

      flipTimerRef.current = window.setTimeout(() => {
        setIsFlipped(true);
      }, FLIP_DELAY_MS);
    }, DRAW_ANIMATION_MS);
  }

  function drawScenario(): void {
    if (phase === 'drawing' || (phase === 'revealed' && !isFlipped)) {
      return;
    }

    clearTimers();

    let nextOrder = deckOrder;
    let nextCursor = deckCursor;

    if (nextCursor >= nextOrder.length) {
      nextOrder = shuffleDeck(LANDING_SCENARIOS.length);
      nextCursor = 0;
      setDeckOrder(nextOrder);
    }

    if (phase === 'revealed' && isFlipped) {
      setIsFlipped(false);
      drawTimerRef.current = window.setTimeout(() => {
        beginDraw(nextOrder, nextCursor);
      }, 360);
      return;
    }

    beginDraw(nextOrder, nextCursor);
  }

  const showActiveCard = activeScenario !== null && phase !== 'ready';
  const drawLabel =
    phase === 'drawing'
      ? 'Drawing…'
      : phase === 'revealed' && !isFlipped
        ? 'Flipping…'
        : phase === 'revealed'
          ? 'Draw next scenario'
          : 'Draw a scenario card';

  return (
    <div className="nami-landing-scenario-deck">
      <div className="nami-landing-scenario-deck-stage" aria-live="polite">
        <div className="nami-landing-scenario-deck-stack" aria-hidden="true">
          <div className="nami-landing-scenario-deck-card is-shadow is-third" />
          <div className="nami-landing-scenario-deck-card is-shadow is-second" />
          <div className="nami-landing-scenario-deck-card is-shadow is-top">
            <span className="nami-landing-scenario-deck-back-mark">Nami</span>
            <small>{cardsRemaining} left</small>
          </div>
        </div>

        {showActiveCard && activeScenario ? (
          <article
            className={
              'nami-landing-scenario-flip-card' +
              (phase === 'drawing' ? ' is-drawing' : '') +
              (isFlipped ? ' is-flipped' : '')
            }
          >
            <div className="nami-landing-scenario-flip-inner">
              <div className="nami-landing-scenario-flip-face is-front">
                <span className="mini-badge">Scenario</span>
                <h3>{activeScenario.title}</h3>
                <p>This card flips automatically to show the split.</p>
              </div>

              <div className="nami-landing-scenario-flip-face is-back">
                <div className="nami-landing-scenario-split">
                  <div>
                    <span className="nami-landing-scenario-label">Without Nami</span>
                    <p>{activeScenario.pain}</p>
                  </div>
                  <div>
                    <span className="nami-landing-scenario-label is-nami">With Nami</span>
                    <p>{activeScenario.namiWay}</p>
                  </div>
                </div>
                <footer className="nami-landing-scenario-outcome">
                  <strong>{activeScenario.outcome}</strong>
                </footer>
              </div>
            </div>
          </article>
        ) : null}
      </div>

      <div className="nami-landing-scenario-deck-actions">
        <button
          className="primary-action"
          disabled={phase === 'drawing' || (phase === 'revealed' && !isFlipped)}
          onClick={drawScenario}
          type="button"
        >
          {drawLabel}
        </button>
        <p className="nami-landing-scenario-deck-note">
          Pull from the deck to reveal a real gamer situation. Each card auto-flips to show life
          without Nami versus with Nami.
        </p>
      </div>
    </div>
  );
}