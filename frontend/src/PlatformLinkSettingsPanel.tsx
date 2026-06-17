import { useState, type ReactElement } from 'react';

import { usePassportQuery } from './protocol-query.js';
import { useMemberSession } from './member-session-store.js';
import { useNamiAdminStore } from './nami-admin-store.js';
import {
  authorizeXAccount,
  unlinkXAccount,
  useXVerificationState,
} from './x-verification-store.js';

type PlatformLinkId = 'x' | 'steam' | 'epic' | 'xbox' | 'playstation' | 'nintendo' | 'riot';

type PlatformLinkEntry = {
  id: PlatformLinkId;
  label: string;
  hint: string;
};

const PLATFORM_LINKS: PlatformLinkEntry[] = [
  {
    id: 'x',
    label: 'X.com',
    hint: 'Verified X authorization can claim Adventurer membership without payment.',
  },
  {
    id: 'steam',
    label: 'Steam',
    hint: 'Achievement badges unlock after passport claim is approved.',
  },
  {
    id: 'epic',
    label: 'Epic Games',
    hint: 'Link once per passport — unlinking removes platform badges.',
  },
  {
    id: 'xbox',
    label: 'Xbox',
    hint: 'Gamerscore milestones can mint proof badges.',
  },
  {
    id: 'playstation',
    label: 'PlayStation',
    hint: 'Trophy sync is read-only until verify APIs ship.',
  },
  {
    id: 'nintendo',
    label: 'Nintendo',
    hint: 'Friend codes and profile reads only.',
  },
  {
    id: 'riot',
    label: 'Riot',
    hint: 'Ranked milestones for competitive badge flavors.',
  },
];

export function PlatformLinkSettingsPanel(): ReactElement {
  const session = useMemberSession();
  const { userClaimStatus } = useNamiAdminStore();
  const { data: passportView } = usePassportQuery();
  const xVerification = useXVerificationState();

  const [linkedPlatforms, setLinkedPlatforms] = useState<Set<PlatformLinkId>>(() => {
    return xVerification.verified ? new Set<PlatformLinkId>(['x']) : new Set();
  });
  const [linkNotice, setLinkNotice] = useState<string | null>(null);

  const claimApproved = userClaimStatus.status === 'approved';
  const hasOnChainPassport = passportView?.passport != null;
  const canLink = claimApproved || hasOnChainPassport;

  function togglePlatform(platformId: PlatformLinkId): void {
    if (!canLink) {
      setLinkNotice('Approve your passport claim in Settings before linking platforms.');
      return;
    }

    setLinkNotice(null);

    if (platformId === 'x') {
      if (xVerification.verified) {
        const result = unlinkXAccount();
        setLinkedPlatforms((current) => {
          const next = new Set(current);
          next.delete('x');
          return next;
        });
        setLinkNotice(result.ok ? result.message : result.reason);
      } else {
        const result = authorizeXAccount();
        setLinkedPlatforms((current) => {
          const next = new Set(current);
          next.add('x');
          return next;
        });
        setLinkNotice(result.ok ? result.message : result.reason);
      }

      return;
    }

    setLinkedPlatforms((current) => {
      const next = new Set(current);

      if (next.has(platformId)) {
        next.delete(platformId);
        setLinkNotice('Platform unlinked. Platform-sourced badges would be removed on-chain.');
      } else {
        next.add(platformId);
        setLinkNotice('Platform linked locally. OAuth verify flow ships in a later phase.');
      }

      return next;
    });
  }

  return (
    <article className="panel settings-card platform-link-settings-card">
      <div className="profile-panel-heading">
        <h2>Platform Linking</h2>
        <p>
          Connect Steam, Epic, Xbox, and more for achievement-based badges. Only achievements earned
          after your passport was created can be claimed.
        </p>
      </div>

      {!session ? (
        <p className="settings-account-hint">
          Complete Enter Nami signup so your identity is on file before linking platforms.
        </p>
      ) : null}

      {!canLink ? (
        <p className="protocol-hint platform-link-gate-hint">
          Submit and receive approval for your passport claim before platform linking unlocks.
        </p>
      ) : null}

      <ul className="platform-link-list">
        {PLATFORM_LINKS.map((platform) => {
          const linked =
            platform.id === 'x' ? xVerification.verified : linkedPlatforms.has(platform.id);

          return (
            <li className="platform-link-row" key={platform.id}>
              <div className="platform-link-copy">
                <strong>{platform.label}</strong>
                <p>{platform.hint}</p>
              </div>
              <button
                className={
                  'profile-secondary-link platform-link-action' + (linked ? ' is-linked' : '')
                }
                disabled={!canLink}
                onClick={() => togglePlatform(platform.id)}
                type="button"
              >
                {linked ? 'Unlink' : platform.id === 'x' ? 'Authorize with X' : 'Link'}
              </button>
            </li>
          );
        })}
      </ul>

      {linkNotice ? <p className="protocol-hint">{linkNotice}</p> : null}
    </article>
  );
}