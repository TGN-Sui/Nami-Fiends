import type { ReactElement, ReactNode } from 'react';

import { protocolChainHint, protocolConnectHint, protocolIndexerHint } from './protocol-query.js';
import type { ProtocolContext } from './protocol.js';
import type { ProtocolOwnerSource } from './wallet.js';

interface ProtocolPanelShellProps {
  title: string;
  description: string;
  context: ProtocolContext;
  owner: string | null;
  source?: ProtocolOwnerSource;
  requiresChain?: boolean;
  requiresIndexer?: boolean;
  requiresOwner?: boolean;
  children: ReactNode;
}

export function ProtocolPanelShell(props: ProtocolPanelShellProps): ReactElement {
  if (props.requiresChain !== false && props.context.chain === null) {
    return (
      <article className="panel protocol-moderation-card">
        <div className="profile-panel-heading">
          <h2>{props.title}</h2>
          <p>{props.description}</p>
        </div>
        <p className="protocol-hint">{protocolChainHint()}</p>
      </article>
    );
  }

  if (props.requiresIndexer && props.context.indexer === null) {
    return (
      <article className="panel protocol-moderation-card">
        <div className="profile-panel-heading">
          <h2>{props.title}</h2>
          <p>{props.description}</p>
        </div>
        <p className="protocol-hint">{protocolIndexerHint()}</p>
      </article>
    );
  }

  if (props.requiresOwner !== false && !props.owner) {
    return (
      <article className="panel protocol-moderation-card">
        <div className="profile-panel-heading">
          <h2>{props.title}</h2>
          <p>{props.description}</p>
        </div>
        <p className="protocol-hint">{protocolConnectHint()}</p>
      </article>
    );
  }

  return (
    <article className="panel protocol-moderation-card">
      <div className="profile-panel-heading">
        <h2>{props.title}</h2>
        <p>
          {props.description}
          {props.owner ? ` · ${props.owner.slice(0, 10)}…` : ''}
        </p>
      </div>
      {props.children}
    </article>
  );
}