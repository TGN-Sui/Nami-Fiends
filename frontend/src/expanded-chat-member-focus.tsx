import { useCallback, useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';

import {
  embedCardKey,
  readEmbeddedFeedLinks,
  saveEmbedCollapsed,
} from './embedded-feed-preferences.js';
import { withMemberAvatar } from './member-avatar-store.js';
import { memberWatchableLiveFeed } from './member-public-chat.js';
import { resolveMemberPublicBio, withMemberProfile } from './member-profile-store.js';
import { SocialEmbedPlayer } from './SocialEmbedPlayer.js';
import { TcgFoilPassportCard } from './TcgFoilPassportCard.js';
import type { TagNavigationHandlers } from './TaggedMessageBody.js';
import { members, type NamiMember } from './uiMockData.js';

export type PassportPeekLayout = 'vertical' | 'horizontal';

export function revealMemberTwitchFeed(memberId: string): void {
  const embeds = readEmbeddedFeedLinks('member', memberId);
  const twitchIndex = embeds.findIndex((embed) => embed.platform === 'twitch');

  if (twitchIndex < 0) {
    return;
  }

  saveEmbedCollapsed('member', embedCardKey(embeds[twitchIndex]!, twitchIndex), false, memberId);
}

export function hydrateFocusedMember(member: NamiMember): NamiMember {
  return withMemberProfile(withMemberAvatar(member));
}

export function ExpandedChatMemberAsideEmpty(): ReactElement {
  return (
    <div className="expanded-chat-member-aside is-empty">
      <strong>Member preview</strong>
      <p className="protocol-hint">Click a chatter to open their live feed or passport.</p>
    </div>
  );
}

export function ExpandedChatMemberLivePanel(props: {
  member: NamiMember;
  onClear?: () => void;
}): ReactElement | null {
  const liveFeed = memberWatchableLiveFeed(props.member.id);

  if (!liveFeed) {
    return null;
  }

  return (
    <div className="expanded-chat-member-aside is-live-feed">
      <header className="expanded-chat-member-aside-head">
        <div>
          <span className="mini-badge">Live now</span>
          <strong>{props.member.name}</strong>
          <small>{liveFeed.handle}</small>
        </div>
        {props.onClear ? (
          <button className="nami-surface-button" onClick={props.onClear} type="button">
            Back
          </button>
        ) : null}
      </header>
      <div className="expanded-chat-member-live-shell">
        <SocialEmbedPlayer embed={liveFeed} featured surface="member" />
      </div>
    </div>
  );
}

export function ExpandedChatMemberPassportPanel(props: {
  member: NamiMember;
  layout: PassportPeekLayout;
  onLayoutChange: (layout: PassportPeekLayout) => void;
  onOpenProfile: () => void;
  onClear: () => void;
  hint?: string;
}): ReactElement {
  const memberBio = resolveMemberPublicBio(props.member);

  return (
    <section
      aria-label={props.member.name + ' passport preview'}
      className={
        'expanded-chat-member-aside is-passport-preview' +
        (props.layout === 'horizontal' ? ' is-horizontal-passport-peek-mode' : '')
      }
    >
      <div className="expanded-chat-member-passport-toolbar member-public-chat-passport-peek-toolbar">
        <div
          className="member-public-chat-passport-peek-toolbar-copy"
          title={props.hint ?? 'Only you can see this passport while expanded chat stays open.'}
        >
          <span className="mini-badge">Passport</span>
          <strong>{props.member.name}</strong>
          <span className="member-public-chat-passport-peek-hint">Only you</span>
        </div>

        <div className="member-public-chat-passport-peek-toolbar-actions">
          <div
            aria-label="Passport layout"
            className="nami-profile-layout-switch member-public-chat-passport-layout-switch"
            role="group"
          >
            {(['vertical', 'horizontal'] as PassportPeekLayout[]).map((layout) => (
              <button
                aria-pressed={props.layout === layout}
                className={props.layout === layout ? ' is-selected-profile-layout' : ''}
                key={layout}
                onClick={() => props.onLayoutChange(layout)}
                type="button"
              >
                {layout === 'vertical' ? 'Vertical' : 'Horizontal'}
              </button>
            ))}
          </div>

          <button
            className="nami-surface-button member-public-chat-passport-peek-profile"
            onClick={props.onOpenProfile}
            type="button"
          >
            Open profile
          </button>

          <button
            aria-label={'Close ' + props.member.name + ' passport preview'}
            className="profile-secondary-link member-public-chat-passport-peek-close"
            onClick={props.onClear}
            type="button"
          >
            Back
          </button>
        </div>
      </div>

      <div className="expanded-chat-member-passport-scroll">
        <div
          className={
            'expanded-chat-member-passport-card member-public-chat-passport-peek-card' +
            (props.layout === 'horizontal' ? ' is-horizontal-passport-peek' : '')
          }
        >
          <TcgFoilPassportCard layout={props.layout} member={props.member} />
        </div>

        <div className="expanded-chat-member-passport-bio">
          <span className="mini-badge">Bio</span>
          <p>{memberBio}</p>
        </div>
      </div>
    </section>
  );
}

export function useExpandedChatMemberFocus(options: {
  active: boolean;
  onOpenMember: (member: NamiMember) => void;
  tagHandlers?: TagNavigationHandlers;
  renderDefaultAside?: () => ReactNode;
}): {
  focusedMember: NamiMember | null;
  clearFocus: () => void;
  handleOpenMember: (member: NamiMember) => void;
  mergedTagHandlers: TagNavigationHandlers | undefined;
  renderExpandedAside: () => ReactNode;
  handleChatEscape: () => boolean;
  handleExpandedChange: (expanded: boolean) => void;
} {
  const [focusedMember, setFocusedMember] = useState<NamiMember | null>(null);
  const [passportLayout, setPassportLayout] = useState<PassportPeekLayout>('vertical');

  useEffect(() => {
    if (!options.active) {
      setFocusedMember(null);
      setPassportLayout('vertical');
    }
  }, [options.active]);

  useEffect(() => {
    setPassportLayout('vertical');
  }, [focusedMember?.id]);

  const clearFocus = useCallback((): void => {
    setFocusedMember(null);
  }, []);

  const handleOpenMember = useCallback(
    (member: NamiMember): void => {
      if (!options.active) {
        options.onOpenMember(member);
        return;
      }

      const hydrated = hydrateFocusedMember(member);
      setFocusedMember(hydrated);

      if (memberWatchableLiveFeed(hydrated.id)) {
        revealMemberTwitchFeed(hydrated.id);
      }
    },
    [options.active, options.onOpenMember]
  );

  const mergedTagHandlers = useMemo((): TagNavigationHandlers | undefined => {
    if (!options.tagHandlers && !options.active) {
      return undefined;
    }

    return {
      ...options.tagHandlers,
      onOpenMember: (memberId) => {
        const member = members.find((entry) => entry.id === memberId);

        if (member && options.active) {
          handleOpenMember(member);
          return;
        }

        options.tagHandlers?.onOpenMember?.(memberId);
      },
    };
  }, [handleOpenMember, options.active, options.tagHandlers]);

  const renderExpandedAside = useCallback((): ReactNode => {
    if (!options.active) {
      return null;
    }

    if (focusedMember) {
      if (memberWatchableLiveFeed(focusedMember.id)) {
        return (
          <ExpandedChatMemberLivePanel member={focusedMember} onClear={clearFocus} />
        );
      }

      return (
        <ExpandedChatMemberPassportPanel
          layout={passportLayout}
          member={focusedMember}
          onClear={clearFocus}
          onLayoutChange={setPassportLayout}
          onOpenProfile={() => options.onOpenMember(focusedMember)}
        />
      );
    }

    const defaultAside = options.renderDefaultAside?.();

    if (defaultAside !== undefined && defaultAside !== null) {
      return defaultAside;
    }

    return <ExpandedChatMemberAsideEmpty />;
  }, [clearFocus, focusedMember, options, passportLayout]);

  const handleChatEscape = useCallback((): boolean => {
    if (focusedMember) {
      clearFocus();
      return true;
    }

    return false;
  }, [clearFocus, focusedMember]);

  const handleExpandedChange = useCallback((expanded: boolean): void => {
    if (!expanded) {
      clearFocus();
    }
  }, [clearFocus]);

  return {
    focusedMember,
    clearFocus,
    handleOpenMember,
    mergedTagHandlers,
    renderExpandedAside,
    handleChatEscape,
    handleExpandedChange,
  };
}