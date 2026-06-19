import type { ReactElement } from 'react';

type MembershipPurchaseLockedPanelProps = {
  compact?: boolean;
  title?: string;
};

export function MembershipPurchaseLockedPanel(
  props: MembershipPurchaseLockedPanelProps = {}
): ReactElement {
  const title = props.title ?? 'Membership purchase locked';

  if (props.compact) {
    return (
      <p className="membership-purchase-locked-note">
        Verify your Nami Passport to purchase or claim Adventurer, Pro, or Elite membership.
      </p>
    );
  }

  return (
    <article className="membership-purchase-locked panel">
      <span className="mini-badge">Verified members only</span>
      <h3>{title}</h3>
      <p>
        Claim and verify your Nami Passport before purchasing or claiming Adventurer, Pro, or Elite
        membership tiers.
      </p>
    </article>
  );
}