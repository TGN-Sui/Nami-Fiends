import { useState, type ReactElement } from 'react';

import { canSendPoke, sendPoke, useCanSendPoke } from './chat-poke-store.js';
import { getSelfMember } from './member-access.js';
import type { NamiMember } from './uiMockData.js';

export function ChatPokeButton(props: {
  target: NamiMember;
  compact?: boolean;
  onPoked?: (targetTotal: number) => void;
}): ReactElement | null {
  const selfMember = getSelfMember();
  const canPoke = useCanSendPoke(selfMember.id, props.target.id);
  const [animating, setAnimating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  if (selfMember.id === props.target.id) {
    return null;
  }

  function handlePoke(): void {
    if (!canSendPoke(selfMember.id, props.target.id)) {
      setStatus('They need to poke you back first.');
      return;
    }

    const result = sendPoke(selfMember.id, props.target.id);

    if (!result.ok) {
      setStatus(result.reason);
      return;
    }

    setAnimating(true);
    setStatus('Poked ' + props.target.name);
    props.onPoked?.(result.targetReceivedTotal);
    window.setTimeout(() => setAnimating(false), 700);
    window.setTimeout(() => setStatus(null), 2200);
  }

  return (
    <div className={'chat-poke-control' + (props.compact ? ' is-compact' : '')}>
      <button
        aria-label={'Poke ' + props.target.name}
        className={
          'chat-poke-button nami-surface-button' +
          (animating ? ' is-poke-animating' : '') +
          (!canPoke ? ' is-poke-waiting' : '')
        }
        disabled={!canPoke}
        onClick={handlePoke}
        title={canPoke ? 'Send a poke' : 'Wait for a poke back'}
        type="button"
      >
        <span aria-hidden="true" className="chat-poke-bag-icon">
          🎒
        </span>
        {props.compact ? null : <span>Poke</span>}
      </button>
      {status ? <span className="chat-poke-status">{status}</span> : null}
    </div>
  );
}