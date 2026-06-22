import { useMemo, useState, type ReactElement } from 'react';

import { isSignedInMember } from './member-access.js';
import { useMemberSession } from './member-session-store.js';
import {
  ensurePlatformSyncSnapshot,
  formatHoursLogged,
  refreshPlatformSync,
  removePlatformSyncSnapshot,
  useLinkedPlatformSyncSnapshots,
  usePlatformGameplayStats,
  type PlatformSyncId,
} from './player-platform-sync-store.js';
import {
  canUnlinkPlayerPlatform,
  isPlayerPlatformLinked,
  linkPlayerPlatform,
  unlinkPlayerPlatform,
  useLinkedPlayerPlatforms,
  type PlayerLinkPlatform,
} from './player-link-store.js';
import { PlayerScorePanel } from './PlayerScorePanel.js';
import {
  authorizeXAccount,
  isXAccountLinked,
  useXVerificationState,
} from './x-verification-store.js';

type PlatformLinkId = PlayerLinkPlatform | 'x';

type PlatformLinkEntry = {
  id: PlatformLinkId;
  label: string;
  hint: string;
};

const PLATFORM_LINKS: PlatformLinkEntry[] = [
  {
    id: 'x',
    label: 'X.com',
    hint: 'Link your X profile for Adventurer claim eligibility and social proof.',
  },
  {
    id: 'steam',
    label: 'Steam',
    hint: 'Library, achievements, and hours sync for future badge mints.',
  },
  {
    id: 'epic',
    label: 'Epic Games',
    hint: 'Permanent link — game library and achievements stay on your passport.',
  },
  {
    id: 'xbox',
    label: 'Xbox',
    hint: 'Gamerscore and playtime sync for badge milestones.',
  },
  {
    id: 'playstation',
    label: 'PlayStation',
    hint: 'Trophy and hours data refresh automatically for badge checks.',
  },
  {
    id: 'nintendo',
    label: 'Nintendo',
    hint: 'Friend code profile reads for future badge flavors.',
  },
  {
    id: 'riot',
    label: 'Riot',
    hint: 'Ranked history sync for competitive badge milestones.',
  },
];

function formatSyncTimestamp(timestampMs: number): string {
  return new Date(timestampMs).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function SteamUnlinkDialog(props: {
  onCancel: () => void;
  onConfirm: () => void;
}): ReactElement {
  return (
    <div className="platform-link-dialog-backdrop" role="presentation">
      <div
        aria-labelledby="platform-link-steam-unlink-title"
        aria-modal="true"
        className="platform-link-dialog"
        role="dialog"
      >
        <div className="profile-panel-heading">
          <div>
            <h2 id="platform-link-steam-unlink-title">Unlink Steam permanently?</h2>
            <p>
              Steam is the only platform you can unlink. This cannot be undone and removes synced
              library, achievement, and hours data from your passport.
            </p>
          </div>
        </div>
        <div className="platform-link-dialog-actions">
          <button className="nami-surface-button" onClick={props.onCancel} type="button">
            Keep Steam linked
          </button>
          <button
            className="nami-surface-button is-primary-surface-button platform-link-danger-button"
            onClick={props.onConfirm}
            type="button"
          >
            Unlink Steam
          </button>
        </div>
      </div>
    </div>
  );
}

function PlatformSyncStats(props: { platformId: PlatformSyncId }): ReactElement | null {
  const snapshot = usePlatformGameplayStats(props.platformId);

  if (!snapshot) {
    return null;
  }

  if (props.platformId === 'x' || props.platformId === 'discord') {
    return (
      <p className="platform-link-sync-note">
        Social profile linked. Game stats sync is not applicable on this platform.
      </p>
    );
  }

  return (
    <div className="platform-link-sync-stats" aria-label={props.platformId + ' gameplay sync'}>
      <span>
        <strong>{snapshot.gamesInLibrary.toLocaleString()}</strong>
        <small>games</small>
      </span>
      <span>
        <strong>{snapshot.achievementsUnlocked.toLocaleString()}</strong>
        <small>achievements</small>
      </span>
      <span>
        <strong>{formatHoursLogged(snapshot.hoursLogged)}</strong>
        <small>logged</small>
      </span>
      <span className="platform-link-sync-updated">
        Updated {formatSyncTimestamp(snapshot.lastSyncedAtMs)}
      </span>
    </div>
  );
}

export function PlatformLinkSettingsPanel(): ReactElement {
  const session = useMemberSession();
  const xVerification = useXVerificationState();
  const linkedPlatforms = useLinkedPlayerPlatforms();
  const canLinkPlatforms = isSignedInMember();

  const linkedSyncIds = useMemo(() => {
    const ids: PlatformSyncId[] = [...linkedPlatforms];

    if (isXAccountLinked()) {
      ids.push('x');
    }

    return ids;
  }, [linkedPlatforms, xVerification.linked, xVerification.verified]);

  useLinkedPlatformSyncSnapshots(linkedSyncIds);

  const [linkNotice, setLinkNotice] = useState<string | null>(null);
  const [steamUnlinkOpen, setSteamUnlinkOpen] = useState(false);

  function linkPlatform(platformId: PlatformLinkId): void {
    if (!canLinkPlatforms) {
      setLinkNotice('Sign in or connect a wallet before linking platforms.');
      return;
    }

    setLinkNotice(null);

    if (platformId === 'x') {
      if (isXAccountLinked()) {
        setLinkNotice('X.com stays linked once connected. Only Steam can be unlinked.');
        return;
      }

      const result = authorizeXAccount();
      if (!result.ok) {
        setLinkNotice(result.reason);
        return;
      }

      ensurePlatformSyncSnapshot('x');
      refreshPlatformSync('x');
      setLinkNotice(result.message);
      return;
    }

    if (isPlayerPlatformLinked(platformId)) {
      if (canUnlinkPlayerPlatform(platformId)) {
        setSteamUnlinkOpen(true);
      } else {
        setLinkNotice(platformLabel(platformId) + ' links are permanent and cannot be removed.');
      }

      return;
    }

    linkPlayerPlatform(platformId);
    ensurePlatformSyncSnapshot(platformId);
    refreshPlatformSync(platformId);
    setLinkNotice(
      platformLabel(platformId) +
        ' linked. Library, achievements, and hours will refresh automatically for badges.',
    );
  }

  function confirmSteamUnlink(): void {
    if (!unlinkPlayerPlatform('steam')) {
      setLinkNotice('Could not unlink Steam.');
      setSteamUnlinkOpen(false);
      return;
    }

    removePlatformSyncSnapshot('steam');
    setSteamUnlinkOpen(false);
    setLinkNotice('Steam unlinked. Synced gameplay data was removed from this passport.');
  }

  function platformLabel(platformId: PlatformLinkId): string {
    return PLATFORM_LINKS.find((entry) => entry.id === platformId)?.label ?? platformId;
  }

  function actionLabel(platformId: PlatformLinkId, linked: boolean): string {
    if (!linked) {
      return platformId === 'x' ? 'Link X' : 'Link ' + platformLabel(platformId);
    }

    if (platformId === 'steam') {
      return 'Unlink Steam';
    }

    return 'Linked';
  }

  return (
    <article className="panel settings-card platform-link-settings-card">
      <div className="profile-panel-heading">
        <h2>Platform Linking</h2>
        <p>
          Link game platforms any time to prove you are a gamer. Links are permanent except Steam,
          which can be removed with a final warning. Library, achievements, and hours refresh on a
          live sync loop for the badge system.
        </p>
      </div>

      <PlayerScorePanel compact issuedScore={session?.issuedPlayerScore ?? null} showSuggestions />

      {!canLinkPlatforms ? (
        <p className="settings-account-hint">
          Sign in through Enter Nami or connect a wallet to start linking platforms.
        </p>
      ) : null}

      <ul className="platform-link-list">
        {PLATFORM_LINKS.map((platform) => {
          const linked =
            platform.id === 'x' ? isXAccountLinked() : linkedPlatforms.includes(platform.id);
          const isSteam = platform.id === 'steam';
          const actionIsUnlink = linked && isSteam;

          return (
            <li className={'platform-link-row' + (linked ? ' is-platform-linked' : '')} key={platform.id}>
              <div className="platform-link-copy">
                <strong>{platform.label}</strong>
                <p>{platform.hint}</p>
                {linked ? <PlatformSyncStats platformId={platform.id} /> : null}
                {platform.id === 'x' && linked && xVerification.handle ? (
                  <p className="platform-link-handle-note">@{xVerification.handle.replace(/^@+/, '')}</p>
                ) : null}
              </div>
              {linked && !isSteam ? (
                <span className="nami-surface-button platform-link-action is-linked-platform-action">
                  {actionLabel(platform.id, linked)}
                </span>
              ) : (
                <button
                  className={
                    'nami-surface-button platform-link-action' +
                    (actionIsUnlink ? ' is-steam-unlink-action' : '')
                  }
                  disabled={!canLinkPlatforms}
                  onClick={() => linkPlatform(platform.id)}
                  type="button"
                >
                  {actionLabel(platform.id, linked)}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {linkNotice ? <p className="protocol-hint platform-link-notice">{linkNotice}</p> : null}

      {steamUnlinkOpen ? (
        <SteamUnlinkDialog
          onCancel={() => setSteamUnlinkOpen(false)}
          onConfirm={confirmSteamUnlink}
        />
      ) : null}
    </article>
  );
}