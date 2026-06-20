import type { ReactElement } from 'react';

import { preApprovedOwnerRestrictionMessage } from './game-owner-approval-guards.js';

type PreApprovedGameOwnerLockedPanelProps = {
  compact?: boolean;
  feature: string;
  title?: string;
};

export function PreApprovedGameOwnerLockedPanel(
  props: PreApprovedGameOwnerLockedPanelProps,
): ReactElement {
  const title = props.title ?? props.feature + ' locked until approval';

  if (props.compact) {
    return (
      <p className="preapproved-owner-locked-note">
        {preApprovedOwnerRestrictionMessage(props.feature)}
      </p>
    );
  }

  return (
    <article className="preapproved-owner-locked panel">
      <span className="mini-badge">Pre-approved workspace</span>
      <h3>{title}</h3>
      <p>{preApprovedOwnerRestrictionMessage(props.feature)}</p>
      <p className="protocol-hint">
        You can still prepare drafts, upload banner covers, and schedule hidden events while Nami
        Officials finish review.
      </p>
    </article>
  );
}