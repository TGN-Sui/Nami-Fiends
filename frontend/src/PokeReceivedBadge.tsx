import type { ReactElement } from 'react';

import { usePokeReceivedCount } from './chat-poke-store.js';

export function PokeReceivedBadge(props: {
  memberId: string;
  className?: string;
}): ReactElement {
  const total = usePokeReceivedCount(props.memberId);

  return (
    <div className={'poke-received-badge' + (props.className ? ' ' + props.className : '')}>
      <span className="poke-received-label">Pokes received</span>
      <strong className="poke-received-count">{total.toLocaleString()}</strong>
      <span className="poke-received-hint">Lifetime · never resets</span>
    </div>
  );
}