import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';

import { LANDING_SCENARIOS, type LandingScenario } from './landing-content.js';

const FLIP_DELAY_MS = 3000;
const DISCARD_MS = 480;
const SHIFT_MS = 340;
const DRAW_MS = 380;

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

type DeckPhase = 'ready' | 'discarding' | 'shifting' | 'drawing' | 'revealed';

export function LandingScenarioDeck(): ReactElement {
  const [deckOrder, setDeckOrder] = useState(() => shuffleDeck(LANDING_SCENARIOS.length));
  const [deckCursor, setDeckCursor] = useState(0);
  const [phase, setPhase] = useState<DeckPhase>('ready');
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeScenario, setActiveScenario] = useState<LandingScenario | null>(null);
  const [discardingScenario, setDiscardingScenario] = useState<LandingScenario | null>(null);
  const flipTimerRef = useRef<number | null>(null);
  const phaseTimerRef = useRef<number | null>(null);

  const cardsRemaining = Math.max(0, deckOrder.length - deckCursor);
  const nextScenarioIndex = deckOrder[deckCursor % deckOrder.length] ?? 0;
  const nextScenario = LANDING_SCENARIOS[nextScenarioIndex]!;

  const clearTimers = useCallback((): void => {
    if (flipTimerRef.current !== null) {
      window.clearTimeout(flipTimerRef.current);
      flipTimerRef.current = null;
    }

    if (phaseTimerRef.current !== null) {
      window.clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  function revealDrawnCard(): void {
    setPhase('revealed');

    flipTimerRef.current = window.setTimeout(() => {
      setIsFlipped(true);
    }, FLIP_DELAY_MS);
  }

  function pullScenario(order: number[], cursor: number): void {
    const scenario = LANDING_SCENARIOS[order[cursor]!]!;

    setDeckCursor(cursor + 1);
    setPhase('drawing');
    setIsFlipped(false);
    setActiveScenario(scenario);

    phaseTimerRef.current = window.setTimeout(() => {
      revealDrawnCard();
    }, DRAW_MS);
  }

  function advanceDeck(order: number[], cursor: number): void {
    setPhase('shifting');

    phaseTimerRef.current = window.setTimeout(() => {
      pullScenario(order, cursor);
    }, SHIFT_MS);
  }

  function drawScenario(): void {
    if (phase === 'discarding' || phase === 'shifting' || phase === 'drawing') {
      return;
    }

    if (phase === 'revealed' && !isFlipped) {
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

    if (phase === 'revealed' && isFlipped && activeScenario) {
      setDiscardingScenario(activeScenario);
      setActiveScenario(null);
      setIsFlipped(false);
      setPhase('discarding');

      phaseTimerRef.current = window.setTimeout(() => {
        setDiscardingScenario(null);
        advanceDeck(nextOrder, nextCursor);
      }, DISCARD_MS);
      return;
    }

    advanceDeck(nextOrder, nextCursor);
  }

  const showActiveCard = activeScenario !== null && phase !== 'ready' && phase !== 'discarding';
  const drawLabel =
    phase === 'discarding'
      ? 'Discarding…'
      : phase === 'shifting'
        ? 'Deck shifting…'
        : phase === 'drawing'
          ? 'Drawing…'
          : phase === 'revealed' && !isFlipped
            ? 'Flipping soon…'
            : phase === 'revealed'
              ? 'Draw next scenario'
              : 'Draw a scenario card';

  return (
    <div className="nami-landing-scenario-deck">
      <div className="nami-landing-scenario-deck-stage" aria-live="polite">
        <div
          className={
            'nami-landing-scenario-deck-stack' +
            (phase === 'shifting' || phase === 'drawing' ? ' is-advancing' : '')
          }
        >
          <div className="nami-landing-scenario-deck-card is-shadow is-third" />
          <div className="nami-landing-scenario-deck-card is-shadow is-second" />
          <article className="nami-landing-scenario-deck-card is-face is-top">
            <span className="nami-landing-scenario-deck-brand-mark" aria-hidden="true">
              Nami
            </span>
            <span className="mini-badge">Next scenario</span>
            <h4>{nextScenario.title}</h4>
            <small>{cardsRemaining} ready to draw</small>
          </article>
        </div>

        {discardingScenario ? (
          <article className="nami-landing-scenario-flip-card is-discarding">
            <div className="nami-landing-scenario-flip-inner is-flipped">
              <div className="nami-landing-scenario-flip-face is-front">
                <span className="mini-badge">Scenario</span>
                <h3>{discardingScenario.title}</h3>
              </div>
              <div className="nami-landing-scenario-flip-face is-back">
                <footer className="nami-landing-scenario-outcome">
                  <strong>{discardingScenario.outcome}</strong>
                </footer>
              </div>
            </div>
          </article>
        ) : null}

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
                <span className="nami-landing-scenario-deck-brand-mark is-drawn-mark">Nami</span>
                <span className="mini-badge">Scenario</span>
                <h3>{activeScenario.title}</h3>
                <p>Hold for a beat. This card flips on its own.</p>
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
          disabled={
            phase === 'discarding' ||
            phase === 'shifting' ||
            phase === 'drawing' ||
            (phase === 'revealed' && !isFlipped)
          }
          onClick={drawScenario}
          type="button"
        >
          {drawLabel}
        </button>
        <p className="nami-landing-scenario-deck-note">
          Pull from the deck to reveal a real gamer situation. The stack shifts forward, the last
          card fades out, and the next one waits three seconds before it flips.
        </p>
      </div>
    </div>
  );
}