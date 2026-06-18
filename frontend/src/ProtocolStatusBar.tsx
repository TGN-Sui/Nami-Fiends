import type { ReactElement } from 'react';

import { resolveProtocolConnectionState } from './protocol-availability.js';
import { useProtocolOwner } from './wallet.js';

type ProtocolStatusBarProps = {
  className?: string;
};

export function ProtocolStatusBar(props: ProtocolStatusBarProps = {}): ReactElement {
  const { owner, source, context } = useProtocolOwner();
  const connection = resolveProtocolConnectionState(context, owner, source);
  const rootClassName =
    'protocol-status-bar is-protocol-site-footer' + (props.className ? ' ' + props.className : '');

  return (
    <div className={rootClassName}>
      <span className="mini-badge">{connection.badge}</span>
      <p>{connection.detail}</p>
    </div>
  );
}