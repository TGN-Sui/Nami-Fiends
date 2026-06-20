import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement
} from 'react';
import { createPortal } from 'react-dom';

import { channels as seedChannels } from './fixtures/seed-data.js';
import {
  channels,
  developers,
  members,
  navItems,
  userProfile,
  type ChatMessage,
  type ConductSignal,
  type NamiChannel,
  type NamiPage
} from './uiMockData.js';

import { PassportTimelinePanel } from './PassportTimelinePanel.js';
import { ProtocolChannelAccessPanel } from './ProtocolChannelAccessPanel.js';
import { ProtocolChannelPanel } from './ProtocolChannelPanel.js';
import { ProtocolConductPanel } from './ProtocolConductPanel.js';

import { EventInterestedButton } from './EventInterestedButton.js';
import { EventLivePopup } from './EventLivePopup.js';
import { ChannelProfileScreen } from './ChannelProfileScreen.js';
import type { ChannelProfileSection } from './channel-profile-sections.js';
import type { ChannelProfileOwnerFocus } from './channel-profile-navigation.js';
import { PinnedGameChannelProfileCard } from './PinnedGameChannelProfileCard.js';
import {
  isGameChannelOwner,
  ownsGameChannel,
  resolveOwnedGameChannel,
} from './channel-owner-access.js';
import {
  isFullyApprovedGameOwner,
  isPreApprovedGameOwner,
} from './game-owner-session-store.js';
import { isChannelHiddenFromPublic } from './game-submission-ticket-store.js';
import {
  readActiveHubFeaturedChannelId,
  readApprovedPartnerCarouselChannelIds,
  readChannelOwnerPromotionsState,
} from './channel-owner-promotions-store.js';
import { SuperBannerOverlay } from './SuperBannerOverlay.js';
import { ChannelBannerNotificationOverlay } from './ChannelBannerNotificationOverlay.js';
import { ChannelBannerReminderBar } from './ChannelBannerReminderBar.js';

import {
  createChannelEvent,
  formatEventTimeInTimezone,
  getChannelEvents,
  getEventById,
  readViewerTimezone,
  saveViewerTimezone,
  saveBubbleLeaderboardSize,
  type BubbleLeaderboardSize,
  type StoredEvent,
  useBubbleLeaderboardSize,
  useEventsStore,
  eventImportanceClass,
} from './events-store.js';
import { HubEventsPanel } from './HubEventsPanel.js';
import { CryptoBubbleBoard } from './CryptoBubbleBoard.js';
import { EntryPage } from './EntryPage.js';

import { threadMessagesFor, threadParticipantsFor } from './messages-data.js';
import {
  canMessageOtherMembers,
  canReportMemberProfile,
  canSendChatMessages,
  canSendPrivateMessages,
  canAccessModerationQueues,
  canEditProfileCosmetics,
  canSubscribeToChannelBanners,
  canToggleStreamingStatus,
  getSelfMember,
  messageBubbleClass,
  resolveMessageAuthorMember,
} from './member-access.js';
import {
  markThreadRead,
  readMessageThreads,
  sendPrivateMessage,
  useMessageUnreadCount,
  useMessagesStore,
} from './messages-store.js';
import {
  useChatAutoScroll,
  useChatViewportPause,
  useFrozenChatMessages,
  usePausedMessagesStoreSignal,
} from './use-chat-viewport.js';
import {
  isChannelSubscribed,
  subscribeToChannel,
  subscriptionSlotLimit,
  useSubscribedChannels,
} from './subscriptions-store.js';
import { subscribedUserEvents } from './events-data.js';
import { ProtocolCustomizationPanel } from './ProtocolCustomizationPanel.js';
import { ProtocolHistoryPanel } from './ProtocolHistoryPanel.js';

import { ProtocolModerationPanel } from './ProtocolModerationPanel.js';
import { ProtocolModerationRecordsPanel } from './ProtocolModerationRecordsPanel.js';
import { ProtocolProfilePanel } from './ProtocolProfilePanel.js';
import { ProtocolRecoveryPanel } from './ProtocolRecoveryPanel.js';
import {
  type GuildCardView,
  type SquadCardView,
} from './protocol.js';
import { useGuildCardsQuery, useOwnerHistoryQuery, usePassportQuery, useSquadCardsQuery } from './protocol-query.js';

import { clearLocalNamiSession } from './session-sign-out.js';
import { resolveChannelCoverUrl, useChannelCoverVersion } from './channel-cover-store.js';

import { StudioLogoUploadCard } from './StudioLogoUploadCard.js';
import { useStudioLogoVersion, withStudioLogo } from './studio-logo-store.js';
import {
  channelRainbowBorderClass,
  isNamiTeamMember,
  memberRainbowBorderClass,
} from './channel-surface.js';
import { MembershipAccessCard } from './MembershipAccessCard.js';
import { MembershipPlansPanel } from './MembershipPlansPanel.js';
import { MembershipPaymentReturnHandler } from './MembershipPaymentReturnHandler.js';
import { MemberSessionSync } from './MemberSessionSync.js';
import { useMemberSession } from './member-session-store.js';
import { PlayerScorePanel } from './PlayerScorePanel.js';

import { WalletAuthBridge } from './WalletAuthBridge.js';
import { MembershipUpgradeOverlay } from './MembershipUpgradeOverlay.js';

import { membershipPlanForTier, useMembershipPlanState } from './membership-plans-store.js';

import { BadgeCollectorsBook } from './BadgeCollectorsBook.js';
import { DemoPerspectiveBar } from './DemoPerspectiveBar.js';
import { restoreOwnerDemoPerspective, useDemoPerspective } from './demo-perspective-store.js';
import { NamiOwnerEditModeBar } from './NamiOwnerEditModeBar.js';
import { ensureOwnerAssetsHydrated, ownerAssetNavSlotId } from './nami-owner-assets-store.js';
import { OwnerEditableImage } from './OwnerEditableImage.js';
import { requestSettingsSection, SettingsScreen } from './SettingsScreen.js';
import { EmbeddedSocialPanel } from './EmbeddedSocialPanel.js';
import {
  memberFeedAbuseReportLabel,
  resolveMemberFeedAbuseForOwner,
  reviewMemberFeedAbuseReports,
  useMemberFeedAbuseReports,
  useOfficialFeedAbuseAlerts,
} from './member-feed-abuse-store.js';
import {
  buildGenreBubbleEntries,
  genreOfficialChats,
} from './global-chats.js';
import {
  channelMatchesGameHubFilter,
  channelsForModuleFilters,
  gameHubBrowserFilters,
  readGameHubInterestModules,
  readGenreChatDockCollapsed,
  readGenreChatDockPinned,
  saveGameHubInterestModules,
  saveGenreChatDockCollapsed,
  saveGenreChatDockPinned,
  type GameHubBrowserFilter,
  type GameHubInterestModule,
} from './gamehub-preferences.js';
import { GenreChatRoomPanel, PinnedGenreChatDock, HubGlobalChatsSection } from './GlobalChatsPanel.js';
import { ChatComposerWithEmojis } from './ChatComposerWithEmojis.js';
import { ChatWindowExpandable } from './ChatWindowExpandable.js';
import { releaseExpandedChatScrollLock } from './ExpandedChatOverlay.js';
import { ApprovalRequestActions } from './ApprovalRequestActions.js';
import { resetGameCardTilt, updateGameCardTilt } from './game-card-tilt.js';
import { GameHubChannelTile } from './GameHubChannelTile.js';
import { useHorizontalScrollStrip } from './useHorizontalScrollStrip.js';
import { pendingApprovalsForMember } from './approval-requests-store.js';
import {
  GuildDetailScreen,
  MyGuildHomeScreen,
  SquadDetailScreen,
} from './GuildSpaceScreens.js';
import { markGuildEventsSeen, useGuildEventsStore } from './guild-events-store.js';
import { resolveMemberGuildAffiliations } from './affiliation-provider.js';
import { useChannelDirectory } from './channel-directory-provider.js';
import { GAME_HUB_INTRO } from './landing-content.js';
import { useMemberDirectory } from './member-directory-provider.js';
import {
  namiGuilds,
  namiSquads,
  resolveSquadFromCard,
  type NamiGuildRecord,
  type NamiSquadRecord,
} from './nami-affiliations.js';
import { MemberAvatarUploadCard } from './MemberAvatarUploadCard.js';
import { MemberProfileActions } from './MemberProfileActions.js';
import { MemberProfileShowcase } from './MemberProfileShowcase.js';
import { getNamiProgression, percentForNamiSeasonLevel } from './member-progression.js';
import { MemberPublicPinnedChat } from './MemberPublicPinnedChat.js';
import { canShowMemberPublicChat } from './member-public-chat.js';
import { readMemberIdFromShareUrl, shareMemberProfile } from './profile-share.js';
import { SharePassportButton } from './SharePassportButton.js';

import { useUnreadTagNotificationCount } from './nami-notifications-store.js';
import { tagSuggestionHint } from './nami-tag-registry.js';
import { TaggedMessageBody, type TagNavigationHandlers } from './TaggedMessageBody.js';

import { ProfilePassportCarousel } from './ProfilePassportCarousel.js';
import { ProfileEditPanel } from './ProfileEditPanel.js';
import { PinnedProfileAvatar } from './PinnedProfileAvatar.js';
import { PinnedProfileCapacityStrip } from './PinnedProfileCapacityStrip.js';


import {
  chatMemberCardTierClass,
  ConductSignalDot,
  MemberStreamingLiveDot,
  UniformMemberAvatar,
  UniformMemberAvatarButton,
} from './member-avatar.js';
import { useMemberStreamingOnline, useSelfStreamingOnline } from './member-online-store.js';
import {
  requestProfileEditFocus,
  useSelfMember,
} from './member-avatar-store.js';
import { useSelfProfileEdits } from './member-profile-store.js';
import {
  isSelfMember,
  readEmbeddedFeedEnabled,
  readViewingAsChannelOwner,
  saveEmbeddedFeedEnabled,
} from './surface-preferences.js';
import { TcgFoilPassportCard } from './TcgFoilPassportCard.js';

import { triggerHubSpotlightBurst } from './hub-spotlight.js';
import { NamiGridSpotlight } from './NamiGridSpotlight.js';
import {
  prefersReducedMotion,
  subscribeIntersectionPause,
  subscribeVisibilityPause,
} from './perf-utils.js';
import { IgniteRadioDock } from './IgniteRadioDock.js';
import { saveIgniteRadioEnabled, useIgniteRadioEnabled } from './ignite-radio-store.js';
import {
  readMemberPreference,
  saveMemberPreference,
  useMemberPreferencesVersion,
} from './member-preference-store.js';
import { ProtocolStatusBar } from './ProtocolStatusBar.js';
import {
  clearSafetyActions,
  clearSafetyReports,
  readSafetyActions,
  readSafetyReports,
  saveSafetyAction,
  saveSafetyReport,
  saveSafetyReports,
  type SafetyActionRecord,
  type SafetyReport,
} from './safety-report-store.js';
import { useProtocolOwner, useWalletDisconnect } from './wallet.js';

function signalClass(signal: ConductSignal): string {
  return 'signal-ring signal-' + signal.toLowerCase();
}

function channelDeveloper(channel: NamiChannel): (typeof developers)[number] {
  return developers.find((developer) => developer.id === channel.developerId) ?? developers[0]!;
}

function developerGameChannels(developer: (typeof developers)[number]): NamiChannel[] {
  return channels.filter((channel) => developer.gameIds.includes(channel.id));
}

function gameVerificationLabel(channel: NamiChannel): string {
  return channel.verifiedGame ? 'Verified Game' : 'Community Game';
}

type GameVerificationTier = 'verified-game' | 'studio-approved' | 'community-game';

function gameVerificationTier(channel: NamiChannel): GameVerificationTier {
  const developerProfile = channelDeveloper(channel);

  if (channel.verifiedGame) return 'verified-game';
  if (developerProfile.approved) return 'studio-approved';

  return 'community-game';
}

function gameVerificationClass(channel: NamiChannel): string {
  const tier = gameVerificationTier(channel);

  if (tier === 'verified-game') return 'is-verified-game-surface';
  if (tier === 'studio-approved') return 'is-studio-approved-surface';

  return 'is-community-game-surface';
}

function gameVerificationShortLabel(channel: NamiChannel): string {
  const tier = gameVerificationTier(channel);

  if (tier === 'verified-game') return 'VG';
  if (tier === 'studio-approved') return 'ST';

  return 'CM';
}

function gameVerificationBadgeLabel(channel: NamiChannel): string {
  const tier = gameVerificationTier(channel);

  if (tier === 'verified-game') return 'Verified game proof';
  if (tier === 'studio-approved') return 'Studio approved';

  return 'Community listed';
}

function developerVerificationClass(developer: (typeof developers)[number]): string {
  if (developer.proofStatus === 'Verified Studio') return 'is-verified-studio-logo';
  if (developer.approved) return 'is-approved-studio-logo';

  return 'is-community-studio-logo';
}

function developerShortProofLabel(developer: (typeof developers)[number]): string {
  if (developer.proofStatus === 'Verified Studio') return 'VS';
  if (developer.approved) return 'AP';

  return 'CS';
}

function isMemberFoilEligible(member: (typeof members)[number], reviewedSignal: ConductSignal): boolean {
  if (reviewedSignal !== 'Green') return false;
  if (member.tier === 'NPC') return false;
  if (/sponsor|sponsored|squad/i.test(member.badge)) return false;

  return true;
}

function cssAssetUrl(url: string): string {
  return 'url("' + url.replace(/"/g, '\\u0022') + '")';
}

function gameCoverAssetVariables(channel: NamiChannel): CSSProperties {
  const coverImageUrl = resolveChannelCoverUrl(channel)?.trim();

  if (!coverImageUrl) {
    return {
      '--game-cover-image': 'none',
      '--game-cover-image-opacity': '0'
    } as CSSProperties;
  }

  return {
    '--game-cover-image': cssAssetUrl(coverImageUrl),
    '--game-cover-image-opacity': '1'
  } as CSSProperties;
}

function studioLogoAssetVariables(developer: (typeof developers)[number]): CSSProperties {
  const logoImageUrl = developer.logoImageUrl?.trim();

  if (!logoImageUrl) {
    return {
      '--studio-logo-image': 'none',
      '--studio-logo-image-opacity': '0'
    } as CSSProperties;
  }

  return {
    '--studio-logo-image': cssAssetUrl(logoImageUrl),
    '--studio-logo-image-opacity': '1'
  } as CSSProperties;
}

function ChannelAvatar(props: {
  channel: NamiChannel;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
}): ReactElement {
  const className =
    'channel-avatar channel-avatar-' +
    (props.size ?? 'md') +
    (resolveChannelCoverUrl(props.channel) ? ' has-channel-cover-avatar' : '') +
    (props.selected ? ' is-selected' : '');

  const label = props.channel.name.slice(0, 2).toUpperCase();
  const resolvedCover = resolveChannelCoverUrl(props.channel);
  const avatarStyle = resolvedCover
    ? ({
        ...gameCoverAssetVariables(props.channel),
        '--channel-avatar-monogram-opacity': '0',
      } as CSSProperties)
    : undefined;

  if (props.onClick) {
    return (
      <button
        className={className}
        onClick={props.onClick}
        style={avatarStyle}
        type="button"
        title={props.channel.name}
      >
        <span>{label}</span>
      </button>
    );
  }

  return (
    <div className={className} style={avatarStyle} title={props.channel.name}>
      <span>{label}</span>
    </div>
  );
}

const namiSeasonLevelMarkers = [1, 15, 30, 45, 60, 75, 90, 100] as const;

function memberInitials(member: (typeof members)[number]): string {
  return member.name.slice(0, 2).toUpperCase();
}

function NamiSeasonProgressBar(props: {
  member: (typeof members)[number];
}): ReactElement {
  const [progressTick, setProgressTick] = useState(() => Date.now());
  const progression = getNamiProgression(props.member, progressTick);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setProgressTick(Date.now());
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className="nami-season-progress" aria-label="Nami seasonal reputation progress">
      <div className="nami-season-progress-copy">
        <span>Season Reputation</span>
        <strong>Level {progression.level}</strong>
        <small>{progression.currentXp} / {progression.nextLevelXp} XP</small>
      </div>

      <div className="nami-season-track">
        <div
          className="nami-season-fill"
          style={{ width: progression.levelPercent + '%' }}
        />

        {namiSeasonLevelMarkers.map((level) => (
          <span
            className="nami-season-marker"
            key={level}
            style={{ left: percentForNamiSeasonLevel(level) + '%' }}
          >
            <i>{level}</i>
          </span>
        ))}

        <div
          className="nami-season-avatar-marker"
          style={{ left: progression.levelPercent + '%' }}
        >
          <span className={'nami-season-avatar ' + signalClass(props.member.signal)}>
            {memberInitials(props.member)}
          </span>
          <strong>{progression.level}</strong>
        </div>
      </div>
    </section>
  );
}

function namiReturnLabelForPage(page: NamiPage): string {
  if (page === 'hub') return 'Back to Nami Hub';
  if (page === 'gamehub') return 'Back to Game Hub';
  if (page === 'chat') return 'Back to Chat';
  if (page === 'settings') return 'Back to Settings';
  if (page === 'userProfile') return 'Back to My Profile';
  if (page === 'subscriptions') return 'Back to Subscriptions';
  if (page === 'guilds') return 'Back to Squads & Guilds';
  if (page === 'guildDetail') return 'Back to Guild';
  if (page === 'squadDetail') return 'Back to Squad';

  return 'Back to Nami Hub';
}

function isGuildNavPage(page: NamiPage): boolean {
  return page === 'guilds' || page === 'guildDetail' || page === 'squadDetail';
}

function SidebarProfileCard(props: {
  onNavigate: (page: NamiPage) => void;
  onOpenOwnedChannel?: () => void;
  onSignOut: () => void | Promise<void>;
}): ReactElement {
  const sidebarMember = useSelfMember();
  const channelOwnerView = isGameChannelOwner();
  const sidebarProgression = getNamiProgression(sidebarMember);
  const unreadTagNotificationCount = useUnreadTagNotificationCount();
  const { isStreamingOnline, setStreamingOnline } = useSelfStreamingOnline();
  const [sidebarProfileMenuOpen, setSidebarProfileMenuOpen] = useState(false);
  const sidebarProfileShellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sidebarProfileMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent): void {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (sidebarProfileShellRef.current?.contains(target)) {
        return;
      }

      setSidebarProfileMenuOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [sidebarProfileMenuOpen]);

  function updateSidebarProfileFoil(event: { currentTarget: HTMLElement; clientX: number; clientY: number }): void {
    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const pointerY = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
    const tiltX = ((0.5 - pointerY) * 8).toFixed(2) + 'deg';
    const tiltY = ((pointerX - 0.5) * 8).toFixed(2) + 'deg';

    event.currentTarget.style.setProperty('--sidebar-profile-x', (pointerX * 100).toFixed(2) + '%');
    event.currentTarget.style.setProperty('--sidebar-profile-y', (pointerY * 100).toFixed(2) + '%');
    event.currentTarget.style.setProperty('--sidebar-profile-tilt-x', tiltX);
    event.currentTarget.style.setProperty('--sidebar-profile-tilt-y', tiltY);
  }

  function resetSidebarProfileFoil(event: { currentTarget: HTMLElement }): void {
    event.currentTarget.style.setProperty('--sidebar-profile-x', '50%');
    event.currentTarget.style.setProperty('--sidebar-profile-y', '18%');
    event.currentTarget.style.setProperty('--sidebar-profile-tilt-x', '0deg');
    event.currentTarget.style.setProperty('--sidebar-profile-tilt-y', '0deg');
  }

  return (
    <div aria-label="Signed-in member profile" className="nami-pinned-profile-card">
      <div
        className={
          'sidebar-profile-shell nami-pinned-profile-stack' +
          (sidebarProfileMenuOpen ? ' is-profile-menu-open' : '')
        }
        ref={sidebarProfileShellRef}
      >
        {unreadTagNotificationCount > 0 ? (
          <span
            aria-label={
              unreadTagNotificationCount +
              ' unread tag mention' +
              (unreadTagNotificationCount === 1 ? '' : 's')
            }
            className="sidebar-profile-tag-bell"
            title="New tag mention in chat"
          >
            <span aria-hidden="true" className="sidebar-profile-tag-bell-icon">
              🔔
            </span>
            <span className="sidebar-profile-tag-bell-count">
              {unreadTagNotificationCount > 9 ? '9+' : unreadTagNotificationCount}
            </span>
          </span>
        ) : null}

        <button
          aria-expanded={sidebarProfileMenuOpen}
          className="sidebar-player-progress sidebar-player-progress-button nami-pinned-profile-trigger"
          onClick={() => setSidebarProfileMenuOpen((value) => !value)}
          onPointerLeave={resetSidebarProfileFoil}
          onPointerMove={updateSidebarProfileFoil}
          type="button"
        >
          <PinnedProfileAvatar level={sidebarProgression.level} />

          <div className="sidebar-player-copy">
            <span>{sidebarMember.name}</span>
            <small>Lv {sidebarProgression.level} · {sidebarProgression.currentXp} XP</small>
            <div className="sidebar-xp-track">
              <i style={{ width: (sidebarProgression.currentXp / sidebarProgression.nextLevelXp) * 100 + '%' }} />
            </div>
          </div>

          <span aria-hidden="true" className="nami-pinned-profile-chevron" />
        </button>

        <div className="nami-pinned-profile-stack-body">
          {!channelOwnerView && canToggleStreamingStatus(sidebarMember) ? (
            <>
              <PinnedProfileCapacityStrip />

              <div className="sidebar-profile-streaming-panel">
                <label
                  className="sidebar-profile-online-toggle"
                  title="Shows a live dot on your avatar for other members"
                >
                  <input
                    checked={isStreamingOnline}
                    onChange={(event) => setStreamingOnline(event.target.checked)}
                    type="checkbox"
                  />
                  <span className="sidebar-profile-online-toggle-copy">
                    <strong>I'm streaming</strong>
                    <small>Live dot on avatar</small>
                  </span>
                  <span aria-hidden={!isStreamingOnline} className="sidebar-profile-online-toggle-indicator">
                    {isStreamingOnline ? (
                      <MemberStreamingLiveDot className="is-menu-streaming-dot" memberId={sidebarMember.id} />
                    ) : null}
                  </span>
                </label>
              </div>
            </>
          ) : null}

          {sidebarProfileMenuOpen ? (
            <div className="sidebar-profile-menu nami-pinned-profile-menu" role="menu">
              <button
                onClick={() => {
                  setSidebarProfileMenuOpen(false);

                  if (channelOwnerView) {
                    props.onOpenOwnedChannel?.();
                    return;
                  }

                  requestProfileEditFocus();
                  props.onNavigate('userProfile');
                }}
                role="menuitem"
                type="button"
              >
                {channelOwnerView ? 'My Game Profile' : 'Edit Profile'}
              </button>
              {unreadTagNotificationCount > 0 ? (
                <button
                  onClick={() => {
                    setSidebarProfileMenuOpen(false);
                    props.onNavigate('settings');
                  }}
                  role="menuitem"
                  type="button"
                >
                  Tag Mentions ({unreadTagNotificationCount})
                </button>
              ) : null}
              <button
                onClick={() => {
                  setSidebarProfileMenuOpen(false);
                  void shareMemberProfile(sidebarMember);
                }}
                role="menuitem"
                type="button"
              >
                Share Passport
              </button>
              <button
                onClick={() => {
                  setSidebarProfileMenuOpen(false);
                  void props.onSignOut();
                }}
                role="menuitem"
                type="button"
              >
                Sign Out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Sidebar(props: {
  activePage: NamiPage;
  guildEventUnreadCount: number;
  messageUnreadCount: number;
  onNavigate: (page: NamiPage) => void;
  onOpenOwnedChannel?: () => void;
  onHubSwap: (page: 'hub' | 'gamehub') => void;
}): ReactElement {
  const igniteRadioEnabled = useIgniteRadioEnabled();
  const [hubSwapIdleHint, setHubSwapIdleHint] = useState(false);
  const isOnGameHub = props.activePage === 'gamehub';
  const isOnNamiHub = props.activePage === 'hub';
  const hubSwapTarget: NamiPage = isOnGameHub ? 'hub' : isOnNamiHub ? 'gamehub' : 'hub';
  const hubSwapLabel = isOnGameHub ? 'Nami Hub' : 'Game Hub';

  useEffect(() => {
    if (!isOnGameHub && !isOnNamiHub) {
      setHubSwapIdleHint(false);
      return;
    }

    let idleTimer = window.setTimeout(() => setHubSwapIdleHint(true), 8000);
    let resetFrameId = 0;

    function resetIdleTimer(): void {
      if (resetFrameId !== 0) {
        return;
      }

      resetFrameId = window.requestAnimationFrame(() => {
        resetFrameId = 0;
        setHubSwapIdleHint(false);
        window.clearTimeout(idleTimer);
        idleTimer = window.setTimeout(() => setHubSwapIdleHint(true), 8000);
      });
    }

    window.addEventListener('pointermove', resetIdleTimer, { passive: true });
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer, { capture: true, passive: true });

    return () => {
      if (resetFrameId !== 0) {
        window.cancelAnimationFrame(resetFrameId);
      }

      window.clearTimeout(idleTimer);
      window.removeEventListener('pointermove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer, true);
    };
  }, [isOnGameHub, isOnNamiHub]);

  return (
    <aside
      className={
        'sidebar is-icon-rail is-collapsed' + (isOnGameHub || isOnNamiHub ? ' is-on-hub-surface' : '')
      }
    >
      <div aria-hidden="true" className="sidebar-official-logo-slot">
        <OwnerEditableImage
          className="sidebar-official-logo"
          fallback={<span aria-hidden="true">Nami</span>}
          label="Official Nami logo"
          nested
          slotId="sidebar-official-logo"
        />
      </div>

      <div className="sidebar-icon-rail-controls">
        <nav className="sidebar-nav">
          {isOnGameHub || isOnNamiHub ? (
            <button
              aria-label={'Switch to ' + hubSwapLabel}
              className={
                'sidebar-hub-rail-button sidebar-hub-swap is-active-sidebar-brand' +
                (hubSwapIdleHint ? ' is-hub-swap-idle-hint' : '')
              }
              onClick={() => props.onHubSwap(hubSwapTarget)}
              type="button"
            >
              <span aria-hidden="true" className="sidebar-hub-rail-mark-stack nav-icon">
                <OwnerEditableImage
                  className={
                    'diamond-mark sidebar-hub-swap-mark is-nami-hub-mark' +
                    (isOnGameHub ? ' is-alt-hub-mark' : ' is-current-hub-mark')
                  }
                  fallback={<span aria-hidden="true">N</span>}
                  label="Nami hub mark"
                  nested
                  slotId="hub-sidebar-logo"
                />
                <OwnerEditableImage
                  className={
                    'tcg-mark sidebar-hub-swap-mark is-game-hub-mark' +
                    (isOnGameHub ? ' is-current-hub-mark' : ' is-alt-hub-mark')
                  }
                  fallback={<span aria-hidden="true">G</span>}
                  label="Game hub sidebar icon"
                  nested
                  slotId="sidebar-nav-gamehub"
                />
              </span>
              <span className="sidebar-hub-swap-copy sidebar-nav-label">
                <span className="sidebar-hub-swap-label">{hubSwapLabel}</span>
                <span className="sidebar-hub-swap-hint">Switch hub</span>
              </span>
            </button>
          ) : (
            <button
              aria-label="Open Nami Hub"
              className="sidebar-hub-rail-button sidebar-brand-home"
              onClick={() => props.onNavigate('hub')}
              type="button"
            >
              <span aria-hidden="true" className="sidebar-hub-rail-mark-stack nav-icon">
                <OwnerEditableImage
                  className="diamond-mark sidebar-hub-swap-mark is-nami-hub-mark is-current-hub-mark"
                  fallback={<span aria-hidden="true">N</span>}
                  label="Nami hub mark"
                  nested
                  slotId="hub-sidebar-logo"
                />
              </span>
              <OwnerEditableImage
                className="sidebar-brand-wordmark sidebar-nav-label"
                fallback={<span>Nami Hub</span>}
                label="Hub wordmark"
                nested
                slotId="hub-sidebar-wordmark"
              />
            </button>
          )}

          {navItems.filter((item) => item.page !== 'hub').map((item) => {
            const isProfileNavActive =
              item.page === 'userProfile' &&
              (props.activePage === 'userProfile' ||
                (isGameChannelOwner() && props.activePage === 'channelProfile'));
            const isNavActive =
              item.page === 'guilds'
                ? isGuildNavPage(props.activePage)
                : isProfileNavActive || props.activePage === item.page;

            return (
            <button
              key={item.page}
              aria-label={item.shortLabel}
              className={isNavActive ? 'is-active' : ''}
              onClick={() => {
                if (item.page === 'userProfile' && isGameChannelOwner()) {
                  props.onOpenOwnedChannel?.();
                  return;
                }

                props.onNavigate(item.page);
              }}
              type="button"
            >
              <OwnerEditableImage
                className="nav-icon"
                fallback={<span aria-hidden="true">{item.shortLabel.slice(0, 1)}</span>}
                label={item.shortLabel + ' nav icon'}
                nested
                slotId={ownerAssetNavSlotId(item.page)}
              />
              <span className="sidebar-nav-label">{item.shortLabel}</span>
              {item.page === 'guilds' && props.guildEventUnreadCount > 0 ? (
                <span
                  aria-label={props.guildEventUnreadCount + ' new guild events'}
                  className="sidebar-nav-unread-pill"
                >
                  {props.guildEventUnreadCount}
                </span>
              ) : null}
              {item.page === 'messages' && props.messageUnreadCount > 0 ? (
                <span aria-label={props.messageUnreadCount + ' unread messages'} className="sidebar-nav-unread-pill">
                  {props.messageUnreadCount}
                </span>
              ) : null}
            </button>
            );
          })}
        </nav>

        <div className="sidebar-radio-block">
          <button
            aria-label={igniteRadioEnabled ? 'Radio on' : 'Ignite Radio'}
            aria-pressed={igniteRadioEnabled}
            className={'sidebar-radio-toggle' + (igniteRadioEnabled ? ' is-active-sidebar-radio' : '')}
            onClick={() => saveIgniteRadioEnabled(!igniteRadioEnabled)}
            type="button"
          >
            <OwnerEditableImage
              className="nav-icon"
              fallback={<span aria-hidden="true">♫</span>}
              label="Ignite Radio nav icon"
              nested
              slotId="sidebar-nav-radio"
            />
            <span className="sidebar-nav-label">{igniteRadioEnabled ? 'Radio On' : 'Ignite Radio'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

function FeaturedRail(props: {
  title: string;
  selectedChannel: NamiChannel;
  onSelect: (channel: NamiChannel) => void;
  onlySubscribed?: boolean;
}): ReactElement {
  const visibleChannels = props.onlySubscribed ? channels.slice(0, 4) : channels;

  return (
    <section className="feature-rail">
      <div className="rail-heading">
        <h2>{props.title}</h2>
        <p>{props.onlySubscribed ? 'Your pinned channels' : 'Featured discovery'}</p>
      </div>

      <div className="rail-scroll">
        {visibleChannels.map((channel) => (
          <div className="rail-item" key={channel.id}>
            <ChannelAvatar
              channel={channel}
              selected={channel.id === props.selectedChannel.id}
              onClick={() => props.onSelect(channel)}
            />
            <span>{channel.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ChannelInfoCard(props: {
  channel: NamiChannel;
  onSubscribe?: () => void;
  onJoinChat?: () => void;
  onGetBanners?: () => void;
  bannerAlertsEnabled?: boolean;
}): ReactElement {
  const canGetBanners = canSubscribeToChannelBanners(getSelfMember());

  return (
    <article className="featured-partner-banner-card channel-info-card">
      <ChannelAvatar channel={props.channel} size="lg" />
      <div>
        <div className="badge-row">
          {props.channel.verified && <span className="mini-badge">Verified</span>}
          {props.channel.partner && <span className="mini-badge">Partner</span>}
        </div>

        <h2>{props.channel.name}</h2>
        <p>{props.channel.tagline}</p>

        <dl>
          <div>
            <dt>Owner</dt>
            <dd>{props.channel.owner}</dd>
          </div>
          <div>
            <dt>Genre</dt>
            <dd>{props.channel.genre}</dd>
          </div>
          <div>
            <dt>Platforms</dt>
            <dd>{props.channel.platforms.join(', ')}</dd>
          </div>
          <div>
            <dt>Subscribers</dt>
            <dd>{props.channel.subscribers.toLocaleString()}</dd>
          </div>
        </dl>

        <div className="action-row">
          <button onClick={props.onSubscribe} type="button">Subscribe</button>
          <button onClick={props.onJoinChat} type="button">Join Chat</button>
          {canGetBanners ? (
            <button
              className={
                'secondary-action' + (props.bannerAlertsEnabled ? ' is-banner-alerts-active' : '')
              }
              onClick={props.onGetBanners}
              title={
                props.bannerAlertsEnabled
                  ? 'Focused banner alerts are on for this channel'
                  : 'Receive focused banner alerts from this game channel'
              }
              type="button"
            >
              {props.bannerAlertsEnabled ? 'Banners On' : 'Get Banners'}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ModuleGrid(props: {
  channel: NamiChannel;
  onNavigate?: (page: NamiPage) => void;
}): ReactElement {
  const modules =
    props.channel.modules.length > 0
      ? props.channel.modules
      : channels.find((channel) => channel.id === 'fiends')?.modules ?? [];

  return (
    <div className="module-grid">
      {modules.map((module) => (
        <button
          className="module-card"
          key={module.label}
          onClick={() => {
            const label = module.label.toLowerCase();

            if (label.includes('chat')) {
              props.onNavigate?.('chat');
            } else if (label.includes('profile')) {
              props.onNavigate?.('channelProfile');
            }
          }}
          type="button"
        >
          <strong>{module.label}</strong>
          <span>{module.description}</span>
        </button>
      ))}
    </div>
  );
}

type BubbleChannelEntry = {
  channel: NamiChannel;
  slotId: string;
};

type BubbleNode = {
  id: string;
  channel: NamiChannel;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  radius: number;
  baseRadius: number;
  scale: number;
  mass: number;
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 999.91) * 43758.5453123;
  return x - Math.floor(x);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const MEMBER_SPOTLIGHT_PRO_BUBBLE_SPACING_PX = 16;
const MEMBER_SPOTLIGHT_PRO_BUBBLE_COUNT = 5;
const MEMBER_SPOTLIGHT_PRO_BUBBLE_CYCLE_PX =
  MEMBER_SPOTLIGHT_PRO_BUBBLE_SPACING_PX * MEMBER_SPOTLIGHT_PRO_BUBBLE_COUNT;

const memberSpotlightProBubbleLayout = [
  { left: '14%', size: 11 },
  { left: '72%', size: 8 },
  { left: '38%', size: 13 },
  { left: '56%', size: 7 },
  { left: '24%', size: 10 },
] as const;

const MEMBER_SPOTLIGHT_ELITE_GLITTER_SPACING_PX = 12;
const MEMBER_SPOTLIGHT_ELITE_GLITTER_COUNT = 8;
const MEMBER_SPOTLIGHT_ELITE_GLITTER_CYCLE_PX =
  MEMBER_SPOTLIGHT_ELITE_GLITTER_SPACING_PX * MEMBER_SPOTLIGHT_ELITE_GLITTER_COUNT;

const memberSpotlightEliteGlitterLayout = [
  { left: '11%', width: 2, height: 7, rotate: 24, delay: 0 },
  { left: '78%', width: 3, height: 5, rotate: -38, delay: -0.6 },
  { left: '34%', width: 2, height: 9, rotate: 12, delay: -1.1 },
  { left: '62%', width: 2, height: 6, rotate: -18, delay: -1.8 },
  { left: '48%', width: 3, height: 4, rotate: 42, delay: -2.4 },
  { left: '22%', width: 2, height: 8, rotate: -28, delay: -3.1 },
  { left: '86%', width: 2, height: 6, rotate: 16, delay: -3.8 },
  { left: '56%', width: 2, height: 7, rotate: -44, delay: -4.5 },
] as const;

function NamiHub(props: {
  selectedChannel: NamiChannel;
  onSelect: (channel: NamiChannel) => void;
  onOpenProfile: (channel: NamiChannel) => void;
  onOpenMember: (member: (typeof members)[number]) => void;
  onOpenOwnedPartnerTicket?: () => void;
  onViewEvent: (event: StoredEvent) => void;
  onNavigateToSettings?: () => void;
  tagHandlers: TagNavigationHandlers;
}): ReactElement {
  const bubbleLeaderboardSize = useBubbleLeaderboardSize();
  const promotions = readChannelOwnerPromotionsState();
  const { channels: directoryChannels } = useChannelDirectory(50);
  const { members: directoryMembers } = useMemberDirectory();
  const hubFeaturedChannelId = readActiveHubFeaturedChannelId();
  const partnerTicket = promotions.partnerCarousel.ticket;
  const approvedPartnerChannelIds = readApprovedPartnerCarouselChannelIds();

  function resolveDirectoryChannel(channelId: string): NamiChannel | undefined {
    return (
      directoryChannels.find((channel) => channel.id === channelId) ??
      channels.find((channel) => channel.id === channelId) ??
      seedChannels.find((channel) => channel.id === channelId)
    );
  }

  const hubFeaturedChannel = hubFeaturedChannelId ? resolveDirectoryChannel(hubFeaturedChannelId) : null;
  const partnerCarouselChannel =
    approvedPartnerChannelIds.length > 0
      ? resolveDirectoryChannel(approvedPartnerChannelIds[0]!)
      : partnerTicket?.status === 'submitted' || partnerTicket?.status === 'approved'
        ? resolveDirectoryChannel(partnerTicket.channelId)
        : null;
  const featuredShowcaseChannels =
    directoryChannels.length > 0
      ? [
          ...(hubFeaturedChannel ? [hubFeaturedChannel] : []),
          ...directoryChannels.filter((channel) => channel.id !== hubFeaturedChannel?.id).slice(0, 8),
        ]
      : hubFeaturedChannel
        ? [hubFeaturedChannel]
        : [props.selectedChannel];
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);
  const [hoveredShowcaseChannelId, setHoveredShowcaseChannelId] = useState<string | null>(null);

  const activeFeaturedChannel =
    (hoveredShowcaseChannelId !== null
      ? featuredShowcaseChannels.find((channel) => channel.id === hoveredShowcaseChannelId) ??
        featuredShowcaseChannels[activeShowcaseIndex]
      : featuredShowcaseChannels[activeShowcaseIndex]) ?? props.selectedChannel;
  const partnerBannerTitle = partnerTicket?.title?.trim() || activeFeaturedChannel.name;
  const partnerBannerDescription = partnerTicket?.description?.trim() || activeFeaturedChannel.genre;
  const partnerBannerCover = partnerTicket?.coverUrl?.trim() ?? '';

  const sortedGrowthChannels = [...directoryChannels].sort((left, right) => {
    return right.subscribers - left.subscribers;
  });

  const growthChannels =
    sortedGrowthChannels.length > 0
      ? Array.from({ length: 14 }, (_, index) => {
          return sortedGrowthChannels[index % sortedGrowthChannels.length]!;
        })
      : [props.selectedChannel];

  const maxCommunitySubscribers = Math.max(
    1,
    ...growthChannels.map((channel) => channel.subscribers)
  );

  const topCommunityBubbles =
    sortedGrowthChannels.length > 0
      ? Array.from({ length: 50 }, (_, index) => {
          const channel = sortedGrowthChannels[index % sortedGrowthChannels.length]!;

          return {
            channel,
            slotId: channel.id + '-top-community-' + index,
          };
        })
      : Array.from({ length: 50 }, (_, index) => {
          return {
            channel: props.selectedChannel,
            slotId: props.selectedChannel.id + '-top-community-' + index,
          };
        });

  const spotlightEligibleMembers = directoryMembers.filter((member) => {
    return member.tier !== 'NPC' && member.signal !== 'Black';
  });

  const eliteSpotlightMembers = spotlightEligibleMembers.filter((member) => member.tier === 'Elite');
  const rotatingSpotlightSource = spotlightEligibleMembers.filter((member) => member.tier !== 'Elite');

  const spotlightDayOffset =
    rotatingSpotlightSource.length > 0
      ? Math.floor(Date.now() / 86400000) % rotatingSpotlightSource.length
      : 0;

  const spotlightMemberLimit = 18;
  const eliteSpotlightLimit = 3;

  const eliteSpotlightSlots = eliteSpotlightMembers.slice(0, eliteSpotlightLimit).map((member, index) => {
    return {
      member,
      slotId: member.id + '-elite-spotlight-' + index
    };
  });

  const rotatingSpotlightSlots =
    rotatingSpotlightSource.length > 0
      ? Array.from(
          { length: Math.max(0, spotlightMemberLimit - eliteSpotlightSlots.length) },
          (_, index) => {
            const member =
              rotatingSpotlightSource[
                (index + spotlightDayOffset) % rotatingSpotlightSource.length
              ]!;

            return {
              member,
              slotId: member.id + '-spotlight-' + index
            };
          }
        )
      : [];

  const spotlightMembers = [...eliteSpotlightSlots, ...rotatingSpotlightSlots].slice(0, spotlightMemberLimit);

  useEffect(() => {
    if (hoveredShowcaseChannelId !== null || featuredShowcaseChannels.length === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveShowcaseIndex((value) => (value + 1) % featuredShowcaseChannels.length);
    }, 2600);

    return () => window.clearInterval(intervalId);
  }, [featuredShowcaseChannels.length, hoveredShowcaseChannelId]);

  function openFeaturedChannel(channel: NamiChannel): void {
    props.onSelect(channel);
    props.onOpenProfile(channel);
  }

  function channelHandle(channel: NamiChannel): string {
    return channel.handle.startsWith('@') ? channel.handle : '@' + channel.handle;
  }

  return (
    <>
      <header className="page-title">
        <p>Signed-in dashboard</p>
        <h1>Nami Hub</h1>
      </header>

      <button
        className={
          'banner-panel featured-banner-carousel nami-hub-rotating-banner' +
          (partnerBannerCover ? ' has-partner-banner-cover' : '') +
          (hubFeaturedChannel ? ' is-hub-featured-active' : '')
        }
        onClick={() => {
          if (isGameChannelOwner()) {
            props.onOpenOwnedPartnerTicket?.();
            return;
          }

          openFeaturedChannel(activeFeaturedChannel);
        }}
        onMouseEnter={() => setHoveredShowcaseChannelId(activeFeaturedChannel.id)}
        onMouseLeave={() => setHoveredShowcaseChannelId(null)}
        style={
          partnerBannerCover
            ? { backgroundImage: 'url(' + JSON.stringify(partnerBannerCover) + ')' }
            : undefined
        }
        type="button"
      >
        <span>
          {partnerCarouselChannel
            ? 'Featured Partner Banner Carousel'
            : hubFeaturedChannel
              ? 'Hub Featured Game'
              : 'Featured Partner Banner Carousel'}
        </span>
        <strong>{partnerBannerTitle}</strong>
        <small>{partnerBannerDescription}</small>
      </button>

      <section className="nami-hub-lower-grid">
        <article className="panel community-growth-panel">
          <div className="profile-panel-heading">
            <h2>Community Growth</h2>
            <p>Clickable channel growth rows with subscriber momentum.</p>
          </div>

          <div className="community-growth-list">
            {growthChannels.map((channel, index) => {
              const growthPercent = Math.max(
                8,
                (channel.subscribers / maxCommunitySubscribers) * 100
              );

              return (
                <button
                  className="community-growth-row"
                  key={channel.id + '-growth-' + index}
                  onClick={() => openFeaturedChannel(channel)}
                  type="button"
                >
                  <span className="community-growth-handle">{channelHandle(channel)}</span>

                  <div className="community-growth-bar-shell">
                    <div
                      className="community-growth-bar"
                      style={{ width: growthPercent + '%' }}
                    />
                  </div>

                  <strong className="community-growth-value">
                    {channel.subscribers.toLocaleString()}
                  </strong>
                </button>
              );
            })}
          </div>
        </article>

        <article className="panel member-spotlight-panel">
          <div className="profile-panel-heading member-spotlight-header">
            <h2>Member Spotlight</h2>
            <p>18 verified members featured in a scrollable daily rotation with highlight badges and levels.</p>
          </div>

          <div className="member-spotlight-grid">
            {spotlightMembers.map(({ member, slotId }) => {
              const progression = getNamiProgression(member);
              const isOfficialNamiSpotlight = isNamiTeamMember(member);

              return (
                <button
                  className={
                      'member-spotlight-card ' +
                      (!isOfficialNamiSpotlight && member.tier === 'Elite'
                        ? 'is-elite-spotlight-member is-elite-surface '
                        : !isOfficialNamiSpotlight && member.tier === 'Pro'
                          ? 'is-pro-spotlight-member is-pro-surface '
                          : '') +
                      (member.tier === 'NPC' || member.signal === 'Black' ? 'is-npc-member ' : '') +
                      (member.signal !== 'Black' && member.tier !== 'NPC'
                        ? 'is-verified-spotlight-member'
                        : '') +
                      memberRainbowBorderClass(member) +
                      (isOfficialNamiSpotlight ? ' is-nami-official-galaxy-spotlight' : '')
                    }
                  key={slotId}
                  onClick={() => props.onOpenMember(member)}
                  type="button"
                >
                  {isOfficialNamiSpotlight ? (
                    <>
                      <div aria-hidden="true" className="nami-official-galaxy-sky">
                        <span className="nami-official-galaxy-shooting-star" />
                      </div>
                      <span aria-hidden="true" className="member-spotlight-rainbow-border" />
                    </>
                  ) : null}

                  {!isOfficialNamiSpotlight && member.tier === 'Pro' ? (
                    <span
                      aria-hidden="true"
                      className="member-spotlight-bubble-lane"
                      style={
                        {
                          '--member-spotlight-bubble-cycle':
                            String(MEMBER_SPOTLIGHT_PRO_BUBBLE_CYCLE_PX) + 'px',
                          '--member-spotlight-bubble-spacing':
                            String(MEMBER_SPOTLIGHT_PRO_BUBBLE_SPACING_PX) + 'px',
                        } as CSSProperties
                      }
                    >
                      <span className="member-spotlight-bubble-loop">
                        {[0, 1].map((passIndex) => (
                          <span className="member-spotlight-bubble-pass" key={'pro-bubble-pass-' + passIndex}>
                            {memberSpotlightProBubbleLayout.map((bubble, bubbleIndex) => (
                              <i
                                className="member-spotlight-float-bubble"
                                key={'pro-bubble-' + passIndex + '-' + bubbleIndex}
                                style={
                                  {
                                    left: bubble.left,
                                    top:
                                      String(bubbleIndex * MEMBER_SPOTLIGHT_PRO_BUBBLE_SPACING_PX) + 'px',
                                    width: String(bubble.size) + 'px',
                                    height: String(bubble.size) + 'px',
                                  } as CSSProperties
                                }
                              />
                            ))}
                          </span>
                        ))}
                      </span>
                    </span>
                  ) : null}

                  {!isOfficialNamiSpotlight && member.tier === 'Elite' ? (
                    <span
                      aria-hidden="true"
                      className="member-spotlight-glitter-lane"
                      style={
                        {
                          '--member-spotlight-glitter-cycle':
                            String(MEMBER_SPOTLIGHT_ELITE_GLITTER_CYCLE_PX) + 'px',
                          '--member-spotlight-glitter-spacing':
                            String(MEMBER_SPOTLIGHT_ELITE_GLITTER_SPACING_PX) + 'px',
                        } as CSSProperties
                      }
                    >
                      <span className="member-spotlight-glitter-loop">
                        {[0, 1].map((passIndex) => (
                          <span
                            className="member-spotlight-glitter-pass"
                            key={'elite-glitter-pass-' + passIndex}
                          >
                            {memberSpotlightEliteGlitterLayout.map((glitter, glitterIndex) => (
                              <i
                                className="member-spotlight-glitter-shard"
                                key={'elite-glitter-' + passIndex + '-' + glitterIndex}
                                style={
                                  {
                                    left: glitter.left,
                                    top:
                                      String(glitterIndex * MEMBER_SPOTLIGHT_ELITE_GLITTER_SPACING_PX) +
                                      'px',
                                    width: String(glitter.width) + 'px',
                                    height: String(glitter.height) + 'px',
                                    '--member-spotlight-glitter-rotate': String(glitter.rotate) + 'deg',
                                    '--member-spotlight-glitter-delay': String(glitter.delay) + 's',
                                  } as CSSProperties
                                }
                              />
                            ))}
                          </span>
                        ))}
                      </span>
                    </span>
                  ) : null}

                  {!isOfficialNamiSpotlight ? (
                    <span className="member-spotlight-foil" aria-hidden="true" />
                  ) : null}

                  <div className="member-spotlight-content">
                    <div className="member-spotlight-avatar-wrap">
                      <div className="member-spotlight-avatar-frame">
                        {isOfficialNamiSpotlight ? (
                          <span aria-hidden="true" className="member-spotlight-avatar-rainbow-border" />
                        ) : null}
                        <UniformMemberAvatar className="member-spotlight-avatar" member={member} />
                      </div>
                    </div>

                    <div className="member-spotlight-copy">
                      <strong className="member-spotlight-name">{member.name}</strong>
                      <span className="member-spotlight-meta">
                        <span
                          className={
                            'member-spotlight-tier-chip' +
                            (member.tier === 'Elite'
                              ? ' is-elite-tier-chip'
                              : member.tier === 'Pro'
                                ? ' is-pro-tier-chip'
                                : '')
                          }
                        >
                          {member.tier}
                        </span>
                        <span className="member-spotlight-level-label">
                          Lv {progression.level}
                        </span>
                      </span>
                    </div>

                    {member.signal !== 'Black' && member.tier !== 'NPC' ? (
                      <span
                        className="member-spotlight-verified-chip verification-check-chip"
                        aria-label="Verified member"
                        title="Verified member"
                      >
                        <i aria-hidden="true" className="member-spotlight-verified-icon" />
                      </span>
                    ) : (
                      <span aria-hidden="true" className="member-spotlight-verified-spacer" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </article>
      </section>

      <CryptoBubbleBoard
        activeChannelId={activeFeaturedChannel.id}
        entries={topCommunityBubbles}
        maxEntries={bubbleLeaderboardSize}
        onHoverChannel={setHoveredShowcaseChannelId}
        onMaxEntriesChange={saveBubbleLeaderboardSize}
        onOpenChannel={openFeaturedChannel}
        showCountToggle
      />

      <HubEventsPanel onViewEvent={props.onViewEvent} />

      <HubGlobalChatsSection onOpenMember={props.onOpenMember} tagHandlers={props.tagHandlers} />
    </>
  );
}




function GameHubDirectoryEmpty(props: { title: string; copy: string }): ReactElement {
  return (
    <div className="profile-empty-state-copy gamehub-directory-empty">
      <strong>{props.title}</strong>
      <p>{props.copy}</p>
    </div>
  );
}

function GameHub(props: {
  selectedChannel: NamiChannel;
  onSelect: (channel: NamiChannel) => void;
  onOpenProfile: (channel: NamiChannel) => void;
  onOpenMember: (member: (typeof members)[number]) => void;
  tagHandlers: TagNavigationHandlers;
}): ReactElement {
  useChannelCoverVersion();
  const { channels: directoryChannels } = useChannelDirectory(50);
  const [activeGenreChatId, setActiveGenreChatId] = useState(genreOfficialChats[0]!.id);
  const [genreDockCollapsed, setGenreDockCollapsed] = useState(() => readGenreChatDockCollapsed());
  const [genreDockPinned, setGenreDockPinned] = useState(() => readGenreChatDockPinned());

  useEffect(() => {
    releaseExpandedChatScrollLock();

    return () => {
      releaseExpandedChatScrollLock();
    };
  }, []);
  const [interestModules, setInterestModules] = useState<GameHubInterestModule[]>(() => {
    return readGameHubInterestModules();
  });
  const [nextModuleKind, setNextModuleKind] = useState<'genre' | 'game' | 'game-genre'>('genre');
  const [nextModuleFilter, setNextModuleFilter] = useState<GameHubBrowserFilter>('Games');
  const [draggedInterestModuleId, setDraggedInterestModuleId] = useState<string | null>(null);
  const genreBubbleEntries = useMemo(() => buildGenreBubbleEntries(), []);
  const partnerChannels = directoryChannels.filter((channel) => channel.partner);
  const topChannels = [...directoryChannels]
    .sort((left, right) => right.subscribers - left.subscribers)
    .slice(0, 4);

  const randomizedBrowserEntries = useMemo(() => {
    return directoryChannels
      .concat(directoryChannels, directoryChannels)
      .map((channel, copyIndex) => ({
        channel,
        copyIndex,
        sortKey: Math.random()
      }))
      .sort((left, right) => left.sortKey - right.sortKey);
  }, [directoryChannels]);

  const [selectedBrowserFilter, setSelectedBrowserFilter] = useState<GameHubBrowserFilter>('All');
  const [browserViewMode, setBrowserViewMode] = useState<'tiles' | 'swipe'>('tiles');
  const [swipeIndex, setSwipeIndex] = useState(0);
  const tileStripRef = useHorizontalScrollStrip<HTMLDivElement>();

  function openGenreBubbleChannel(channel: NamiChannel): void {
    const genreChat = genreOfficialChats.find((chat) => chat.id === channel.id);

    if (genreChat) {
      setActiveGenreChatId(genreChat.id);

      if (genreDockPinned) {
        setGenreDockCollapsed(false);
        saveGenreChatDockCollapsed(false);
      }

      return;
    }

    props.onOpenProfile(channel);
  }

  const filteredBrowserEntries = randomizedBrowserEntries.filter(({ channel }) => {
    return channelMatchesGameHubFilter(channel, selectedBrowserFilter);
  });

  const filteredBrowserChannels = filteredBrowserEntries.map(({ channel }) => channel);
  const activeSwipeChannel =
    filteredBrowserChannels[swipeIndex % Math.max(1, filteredBrowserChannels.length)] ?? props.selectedChannel;
  const nextSwipeChannel =
    filteredBrowserChannels.length > 1
      ? filteredBrowserChannels[(swipeIndex + 1) % filteredBrowserChannels.length]!
      : activeSwipeChannel;
  const thirdSwipeChannel =
    filteredBrowserChannels.length > 2
      ? filteredBrowserChannels[(swipeIndex + 2) % filteredBrowserChannels.length]!
      : nextSwipeChannel;
  const activeSwipeDeveloper = channelDeveloper(activeSwipeChannel);

  useEffect(() => {
    setSwipeIndex(0);
  }, [selectedBrowserFilter, browserViewMode]);

  function moveSwipeDeck(direction: 'previous' | 'next'): void {
    if (filteredBrowserChannels.length === 0) return;

    setSwipeIndex((value) => {
      const nextValue = direction === 'previous' ? value - 1 : value + 1;
      return (nextValue + filteredBrowserChannels.length) % filteredBrowserChannels.length;
    });
  }

  function persistInterestModules(nextModules: GameHubInterestModule[]): void {
    setInterestModules(nextModules);
    saveGameHubInterestModules(nextModules);
  }

  function addInterestModule(): void {
    const templateChannel =
      directoryChannels[interestModules.length % Math.max(1, directoryChannels.length)] ??
      props.selectedChannel;
    const label =
      nextModuleKind === 'game'
        ? templateChannel.name
        : nextModuleKind === 'game-genre'
          ? templateChannel.genre
          : templateChannel.genre.split('/')[0]?.trim() ?? 'Genre';
    persistInterestModules([
      ...interestModules,
      {
        id: 'interest-' + Date.now(),
        label,
        kind: nextModuleKind,
        ref:
          nextModuleKind === 'game'
            ? templateChannel.handle
            : nextModuleKind === 'game-genre'
              ? templateChannel.genre
              : label,
        filters: [nextModuleFilter],
      },
    ]);
  }

  function toggleInterestModuleFilter(moduleId: string, filter: GameHubBrowserFilter): void {
    persistInterestModules(
      interestModules.map((module) => {
        if (module.id !== moduleId) {
          return module;
        }

        const hasFilter = module.filters.includes(filter);
        const nextFilters = hasFilter
          ? module.filters.filter((entry) => entry !== filter)
          : [...module.filters, filter];

        return {
          ...module,
          filters: nextFilters.length > 0 ? nextFilters : [filter],
        };
      })
    );
  }

  function removeInterestModule(moduleId: string): void {
    persistInterestModules(interestModules.filter((module) => module.id !== moduleId));
  }

  function dropInterestModule(targetModuleId: string): void {
    const movingModuleId = draggedInterestModuleId;

    if (!movingModuleId || movingModuleId === targetModuleId) {
      setDraggedInterestModuleId(null);
      return;
    }

    persistInterestModules(
      (() => {
        const nextModules = interestModules.filter((module) => module.id !== movingModuleId);
        const targetIndex = nextModules.findIndex((module) => module.id === targetModuleId);

        if (targetIndex === -1) {
          return interestModules;
        }

        const movingModule = interestModules.find((module) => module.id === movingModuleId);

        if (!movingModule) {
          return interestModules;
        }

        nextModules.splice(targetIndex, 0, movingModule);
        return nextModules;
      })()
    );

    setDraggedInterestModuleId(null);
  }

  return (
    <>
      <header className="page-title gamehub-page-title">
        <p>{GAME_HUB_INTRO.eyebrow}</p>
        <h1>Game Hub</h1>
      </header>

      <section className="gamehub-top-panel gamehub-discovery-panels">
        <article className="gamehub-discovery-panel is-partner-panel" id="gamehub-partners">
          <header className="gamehub-discovery-panel-head">
            <span className="gamehub-discovery-eyebrow">Partner Channels</span>
            <h2>Official partner spaces</h2>
            <p>Verified studios and channels with Nami partner status.</p>
          </header>

          <div className="gamehub-discovery-channel-grid">
            {partnerChannels.length === 0 ? (
              <GameHubDirectoryEmpty
                copy="Partner channels appear here once studios claim verified placement. Browse the channel grid below while the catalog fills in."
                title="No partner channels ranked yet"
              />
            ) : null}
            {partnerChannels.map((channel) => (
              <button
                className={'gamehub-discovery-channel-card' + channelRainbowBorderClass(channel)}
                key={channel.id}
                onClick={() => props.onOpenProfile(channel)}
                type="button"
              >
                <ChannelAvatar channel={channel} size="sm" />
                <span className="gamehub-discovery-channel-copy">
                  <strong>{channel.name}</strong>
                  <small>{channel.genre}</small>
                  <em>{channel.subscribers.toLocaleString()} members</em>
                </span>
                <span className="gamehub-discovery-channel-cta">Open</span>
              </button>
            ))}
          </div>
        </article>

        <article className="gamehub-discovery-panel is-top-panel" id="gamehub-trending">
          <header className="gamehub-discovery-panel-head">
            <span className="gamehub-discovery-eyebrow">Top Channels</span>
            <h2>Trending right now</h2>
            <p>Ranked by live subscriber momentum across Game Hub.</p>
          </header>

          <ol className="gamehub-discovery-rank-list">
            {topChannels.length === 0 ? (
              <li>
                <GameHubDirectoryEmpty
                  copy="Trending ranks populate from live discovery cycles. Follow channels you like — momentum updates as communities grow."
                  title="Trending list is warming up"
                />
              </li>
            ) : null}
            {topChannels.map((channel, index) => {
              const topMax = topChannels[0]?.subscribers ?? 1;
              const momentum = Math.max(12, (channel.subscribers / topMax) * 100);

              return (
                <li key={channel.id}>
                  <button
                    className={'gamehub-discovery-rank-row' + channelRainbowBorderClass(channel)}
                    onClick={() => props.onOpenProfile(channel)}
                    type="button"
                  >
                    <span className="gamehub-discovery-rank-index">#{index + 1}</span>
                    <ChannelAvatar channel={channel} size="sm" />
                    <span className="gamehub-discovery-rank-copy">
                      <strong>{channel.name}</strong>
                      <small>{channel.subscribers.toLocaleString()} subscribers</small>
                      <span className="gamehub-discovery-rank-bar" style={{ width: momentum + '%' }} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </article>

        <article className="gamehub-discovery-panel is-placement-panel">
          <header className="gamehub-discovery-panel-head">
            <span className="gamehub-discovery-eyebrow">Featured Placement</span>
            <h2>Boost your discovery slot</h2>
            <p>Paid placement increases visibility — not trust or verification.</p>
          </header>

          <ul className="gamehub-placement-benefits">
            <li>Higher browser rotation weight</li>
            <li>Partner carousel eligibility</li>
            <li>Genre bubble spotlight priority</li>
          </ul>

          <button
            className={
              'gamehub-placement-preview' + channelRainbowBorderClass(props.selectedChannel)
            }
            onClick={() => props.onOpenProfile(props.selectedChannel)}
            type="button"
          >
            <ChannelAvatar channel={props.selectedChannel} size="sm" />
            <span>
              <strong>{props.selectedChannel.name}</strong>
              <small>Preview your featured placement card</small>
            </span>
            <em>View channel</em>
          </button>
        </article>
      </section>

      <section className="panel gamehub-browser" id="gamehub-browser">
        <div className="browser-heading gamehub-browser-heading">
          <div>
            <h2>Channel Browser</h2>
            <p>
              Scroll three rows of TCG cover tiles horizontally. Partner channels get the graded foil
              slab. Hover a tile to reveal channel details.
            </p>
          </div>

          <div className="gamehub-browser-controls">
            <div className="gamehub-view-toggle" aria-label="Channel browser view mode">
              <button
                className={'nami-surface-button' + (browserViewMode === 'tiles' ? ' is-active-view' : '')}
                onClick={() => setBrowserViewMode('tiles')}
                type="button"
              >
                Tile Strip
              </button>
              <button
                className={'nami-surface-button' + (browserViewMode === 'swipe' ? ' is-active-view' : '')}
                onClick={() => setBrowserViewMode('swipe')}
                type="button"
              >
                Swipe Deck
              </button>
            </div>
          </div>
        </div>

        <div className="filter-row gamehub-filter-row" role="tablist" aria-label="Game Hub browser filters">
          {gameHubBrowserFilters.map((filter) => (
            <button
              aria-pressed={selectedBrowserFilter === filter}
              className={
                'nami-surface-button' + (selectedBrowserFilter === filter ? ' is-active-filter' : '')
              }
              key={filter}
              onClick={() => setSelectedBrowserFilter(filter)}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>

        {filteredBrowserEntries.length === 0 ? (
          <GameHubDirectoryEmpty
            copy="Try a different filter or check back after the next discovery cycle. Preview channels stay visible while dev fixtures are enabled."
            title="No channels match this filter"
          />
        ) : null}

        {browserViewMode === 'tiles' ? (
          <div
            aria-label="Channel browser tile grid"
            className="gamehub-channel-tile-strip"
            ref={tileStripRef}
            role="region"
            tabIndex={0}
          >
            <div className="gamehub-channel-tile-grid">
              {filteredBrowserEntries.map(({ channel, copyIndex }) => {
                const channelTheme = getStoredChannelBrandTheme(channel.id);

                return (
                  <GameHubChannelTile
                    brandPrimary={channelTheme.primary}
                    brandSoft={channelTheme.secondary}
                    channel={channel}
                    key={channel.id + '-' + copyIndex}
                    onOpen={() => props.onOpenProfile(channel)}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <section className="gamehub-swipe-stage" aria-label="Swipe deck channel browser">
            <div className="gamehub-swipe-copy">
              <span className="feature-label">Swipe Discovery</span>
              <h3>Browse game covers like a deck</h3>
              <p>
                Game channels use full-card cover art. Verified game channels receive the graded foil sleeve.
              </p>
              <strong>
                {filteredBrowserChannels.length === 0
                  ? '0 / 0'
                  : (swipeIndex + 1).toLocaleString() + ' / ' + filteredBrowserChannels.length.toLocaleString()}
              </strong>
            </div>

            <div className="gamehub-swipe-deck">
              <div className="gamehub-swipe-shadow-card is-third">
                <strong>{thirdSwipeChannel.name}</strong>
              </div>
              <div className="gamehub-swipe-shadow-card is-second">
                <strong>{nextSwipeChannel.name}</strong>
              </div>

              <article
                className={
                  'gamehub-swipe-card gamehub-swipe-cover-card ' +
                  gameVerificationClass(activeSwipeChannel) +
                  (activeSwipeChannel.verifiedGame ? ' is-verified-foil' : '')
                }
                onPointerLeave={(event) => {
                  resetGameCardTilt(event.currentTarget);
                }}
                onPointerMove={(event) => {
                  updateGameCardTilt(event.currentTarget, event.clientX, event.clientY);
                }}
                style={
                  {
                    '--game-card-brand': getStoredChannelBrandTheme(activeSwipeChannel.id).primary,
                    '--game-card-brand-soft': getStoredChannelBrandTheme(activeSwipeChannel.id).secondary,
                      ...gameCoverAssetVariables(activeSwipeChannel)
                  } as CSSProperties
                }
              >
                <div
                    className={'gamehub-swipe-cover-art' + (resolveChannelCoverUrl(activeSwipeChannel) ? ' has-game-cover-image' : '')}
                    aria-hidden="true"
                  >
                  <span>{activeSwipeChannel.name.slice(0, 2).toUpperCase()}</span>
                </div>

                <div className="gamehub-swipe-cover-overlay">
                  <div className="gamehub-swipe-card-top">
                    <span
                      className={'gamehub-dev-logo ' + developerVerificationClass(activeSwipeDeveloper)}
                      title={activeSwipeDeveloper.name + ' · ' + activeSwipeDeveloper.proofStatus}
                    >
                      {activeSwipeDeveloper.logoSeed}
                    </span>

                    <span className="gamehub-cover-icons">
                      <i
                        className={'gamehub-proof-icon ' + gameVerificationClass(activeSwipeChannel)}
                        title={gameVerificationBadgeLabel(activeSwipeChannel)}
                      >
                        {gameVerificationShortLabel(activeSwipeChannel)}
                      </i>
                      <i
                        className={'gamehub-studio-proof-icon ' + developerVerificationClass(activeSwipeDeveloper)}
                        title={activeSwipeDeveloper.proofStatus}
                      >
                        {developerShortProofLabel(activeSwipeDeveloper)}
                      </i>

                    </span>
                  </div>

                  <div className="gamehub-swipe-card-copy">
                    <div className="gamehub-swipe-taxonomy-row">
                      <span className="gamehub-swipe-surface-label">
                        <i aria-hidden="true">▣</i>
                        Game
                      </span>
                      <i className={gameVerificationClass(activeSwipeChannel)}>
                        {gameVerificationShortLabel(activeSwipeChannel)}
                      </i>
                      <em>{developerShortProofLabel(activeSwipeDeveloper)}</em>
                    </div>

                    <h3>{activeSwipeChannel.name}</h3>
                    <p>{activeSwipeChannel.genre} · {activeSwipeChannel.platforms.join(' / ')}</p>
                  </div>

                  <div className="gamehub-swipe-meta">
                    <span>{activeSwipeChannel.subscribers.toLocaleString()}</span>
                    <span>{activeSwipeChannel.handle}</span>
                    <span>{gameVerificationBadgeLabel(activeSwipeChannel)}</span>
                  </div>
                </div>
              </article>
            </div>

            <div className="gamehub-swipe-actions">
              <button className="nami-surface-button" onClick={() => moveSwipeDeck('previous')} type="button">
                Swipe Left
              </button>
              <button
                className="nami-surface-button is-primary-surface-button is-open-swipe-card"
                onClick={() => props.onOpenProfile(activeSwipeChannel)}
                type="button"
              >
                View Profile
              </button>
              <button className="nami-surface-button" onClick={() => moveSwipeDeck('next')} type="button">
                Swipe Right
              </button>
            </div>
          </section>
        )}

        <div className="gamehub-genre-chats-under-browser" id="gamehub-genre">
          <CryptoBubbleBoard
            activeChannelId={activeGenreChatId}
            badgeLabel="Genre lounges"
            boardClassName="is-genre-bubble-board"
            bubbleScale={1.28}
            entries={genreBubbleEntries}
            heading="Genre Chats"
            onHoverChannel={() => undefined}
            onOpenChannel={openGenreBubbleChannel}
            subheading={
              genreDockPinned
                ? '23 official IGDB genre lounges under Channel Browser. Bubble size reflects active members.'
                : 'Unpinned panel view. Pick from 23 official genre lounges below or pin the floating dock again.'
            }
          />

          {!genreDockPinned ? (
            <article className="panel gamehub-genre-chats-inline-panel">
              <div className="gamehub-genre-chats-inline-head">
                <div>
                  <h3>Genre Chats</h3>
                  <p>Normal panel view with full-width readable chat.</p>
                </div>
                <button
                  className="nami-surface-button is-primary-surface-button"
                  onClick={() => {
                    setGenreDockPinned(true);
                    saveGenreChatDockPinned(true);
                    setGenreDockCollapsed(false);
                    saveGenreChatDockCollapsed(false);
                  }}
                  type="button"
                >
                  Pin chat dock
                </button>
              </div>

              <div className="genre-chat-pinned-room-row" role="tablist" aria-label="Genre chat rooms">
                {genreOfficialChats.map((chat) => (
                  <button
                    aria-selected={chat.id === activeGenreChatId}
                    className={
                      'genre-chat-pinned-room-tab' + (chat.id === activeGenreChatId ? ' is-active-genre-room' : '')
                    }
                    key={chat.id}
                    onClick={() => setActiveGenreChatId(chat.id)}
                    role="tab"
                    type="button"
                  >
                    {chat.title}
                  </button>
                ))}
              </div>

              <GenreChatRoomPanel
                activeChatId={activeGenreChatId}
                onOpenMember={props.onOpenMember}
                tagHandlers={props.tagHandlers}
              />
            </article>
          ) : null}
        </div>
      </section>

      <section className="gamehub-interest-modules-stack">
        {interestModules.map((module) => {
          const moduleChannels = channelsForModuleFilters(directoryChannels, module.filters).slice(0, 8);

          return (
            <article
              className={
                'panel gamehub-interest-module-panel' +
                (module.id === draggedInterestModuleId ? ' is-dragging-interest-module' : '')
              }
              draggable
              key={module.id}
              onDragEnd={() => setDraggedInterestModuleId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => setDraggedInterestModuleId(module.id)}
              onDrop={() => dropInterestModule(module.id)}
            >
              <div className="gamehub-interest-module-head">
                <span className="module-dot-handle" aria-hidden="true">
                  ⋮⋮
                </span>
                <div>
                  <strong>{module.label}</strong>
                  <small>
                    {module.kind} · {module.ref} · {moduleChannels.length} channel
                    {moduleChannels.length === 1 ? '' : 's'}
                  </small>
                </div>
                <button
                  className="nami-surface-button"
                  onClick={() => removeInterestModule(module.id)}
                  type="button"
                >
                  Remove
                </button>
              </div>

              <div
                className="filter-row gamehub-module-filter-row"
                role="group"
                aria-label={module.label + ' filters'}
              >
                {gameHubBrowserFilters.map((filter) => (
                  <button
                    aria-pressed={module.filters.includes(filter)}
                    className={
                      'nami-surface-button' + (module.filters.includes(filter) ? ' is-active-filter' : '')
                    }
                    key={module.id + '-' + filter}
                    onClick={() => toggleInterestModuleFilter(module.id, filter)}
                    type="button"
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="gamehub-module-channel-grid">
                {moduleChannels.length === 0 ? (
                  <p className="gamehub-module-empty-copy">No channels match the selected filters yet.</p>
                ) : (
                  moduleChannels.map((channel) => (
                    <button
                      className="gamehub-module-channel-card"
                      key={module.id + '-' + channel.id}
                      onClick={() => props.onOpenProfile(channel)}
                      type="button"
                    >
                      <ChannelAvatar channel={channel} size="md" />
                      <span>
                        <strong>{channel.name}</strong>
                        <small>{channel.genre}</small>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </article>
          );
        })}
      </section>

      <section className="panel gamehub-interest-tracker-panel gamehub-interest-add-panel">
        <div className="interest-tracker">
          <div>
            <h3>Preferred Channels & Interests</h3>
            <p>Add draggable filter modules above. This control always stays pinned at the bottom.</p>
          </div>

          <div className="interest-module-create-row">
            <select
              aria-label="Module type"
              className="gamehub-module-type-select"
              onChange={(event) =>
                setNextModuleKind(event.target.value as 'genre' | 'game' | 'game-genre')
              }
              value={nextModuleKind}
            >
              <option value="genre">Genre</option>
              <option value="game">Specific game card</option>
              <option value="game-genre">Game genre</option>
            </select>
            <select
              aria-label="Filter for new module"
              className="gamehub-module-type-select gamehub-module-filter-select"
              onChange={(event) =>
                setNextModuleFilter(event.target.value as GameHubBrowserFilter)
              }
              value={nextModuleFilter}
            >
              {gameHubBrowserFilters
                .filter((filter) => filter !== 'All')
                .map((filter) => (
                  <option key={filter} value={filter}>
                    {filter}
                  </option>
                ))}
            </select>
            <button className="nami-surface-button is-primary-surface-button" onClick={addInterestModule} type="button">
              + Add Section / Module
            </button>
          </div>
        </div>
      </section>

      {genreDockPinned ? (
        <PinnedGenreChatDock
          activeChatId={activeGenreChatId}
          collapsed={genreDockCollapsed}
          pinned={genreDockPinned}
          onCollapsedChange={setGenreDockCollapsed}
          onOpenMember={props.onOpenMember}
          onPinnedChange={setGenreDockPinned}
          onSelectChat={setActiveGenreChatId}
          tagHandlers={props.tagHandlers}
        />
      ) : null}
    </>
  );
}

type ChannelBrandTheme = {
  key: string;
  label: string;
  primary: string;
  secondary: string;
  glow: string;
};

const channelBrandThemes: ChannelBrandTheme[] = [
  {
    key: 'nami',
    label: 'Nami Blue',
    primary: '#75d7ff',
    secondary: '#1f65ff',
    glow: 'rgba(117, 215, 255, 0.2)'
  },
  {
    key: 'fiends',
    label: 'Fiends Red',
    primary: '#ff3152',
    secondary: '#a01c30',
    glow: 'rgba(255, 49, 82, 0.2)'
  },
  {
    key: 'ocean',
    label: 'Ocean Mint',
    primary: '#43f5a7',
    secondary: '#0c7f65',
    glow: 'rgba(67, 245, 167, 0.2)'
  },
  {
    key: 'ember',
    label: 'Ember Gold',
    primary: '#ffb84d',
    secondary: '#ff3152',
    glow: 'rgba(255, 184, 77, 0.2)'
  }
];

function getDefaultChannelBrandTheme(): ChannelBrandTheme {
  return channelBrandThemes[0]!;
}

function getChannelBrandThemeByKey(key: string | null): ChannelBrandTheme {
  return channelBrandThemes.find((theme) => theme.key === key) ?? getDefaultChannelBrandTheme();
}

function getStoredChannelBrandTheme(channelId: string): ChannelBrandTheme {
  try {
    return getChannelBrandThemeByKey(
      window.localStorage.getItem('nami-profile-brand-theme-' + channelId)
    );
  } catch {
    return getDefaultChannelBrandTheme();
  }
}

function applyChannelBrandToDocument(theme: ChannelBrandTheme): void {
  document.documentElement.style.setProperty('--active-channel-brand-primary', theme.primary);
  document.documentElement.style.setProperty('--active-channel-brand-secondary', theme.secondary);
  document.documentElement.style.setProperty('--active-channel-brand-glow', theme.glow);
}

function StudioProfileScreen(props: {
  developer: (typeof developers)[number];
  onNavigate: (page: NamiPage) => void;
  onOpenProfile: (channel: NamiChannel) => void;
  returnPage: NamiPage;
  returnLabel: string;
}): ReactElement {
  useStudioLogoVersion();
  const developer = withStudioLogo(props.developer);
  const studioGames = developerGameChannels(developer);
  const leadGame = studioGames[0] ?? channels[0]!;
  const studioTheme = useMemo(() => getStoredChannelBrandTheme(leadGame.id), [leadGame.id]);
  const proofClass = developerVerificationClass(developer);
  const totalReach = studioGames.reduce((sum, channel) => sum + channel.subscribers, 0);

  const studioProofs = [
    {
      label: 'Studio Surface',
      value: 'Developer profile',
      detail: 'Separate from game and member profiles.'
    },
    {
      label: 'Proof Status',
      value: developer.proofStatus,
      detail: developer.approved
        ? 'Studio identity has approval signals.'
        : 'Community maintainer surface without verified studio status.'
    },
    {
      label: 'Trust Rule',
      value: 'Proofs, not payment',
      detail: 'Paid placement never creates verification or trust.'
    }
  ];

  useEffect(() => {
    applyChannelBrandToDocument(studioTheme);

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [studioTheme]);

  return (
    <>
      <header className="page-title">
        <p>Developer identity and approved game directory</p>
        <h1>{developer.name}</h1>
      </header>

      <section className="studio-profile-page">
        <article className={'panel studio-hero-card ' + proofClass}>
          <div className="studio-hero-topbar">
            <button
              className="profile-return-button studio-return-button"
              onClick={() => props.onNavigate(props.returnPage)}
              type="button"
            >
              ← {props.returnLabel}
            </button>

            <span className={'studio-proof-pill ' + proofClass}>
              {developerShortProofLabel(developer)} · {developer.proofStatus}
            </span>
          </div>

          <div className="studio-hero-main">
            <div
              className={
                'studio-logo-mark ' +
                proofClass +
                (developer.logoImageUrl ? ' has-studio-logo-image' : '')
              }
              style={studioLogoAssetVariables(developer)}
            >
              {developer.logoSeed}
            </div>

            <div className="studio-hero-copy">
              <div className="surface-separation-row studio-surface-row">
                <span>Studio Profile</span>
                <span>{developer.handle}</span>
                <i>{developer.approved ? 'Approved developer surface' : 'Community maintainer surface'}</i>
              </div>

              <h2>{developer.name}</h2>
              <p>
                Studio profiles hold developer identity, proof status, and the approved game directory.
                Game profiles keep game-specific community content, and member profiles keep levels and passport progression.
              </p>

              <div className="studio-stat-row">
                <span>
                  <strong>{studioGames.length}</strong>
                  Games
                </span>
                <span>
                  <strong>{totalReach.toLocaleString()}</strong>
                  Reach
                </span>
                <span className="studio-signal-stat">
                  <ConductSignalDot signal={developer.studioSignal} />
                  <strong>Owner signal</strong>
                </span>
              </div>
            </div>
          </div>
        </article>

        <EmbeddedSocialPanel surface="studio" title="Studio Feed" />

        <section className="studio-profile-grid">
          <article className="panel studio-directory-panel">
            <div className="profile-panel-heading">
              <h2>Approved Game Directory</h2>
              <p>Games linked to this developer/studio surface.</p>
            </div>

            <div className="studio-game-directory">
              {studioGames.map((channel) => (
                <button
                  className={'studio-game-card ' + gameVerificationClass(channel)}
                  key={channel.id}
                  onClick={() => props.onOpenProfile(channel)}
                  type="button"
                >
                  <span className="studio-game-cover">{channel.name.slice(0, 2).toUpperCase()}</span>

                  <div>
                    <strong>{channel.name}</strong>
                    <small>{channel.genre} · {channel.platforms.join(' / ')}</small>
                  </div>

                  <i>{gameVerificationShortLabel(channel)}</i>
                </button>
              ))}
            </div>
          </article>

          <article className="panel studio-proof-panel">
            <div className="profile-panel-heading">
              <h2>Developer Trust Proofs</h2>
              <p>Studio verification remains separate from paid visibility.</p>
            </div>

            <div className="studio-proof-grid">
              {studioProofs.map((proof) => (
                <div className="studio-proof-card" key={proof.label}>
                  <span>{proof.label}</span>
                  <strong>{proof.value}</strong>
                  <p>{proof.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel studio-boundary-panel">
            <div className="profile-panel-heading">
              <h2>Surface Boundaries</h2>
              <p>Each profile type owns different identity signals.</p>
            </div>

            <div className="studio-boundary-stack">
              <div>
                <span>Game</span>
                <strong>Cover art, game verification, channel modules</strong>
              </div>
              <div>
                <span>Studio</span>
                <strong>Developer proof, logo, approved games</strong>
              </div>
              <div>
                <span>Member</span>
                <strong>Avatar, level, passport, squads, guilds</strong>
              </div>
            </div>
          </article>
        </section>
      
        <StudioLogoUploadCard developer={developer} />
</section>
    </>
  );
}


function readMemberSignalReviews(): Record<string, NamiChannel['signal']> {
  try {
    const savedReviews = window.localStorage.getItem('nami-member-signal-reviews');

    if (!savedReviews) {
      return {};
    }

    const parsedReviews = JSON.parse(savedReviews);

    if (typeof parsedReviews !== 'object' || parsedReviews === null) {
      return {};
    }

    return parsedReviews as Record<string, NamiChannel['signal']>;
  } catch {
    return {};
  }
}

function readMemberSignalReview(
  memberId: string,
  fallbackSignal: NamiChannel['signal']
): NamiChannel['signal'] {
  return readMemberSignalReviews()[memberId] ?? fallbackSignal;
}

function saveMemberSignalReview(memberId: string, signal: NamiChannel['signal']): void {
  const reviews = readMemberSignalReviews();

  window.localStorage.setItem(
    'nami-member-signal-reviews',
    JSON.stringify({
      ...reviews,
      [memberId]: signal
    })
  );
}

type AdultLanguageMode = 'censor' | 'filter' | 'show';

function isAdultLanguageMode(value: unknown): value is AdultLanguageMode {
  return value === 'censor' || value === 'filter' || value === 'show';
}

function readChannelAdultLanguageMode(channelId: string): AdultLanguageMode {
  try {
    const savedMode = window.localStorage.getItem('nami-channel-adult-language-mode-' + channelId);

    if (isAdultLanguageMode(savedMode)) {
      return savedMode;
    }

    return 'censor';
  } catch {
    return 'censor';
  }
}

function saveChannelAdultLanguageMode(channelId: string, mode: AdultLanguageMode): void {
  window.localStorage.setItem('nami-channel-adult-language-mode-' + channelId, mode);
}

function MemberProfileScreen(props: {
  member: (typeof members)[number];
  onNavigate: (page: NamiPage) => void;
  onOpenMember: (member: (typeof members)[number]) => void;
  onOpenProfile: (channel: NamiChannel) => void;
  onOpenThread: (memberId: string) => void;
  onNavigateGuilds: () => void;
  returnPage: NamiPage;
  returnLabel: string;
  tagHandlers?: TagNavigationHandlers;
}): ReactElement {
  const preferenceStorageKey = 'nami-member-preferences-' + props.member.id;
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [reportQueued, setReportQueued] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const reviewedSignal = readMemberSignalReview(props.member.id, props.member.signal);
  const [profileCarouselSlide, setProfileCarouselSlide] = useState<'passport' | 'badges'>('passport');
  const [privateDraft, setPrivateDraft] = useState('');
  const canMessage = canMessageOtherMembers() && props.member.id !== 'm1';
  const canReport = canReportMemberProfile();
  const isStreamingOnline = useMemberStreamingOnline(props.member.id);
  const memberReports = useMemo(() => {
    return readSafetyReports().filter((report) => report.targetId === props.member.id);
  }, [props.member.id, refreshKey]);

  const memberActions = useMemo(() => {
    return readSafetyActions().filter((action) => action.targetId === props.member.id);
  }, [props.member.id, refreshKey]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });

    const savedPreference = readMemberPreference(props.member.id);

    setIsMuted(savedPreference.muted);
    setIsBlocked(savedPreference.blocked);
    setReportQueued(false);
    setProfileCarouselSlide('passport');
    setRefreshKey((value) => value + 1);
  }, [preferenceStorageKey, props.member.id]);

  function savePreference(nextMuted: boolean, nextBlocked: boolean): void {
    setIsMuted(nextMuted);
    setIsBlocked(nextBlocked);
    saveMemberPreference(props.member.id, {
      muted: nextMuted,
      blocked: nextBlocked,
    });
  }

  function reportMember(): void {
    if (!canReportMemberProfile()) {
      return;
    }

    saveSafetyReport({
      source: 'member',
      targetId: props.member.id,
      targetName: props.member.name,
      reason: 'Member profile report',
      channelName: 'Nami Chat'
    });

    setReportQueued(true);
    setRefreshKey((value) => value + 1);
  }
  return (
    <>
      <header className="page-title member-profile-page-title">
        <div className="member-profile-page-title-copy">
          <p>Passport, activity showcase, and member surfaces</p>
          <h1>{props.member.name}</h1>
        </div>
        <SharePassportButton member={props.member} />
      </header>

      {isStreamingOnline ? (
        <div className="member-streaming-live-banner" role="status">
          <MemberStreamingLiveDot className="is-banner-streaming-dot" memberId={props.member.id} />
          <div>
            <strong>{props.member.name} is live</strong>
            <p>Check the member feed below to watch their stream and live updates.</p>
          </div>
        </div>
      ) : null}

      <section className="member-profile-page">
        <div className="member-profile-passport-hero">
          <ProfilePassportCarousel
            activeSlide={profileCarouselSlide}
            badgeBookView={<BadgeCollectorsBook key={props.member.id} member={props.member} />}
            passportView={
              <TcgFoilPassportCard layout="vertical" member={props.member} signal={reviewedSignal} />
            }
            toolbar={
              <div
                className="profile-passport-carousel-actions"
                role="tablist"
                aria-label="Profile card views"
              >
                <button
                  aria-selected={profileCarouselSlide === 'passport'}
                  className={
                    'nami-surface-button profile-passport-view-tab' +
                    (profileCarouselSlide === 'passport' ? ' is-active-view' : '')
                  }
                  onClick={() => setProfileCarouselSlide('passport')}
                  role="tab"
                  type="button"
                >
                  Passport
                </button>
                <button
                  aria-selected={profileCarouselSlide === 'badges'}
                  className={
                    'nami-surface-button profile-passport-view-tab' +
                    (profileCarouselSlide === 'badges' ? ' is-active-view' : '')
                  }
                  onClick={() => setProfileCarouselSlide('badges')}
                  role="tab"
                  type="button"
                >
                  Badge Book
                </button>
              </div>
            }
            sideRail={profileCarouselSlide === 'passport' ? (
              <div className="member-profile-actions tcg-passport-actions">
                <button
                  className={isMuted ? 'preference-button is-muted-active' : 'preference-button'}
                  onClick={() => savePreference(!isMuted, isBlocked)}
                  type="button"
                >
                  {isMuted ? 'Muted' : 'Mute'}
                </button>

                <button
                  className={
                    isBlocked
                      ? 'preference-button is-blocked-active'
                      : 'preference-button danger-preference'
                  }
                  onClick={() => savePreference(isMuted, !isBlocked)}
                  type="button"
                >
                  {isBlocked ? 'Blocked' : 'Block'}
                </button>

                {canReport ? (
                  <button
                    className="preference-button report-preference"
                    onClick={reportMember}
                    type="button"
                  >
                    Report
                  </button>
                ) : null}

                <button
                  className="nami-surface-button"
                  onClick={() => props.onNavigate('safetyCenter')}
                  type="button"
                >
                  Safety Center
                </button>

                <button
                  className="nami-surface-button member-return-button"
                  onClick={() => props.onNavigate(props.returnPage)}
                  type="button"
                >
                  {props.returnLabel}
                </button>

                {canMessage ? (
                  <button
                    className="nami-surface-button is-primary-surface-button"
                    onClick={() => props.onOpenThread(props.member.id)}
                    type="button"
                  >
                    Message
                  </button>
                ) : null}
              </div>
            ) : null}
          />
        </div>

        <MemberProfileShowcase
          isStreamingOnline={isStreamingOnline}
          member={props.member}
          mode="visitor"
          onOpenChannel={props.onOpenProfile}
          onNavigate={props.onNavigate}
          belowShowcase={
            <>
              <MemberProfileActions member={props.member} onNavigateGuilds={props.onNavigateGuilds} />

              {canMessage ? (
                <details className="panel member-profile-collapsible-panel">
                  <summary>
                    <strong>Private Message</strong>
                    <small>Send a direct message</small>
                  </summary>
                  <ChatComposerWithEmojis
                    ariaLabel={'Private message to ' + props.member.name}
                    canSend={canMessage}
                    className="chat-composer-row message-log-composer"
                    onChange={setPrivateDraft}
                    onSend={() => {
                      if (!privateDraft.trim()) {
                        return;
                      }

                      sendPrivateMessage(props.member.id, props.member.name, privateDraft);
                      setPrivateDraft('');
                      props.onOpenThread(props.member.id);
                    }}
                    placeholder={'Write to ' + props.member.name}
                    value={privateDraft}
                  />
                </details>
              ) : null}

              <details className="panel member-profile-collapsible-panel" open={isStreamingOnline}>
                <summary>
                  <strong>Member Feed</strong>
                  <small>Live & social embeds</small>
                </summary>
                <EmbeddedSocialPanel feedOwnerMemberId={props.member.id} surface="member" title="Member Feed" />
              </details>

              {canShowMemberPublicChat(props.member, isStreamingOnline) ? (
                <MemberPublicPinnedChat
                  member={props.member}
                  onOpenMember={props.onOpenMember}
                  {...(props.tagHandlers ? { tagHandlers: props.tagHandlers } : {})}
                />
              ) : null}

              {reportQueued ? <p className="report-pulse">Report added to moderation queue.</p> : null}

              {isSelfMember(props.member.id) ? <MemberAvatarUploadCard /> : null}
            </>
          }
          safetyPanel={
            <details className="panel member-showcase-safety-drawer">
              <summary>
                <span className="mini-badge">Moderation</span>
                <strong>Safety history</strong>
                <small>Reports and actions connected to this member</small>
              </summary>
              <div className="member-history-stack">
                {memberReports.length === 0 && memberActions.length === 0 ? (
                  <span className="empty-safety-note">No safety history for this member.</span>
                ) : null}

                {memberReports.map((report) => (
                  <div className="member-history-card" key={report.id}>
                    <span className="mini-badge">{report.status}</span>
                    <strong>{report.source} report</strong>
                    <p>{report.reason}</p>
                    <small>
                      {report.channelName} · {report.createdAt}
                    </small>
                  </div>
                ))}

                {memberActions.map((action) => (
                  <div className="member-history-card" key={action.id}>
                    <span className="mini-badge">{action.action}</span>
                    <strong>{action.note}</strong>
                    <p>{action.channelName}</p>
                    <small>{action.createdAt}</small>
                  </div>
                ))}
              </div>
            </details>
          }
        />
</section>
    </>
  );
}

function SafetyCenterScreen(props: {
  onNavigate: (page: NamiPage) => void;
}): ReactElement {
  const { owner } = useProtocolOwner();
  const { activePerspective, isActive: isDemoPerspectiveActive } = useDemoPerspective();
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'All' | SafetyReport['status']>('All');
  const [moderationNotes, setModerationNotes] = useState<Record<string, string>>({});
  const [moderationRole, setModerationRole] = useState<
    'Member' | 'Channel Owner' | 'Nami Moderator' | 'Nami Dev'
  >('Channel Owner');
  const feedAbuseReports = useMemberFeedAbuseReports();
  const feedAbuseAlerts = useOfficialFeedAbuseAlerts();
  const reports = useMemo(() => readSafetyReports(), [refreshKey]);
  const actions = useMemo(() => readSafetyActions(), [refreshKey]);

  const mutedMembers = members.filter((member) => readMemberPreference(member.id).muted);
  const blockedMembers = members.filter((member) => readMemberPreference(member.id).blocked);

  const effectiveModerationRole =
    isDemoPerspectiveActive && activePerspective
      ? activePerspective.safetyModerationRole
      : moderationRole;

  const canAccessModeration = canAccessModerationQueues(owner);
  const canManuallyReviewSignals = canAccessModeration;
  const canReviewFeedAbuse = canAccessModeration;

  const pendingFeedAbuseReports = feedAbuseReports.filter(
    (report) => report.status === 'queued' || report.status === 'reviewing'
  );

  const filteredReports = reports.filter((report) => {
    return statusFilter === 'All' || report.status === statusFilter;
  });

  const reportStatusFilters: Array<'All' | SafetyReport['status']> = [
    'All',
    'Queued',
    'Reviewing',
    'Warned',
    'Timed Out',
    'Escalated',
    'Resolved'
  ];

  const moderationRoles = ['Member', 'Channel Owner', 'Nami Moderator', 'Nami Dev'] as const;

  function openMember(member: (typeof members)[number]): void {
    window.localStorage.setItem('nami-selected-member-id', member.id);
    props.onNavigate('memberProfile');
  }

  function noteFor(reportId: string): string {
    return moderationNotes[reportId] ?? '';
  }

  function updateReportStatus(
    report: SafetyReport,
    status: SafetyReport['status'],
    action: SafetyActionRecord['action'],
    fallbackNote: string
  ): void {
    const note = noteFor(report.id).trim() || fallbackNote;
    const nextReports = readSafetyReports().map((currentReport) => {
      if (currentReport.id !== report.id) {
        return currentReport;
      }

      return {
        ...currentReport,
        status
      };
    });

    saveSafetyReports(nextReports);

    saveSafetyAction({
      reportId: report.id,
      targetId: report.targetId,
      targetName: report.targetName,
      action,
      note,
      channelName: report.channelName
    });

    setModerationNotes((currentNotes) => ({
      ...currentNotes,
      [report.id]: ''
    }));

    setRefreshKey((value) => value + 1);
  }

  function reviewMemberSignal(member: (typeof members)[number], signal: NamiChannel['signal']): void {
    if (!canManuallyReviewSignals) {
      return;
    }

    saveMemberSignalReview(member.id, signal);

    saveSafetyAction({
      reportId: 'signal-review-' + member.id,
      targetId: member.id,
      targetName: member.name,
      action: 'Signal Review',
      note: 'Signal manually reviewed as ' + signal + ' by ' + effectiveModerationRole,
      channelName: 'Nami Conduct Review'
    });

    setRefreshKey((value) => value + 1);
  }

  function clearReports(): void {
    clearSafetyReports();
    setRefreshKey((value) => value + 1);
  }

  function clearActions(): void {
    clearSafetyActions();
    setRefreshKey((value) => value + 1);
  }

  return (
    <>
      <header className="page-title">
        <p>Safety preferences and moderation</p>
        <h1>Safety Center</h1>
      </header>

      <section className={canManuallyReviewSignals ? 'safety-center-page has-signal-review-access' : 'safety-center-page'}>
        <article className="panel safety-hero-panel">
          <div>
            <span className="mini-badge">UI-A8B Moderation Layer</span>
            <h2>Conduct-based Color Signals</h2>
            <p>
              Color Signals are primarily determined by conduct and language safety. Manual
              signal changes are restricted to Nami Devs and Nami Moderators.
            </p>
          </div>

          <button
            className="secondary-action"
            onClick={() => props.onNavigate('settings')}
            type="button"
          >
            Back to Settings
          </button>
        </article>

        {canAccessModeration && feedAbuseAlerts.length > 0 ? (
          <article className="panel member-feed-official-alert-panel">
            <div className="profile-panel-heading">
              <div>
                <span className="mini-badge">Immediate Review</span>
                <h2>Member Feed Abuse Alerts</h2>
                <p>
                  Multiple verified members reported embedded feed misconduct in a short window.
                  Review these reports immediately.
                </p>
              </div>
            </div>

            <div className="member-feed-official-alert-stack">
              {feedAbuseAlerts.map((alert) => (
                <div className="member-feed-official-alert-card" key={alert.feedOwnerMemberId}>
                  <strong>{alert.feedOwnerName}</strong>
                  <p>
                    {alert.pendingReportCount} open report
                    {alert.pendingReportCount === 1 ? '' : 's'}
                    {alert.suspended ? ' · feeds suspended' : ''}
                  </p>
                  <small>
                    Officials notified
                    {alert.officialNotifiedAt
                      ? ' · ' + new Date(alert.officialNotifiedAt).toLocaleString()
                      : ''}
                  </small>
                </div>
              ))}
            </div>
          </article>
        ) : null}

        <article className="panel conduct-policy-panel">
          <div className="profile-panel-heading">
            <h2>Conduct Signal Policy</h2>
            <p>
              Nami moderators and the official owner review reports and take enforcement actions.
              Manual Color Signal changes stay restricted to Nami moderation staff. Adult language
              and conduct violations are filtered from chat and routed toward safety review.
            </p>
          </div>

          <div className="conduct-policy-grid">
            <span>Auto conduct filter</span>
            <strong>Adult language removed from chat surfaces</strong>

            <span>Signal authority</span>
            <strong>Nami Devs / Nami Moderators only</strong>

            <span>Moderator role</span>
            <strong>Review, warn, timeout, escalate</strong>

            <span>User controls</span>
            <strong>Mute, block, report</strong>
          </div>
        </article>

        <article className="panel moderation-role-panel">
          <div className="profile-panel-heading">
            <h2>Preview Access Role</h2>
            <p>
              {isDemoPerspectiveActive
                ? 'Role is controlled by the active dashboard perspective in Settings.'
                : 'Switch roles to preview who can manually review Color Signals.'}
            </p>
          </div>

          <div className="moderation-role-row">
            {moderationRoles.map((role) => (
              <button
                className={role === effectiveModerationRole ? 'is-selected-role' : ''}
                disabled={isDemoPerspectiveActive}
                key={role}
                onClick={() => setModerationRole(role)}
                type="button"
              >
                {role}
              </button>
            ))}
          </div>

          <p className={canManuallyReviewSignals ? 'signal-access-note is-unlocked' : 'signal-access-note'}>
            {canManuallyReviewSignals
              ? 'Manual Color Signal review is unlocked for this role.'
              : 'Nami Moderator Signal Review is hidden for this role.'}
          </p>
        </article>

        <section className="safety-grid">
          <article className="panel safety-list-panel">
            <div className="profile-panel-heading">
              <h2>Muted Members</h2>
              <p>Muted members stay visible, but appear quieter in Game Chat.</p>
            </div>

            <div className="safety-member-list">
              {mutedMembers.length === 0 && <span className="empty-safety-note">No muted members yet.</span>}

              {mutedMembers.map((member) => (
                <button
                  className="safety-member-row"
                  key={member.id}
                  onClick={() => openMember(member)}
                  type="button"
                >
                  <UniformMemberAvatar
                    member={member}
                    signal={readMemberSignalReview(member.id, member.signal)}
                  />
                  <div>
                    <strong>{member.name}</strong>
                    <span className="safety-member-meta">
                      {member.tier}
                      <ConductSignalDot
                        signal={readMemberSignalReview(member.id, member.signal)}
                        size="sm"
                      />
                    </span>
                  </div>
                  <i>Muted</i>
                </button>
              ))}
            </div>
          </article>

          <article className="panel safety-list-panel">
            <div className="profile-panel-heading">
              <h2>Blocked Members</h2>
              <p>Blocked members are hidden from Game Chat surfaces.</p>
            </div>

            <div className="safety-member-list">
              {blockedMembers.length === 0 && <span className="empty-safety-note">No blocked members yet.</span>}

              {blockedMembers.map((member) => (
                <button
                  className="safety-member-row is-blocked-safety-row"
                  key={member.id}
                  onClick={() => openMember(member)}
                  type="button"
                >
                  <UniformMemberAvatar
                    member={member}
                    signal={readMemberSignalReview(member.id, member.signal)}
                  />
                  <div>
                    <strong>{member.name}</strong>
                    <span className="safety-member-meta">
                      {member.tier}
                      <ConductSignalDot
                        signal={readMemberSignalReview(member.id, member.signal)}
                        size="sm"
                      />
                    </span>
                  </div>
                  <i>Blocked</i>
                </button>
              ))}
            </div>
          </article>
        </section>

        {canAccessModeration ? (
        <section className="moderation-queue-grid">
          <article className="panel moderation-queue-panel">
            <div className="profile-panel-heading">
              <h2>Report Queue</h2>
              <p>Nami moderators and the official owner review reports. Signal changes remain Nami-controlled.</p>
            </div>

            <div className="moderation-status-filter-row">
              {reportStatusFilters.map((filter) => (
                <button
                  className={filter === statusFilter ? 'is-active-filter' : ''}
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  type="button"
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="moderation-report-stack">
              {filteredReports.length === 0 && <span className="empty-safety-note">No reports match this filter.</span>}

              {filteredReports.map((report) => {
                const reportActions = actions.filter((action) => action.reportId === report.id);

                return (
                  <div className="moderation-report-card is-expanded-report-card" key={report.id}>
                    <div>
                      <span className="mini-badge">{report.status}</span>
                      <strong>{report.targetName}</strong>
                      <p>{report.reason}</p>
                      <small>{report.channelName} · {report.createdAt}</small>

                      <textarea
                        onChange={(event) => {
                          setModerationNotes((currentNotes) => ({
                            ...currentNotes,
                            [report.id]: event.target.value
                          }));
                        }}
                        placeholder="Add moderator note..."
                        value={noteFor(report.id)}
                      />

                      <div className="report-action-history">
                        {reportActions.length === 0 && <span>No action history yet.</span>}

                        {reportActions.map((action) => (
                          <small key={action.id}>
                            {action.action}: {action.note} · {action.createdAt}
                          </small>
                        ))}
                      </div>
                    </div>

                    <div className="moderation-action-row">
                      <button
                        onClick={() => updateReportStatus(report, 'Reviewing', 'Review', 'Report moved to review.')}
                        type="button"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => updateReportStatus(report, 'Warned', 'Warn', 'Warning issued.')}
                        type="button"
                      >
                        Warn
                      </button>
                      <button
                        onClick={() => updateReportStatus(report, 'Timed Out', 'Timeout', 'Temporary timeout applied.')}
                        type="button"
                      >
                        Timeout
                      </button>
                      <button
                        onClick={() => updateReportStatus(report, 'Escalated', 'Escalate', 'Report escalated to Nami review.')}
                        type="button"
                      >
                        Escalate
                      </button>
                      <button
                        onClick={() => updateReportStatus(report, 'Resolved', 'Resolve', 'Report resolved.')}
                        type="button"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {reports.length > 0 && (
              <button className="profile-secondary-link" onClick={clearReports} type="button">
                Clear report queue
              </button>
            )}
          </article>

          <article className="panel moderation-queue-panel member-feed-abuse-queue-panel">
            <div className="profile-panel-heading">
              <h2>Member Feed Abuse Queue</h2>
              <p>
                Verified members can report misconduct in embedded member feeds. Multiple reports in
                a short period notify Nami officials; unresolved reports suspend feeds.
              </p>
            </div>

            <div className="moderation-report-stack">
              {pendingFeedAbuseReports.length === 0 && (
                <span className="empty-safety-note">No open member feed abuse reports.</span>
              )}

              {pendingFeedAbuseReports.map((report) => (
                <div className="moderation-report-card is-expanded-report-card" key={report.id}>
                  <div>
                    <span className="mini-badge">{report.status}</span>
                    <strong>{report.feedOwnerName}</strong>
                    <p>{memberFeedAbuseReportLabel(report.reportType)}</p>
                    <small>
                      Reported by {report.reporterName} · {new Date(report.createdAt).toLocaleString()}
                    </small>
                  </div>

                  <div className="moderation-action-row">
                    <button
                      onClick={() => {
                        reviewMemberFeedAbuseReports(report.feedOwnerMemberId);
                        setRefreshKey((value) => value + 1);
                      }}
                      type="button"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => {
                        resolveMemberFeedAbuseForOwner(report.feedOwnerMemberId);
                        setRefreshKey((value) => value + 1);
                      }}
                      type="button"
                    >
                      Resolve & restore feeds
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {canManuallyReviewSignals && (
            <article className="panel moderation-queue-panel">
            <div className="profile-panel-heading">
              <h2>Nami Moderator Signal Review</h2>
              <p>Manual Color Signal changes are locked unless the active role is Nami Moderator or Nami Dev.</p>
            </div>

            <div className="signal-review-stack">
              {members
                .filter((member) => member.signal !== 'Black')
                .map((member) => {
                  const reviewedSignal = readMemberSignalReview(member.id, member.signal);

                  return (
                    <div className="signal-review-card" key={member.id}>
                      <button
                        className="signal-review-member-button"
                        onClick={() => openMember(member)}
                        type="button"
                      >
                        <UniformMemberAvatar member={member} signal={reviewedSignal} />
                        <div>
                          <strong>{member.name}</strong>
                          <span className="safety-member-meta">
                            {member.tier}
                            <ConductSignalDot signal={reviewedSignal} size="sm" />
                          </span>
                        </div>
                      </button>

                      <div className="signal-review-action-row">
                        {(['Green', 'Orange', 'Red'] as Array<NamiChannel['signal']>).map((signal) => (
                          <button
                            aria-label={'Set signal to ' + signal}
                            className={
                              signal === reviewedSignal
                                ? 'is-selected-signal-review'
                                : canManuallyReviewSignals
                                  ? ''
                                  : 'is-locked-signal-review'
                            }
                            disabled={!canManuallyReviewSignals}
                            key={signal}
                            onClick={() => reviewMemberSignal(member, signal)}
                            type="button"
                          >
                            <ConductSignalDot signal={signal} />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="owner-tool-mode-strip">


              <span>Viewing as Channel Owner</span>


              <small>Operational controls only. Nami-controlled proofs still decide trust and verification.</small>


            </div>



            <div className="owner-tool-grid" aria-label="Channel owner operational tools">
              <button className="owner-tool-action is-owner-tool-ready" type="button">
                <span>Lock Thread</span>
                <small>Ready</small>
              </button>

              <button className="owner-tool-action is-owner-tool-preview" type="button">
                <span>Open Audit Log</span>
                <small>Preview</small>
              </button>

              <button className="owner-tool-action is-owner-tool-proof-gated" type="button">
                <span>Review Guild</span>
                <small>Proof-gated</small>
              </button>

              <button className="owner-tool-action is-owner-tool-nami-queue" type="button">
                <span>Escalate to Nami</span>
                <small>Nami queue</small>
              </button>
            </div>
          </article>
          )}
        </section>
        ) : null}

        {canAccessModeration ? (
        <article className="panel moderation-queue-panel">
          <div className="profile-panel-heading">
            <h2>Action History</h2>
            <p>Moderator actions are kept separate from payment, verification, and subscriptions.</p>
          </div>

          <div className="moderation-report-stack">
            {actions.length === 0 && <span className="empty-safety-note">No moderation actions yet.</span>}

            {actions.map((action) => (
              <div className="moderation-report-card" key={action.id}>
                <div>
                  <span className="mini-badge">{action.action}</span>
                  <strong>{action.targetName}</strong>
                  <p>{action.note}</p>
                  <small>{action.channelName} · {action.createdAt}</small>
                </div>
              </div>
            ))}
          </div>

          {actions.length > 0 && (
            <button className="profile-secondary-link" onClick={clearActions} type="button">
              Clear action history
            </button>
          )}
        </article>
        ) : null}

        {canAccessModeration ? <ProtocolModerationPanel /> : null}
        {canAccessModeration ? <ProtocolModerationRecordsPanel /> : null}
      </section>
    </>
  );
}

function Subscriptions(props: {
  selectedChannel: NamiChannel;
  onSelect: (channel: NamiChannel) => void;
  onOpenProfile: (channel: NamiChannel) => void;
}): ReactElement {
  const subscribedChannels = useSubscribedChannels();
  const selfMember = getSelfMember();
  const membershipState = useMembershipPlanState();
  const activeMembershipPlan = membershipPlanForTier(membershipState.activeTier);
  const slotLimit = subscriptionSlotLimit(selfMember.tier);
  const recommendedChannels = channels.filter((channel) => !isChannelSubscribed(channel.id));

  return (
    <>
      <header className="page-title">
        <p>Account subscriptions</p>
        <h1>My Subscriptions</h1>
      </header>

      <section className="subscriptions-page">
        <article className="panel subscription-hero-panel">
          <div>
            <span className="mini-badge">Subscription Manager</span>
            <h2>Manage your channel access</h2>
            <p>
              Subscriptions add convenience, personalization, and expanded platform features.
              They do not replace trust, verification, or reputation.
            </p>
          </div>

          <div className="subscription-cap-card">
            <span>Current Plan</span>
            <strong>{activeMembershipPlan.label}</strong>
            <p>
              {subscribedChannels.length}/{slotLimit} followed channels · {selfMember.tier} tier
            </p>
          </div>
        </article>

        <MembershipPlansPanel />

        <section className="subscription-layout">
          <article className="panel">
            <div className="profile-panel-heading">
              <h2>Subscribed Channels</h2>
              <p>Your active game and community subscriptions.</p>
            </div>

            <div className="subscription-channel-stack">
              {subscribedChannels.map((channel) => (
                <button
                  className={
                    channel.id === props.selectedChannel.id
                      ? 'subscription-channel-card is-selected-subscription'
                      : 'subscription-channel-card'
                  }
                  key={channel.id}
                  onClick={() => {
                    props.onSelect(channel);
                    props.onOpenProfile(channel);
                  }}
                  type="button"
                >
                  <ChannelAvatar channel={channel} size="sm" />
                  <div>
                    <strong>{channel.name}</strong>
                    <span>{channel.genre} · {channel.platforms.join(' / ')}</span>
                  </div>
                </button>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="profile-panel-heading">
              <h2>Recommended Channels</h2>
              <p>Discover channels that match your current interests.</p>
            </div>

            <div className="subscription-recommendation-grid">
              {recommendedChannels.map((channel) => (
                <button
                  className="subscription-recommendation-card"
                  key={channel.id}
                  onClick={() => {
                    props.onSelect(channel);
                    props.onOpenProfile(channel);
                  }}
                  type="button"
                >
                  <ChannelAvatar channel={channel} size="sm" />
                  <strong>{channel.name}</strong>
                  <span>{channel.tagline}</span>
                  <i>{channel.subscribers.toLocaleString()} members</i>
                </button>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="profile-panel-heading">
              <h2>Subscription Features</h2>
              <p>Paid tiers expand features without buying trust status.</p>
            </div>

            <div className="subscription-feature-list">
              <span>More followed channels</span>
              <span>Profile cosmetics</span>
              <span>Banner slots</span>
              <span>Layout presets</span>
              <span>Advanced filters</span>
              <span>Premium reactions</span>
            </div>
          </article>
        </section>
      </section>
    </>
  );
}

function readWalletPublicDisplay(): boolean {
  try {
    return window.localStorage.getItem('nami-wallet-public-display') === 'true';
  } catch {
    return false;
  }
}

function saveWalletPublicDisplay(isPublic: boolean): void {
  window.localStorage.setItem('nami-wallet-public-display', isPublic ? 'true' : 'false');
}

function readSuiNsPublicDisplay(): boolean {
  try {
    return window.localStorage.getItem('nami-suins-public-display') === 'true';
  } catch {
    return false;
  }
}

function saveSuiNsPublicDisplay(isPublic: boolean): void {
  window.localStorage.setItem('nami-suins-public-display', isPublic ? 'true' : 'false');
}

function PassportScreen(props: {
  onNavigate: (page: NamiPage) => void;
  onOpenProfile: (channel: NamiChannel) => void;
}): ReactElement {
  const profileMember = useSelfMember();
  const memberSession = useMemberSession();
  const passportProgression = getNamiProgression(profileMember);
  const [suiNsPublic, setSuiNsPublic] = useState(() => readSuiNsPublicDisplay());
  const { owner: protocolOwner } = useProtocolOwner();
  const { data: passportView, loadState: passportLoadState } = usePassportQuery();
  const { data: ownerHistory } = useOwnerHistoryQuery();

  const passportProofs = [
    {
      title: 'Account Linked',
      status: 'Verified',
      detail: 'Your account remains a private identity anchor by default.',
      category: 'Identity'
    },
    {
      title: 'Nodename',
      status: 'Verified',
      detail: 'npcgamer is connected, but hidden publicly until enabled.',
      category: 'Name Proof'
    },
    {
      title: 'Developer Approval',
      status: 'Not Requested',
      detail: 'Developer trust is approval-based and never purchased by subscription.',
      category: 'Developer Trust'
    },
    {
      title: 'Game Ownership',
      status: 'Pending',
      detail: 'Future license proof for gated rooms and events.',
      category: 'Access'
    },
    {
      title: 'Guild Standing',
      status: 'Verified',
      detail: 'Guild participation and channel conduct are in good standing.',
      category: 'Social'
    },
    {
      title: 'Moderation Standing',
      status: 'Clear',
      detail: 'No unresolved enforcement actions on this passport.',
      category: 'Safety'
    }
  ];

  return (
    <>
      <header className="page-title passport-page-title">
        <div className="passport-page-title-copy">
          <p>Member identity, proofs, and access</p>
          <h1>Nami Passport</h1>
        </div>
        {isSelfMember(profileMember.id) ? (
          <div className="passport-page-title-actions">
            <SharePassportButton member={profileMember} />
            <button
              className="nami-surface-button is-primary-surface-button passport-edit-profile-button"
              onClick={() => {
                requestProfileEditFocus();
                props.onNavigate('userProfile');
              }}
              type="button"
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <SharePassportButton member={profileMember} />
        )}
      </header>

      <div className="passport-screen-layout">
      {passportView?.passport ? (
        <article className="panel protocol-passport-card">
          <div className="profile-panel-heading">
            <h2>Live Passport</h2>
            <p>
              Live object read via SDK · Level {passportView.passport.level} ·{' '}
              {passportView.passport.membershipTierLabel} ·{' '}
              {passportView.passport.reputationLabel}
            </p>
          </div>

          <div className="passport-wallet-grid passport-wallet-grid-refined">
            <span>Passport ID</span>
            <strong>{passportView.passport.objectId}</strong>
            <span>XP</span>
            <strong>{passportView.passport.xp}</strong>
            <span>Badge Points</span>
            <strong>{passportView.passport.badgePoints}</strong>
            <span>Indexed Timeline</span>
            <strong>{passportView.timelineEntryCount} event(s)</strong>
            <span>Badge Events</span>
            <strong>{ownerHistory?.badgeHistory.length ?? 0}</strong>
            <span>Boost Events</span>
            <strong>{ownerHistory?.boostHistory.length ?? 0}</strong>
          </div>
        </article>
      ) : passportLoadState === 'loading' ? (
        <p className="protocol-hint">Loading on-chain passport and indexed timeline…</p>
      ) : passportLoadState === 'error' ? (
        <p className="protocol-hint">Could not load passport data from chain. Showing your profile preview below.</p>
      ) : protocolOwner ? (
        <p className="protocol-hint">No owned Passport object found for the connected wallet.</p>
      ) : null}

      <section className="passport-page">
        <PlayerScorePanel issuedScore={memberSession?.issuedPlayerScore ?? null} showSuggestions />

        <article className="panel passport-hero-card passport-hero-card-refined">
          <div className="passport-owner-block">
            <UniformMemberAvatar className="member-profile-avatar" member={profileMember}>
              <span className="profile-level-badge">Lv {passportProgression.level}</span>
            </UniformMemberAvatar>

            <div className="passport-owner-copy">
              <span className="mini-badge">Sui Identity Layer</span>
              <h2>{profileMember.name} Passport</h2>
              <p>
                Nami Passport connects SuiNS identity, wallet ownership, developer approvals,
                guild standing, conduct reputation, and access-gated community surfaces.
              </p>

              <div className="passport-wallet-grid passport-wallet-grid-refined">
                <span>Owner Wallet</span>
                <strong>Private identity anchor</strong>
                <span>SuiNS</span>
                <strong>{suiNsPublic ? 'npcgamer.sui visible publicly' : 'Hidden publicly'}</strong>
                <span>Signal</span>
                <strong className="passport-signal-value">
                  <ConductSignalDot signal={profileMember.signal} />
                </strong>
                <span>Trust Source</span>
                <strong>Proofs + conduct, not payment</strong>
              </div>
            </div>
          </div>

          {isSelfMember(profileMember.id) ? (
            <aside className="passport-privacy-card">
              <span className="mini-badge">Privacy</span>
              <h3>SuiNS Visibility</h3>
              <p>
                SuiNS is a readable wallet identity. It stays hidden publicly unless you
                choose to display it.
              </p>

              <button
                className={suiNsPublic ? 'is-wallet-public' : ''}
                onClick={() => {
                  const nextValue = !suiNsPublic;
                  setSuiNsPublic(nextValue);
                  saveSuiNsPublicDisplay(nextValue);
                }}
                type="button"
              >
                {suiNsPublic ? 'Hide SuiNS Publicly' : 'Display SuiNS Publicly'}
              </button>

              <button onClick={() => props.onNavigate('userProfile')} type="button">
                Back to My Profile
              </button>
            </aside>
          ) : null}
        </article>

        <MembershipAccessCard />

        <section className="passport-grid">
            <article className="panel passport-affiliation-panel">
              <div className="profile-panel-heading">
                <h2>Guilds & Squads</h2>
                <p>Passport social standing across guilds, squads, and seasonal reputation.</p>
              </div>

              <div className="nami-affiliation-grid">
                <div>
                  <span>Guilds</span>
                  {passportProgression.guilds.map((guild) => (
                    <strong key={guild}>{guild}</strong>
                  ))}
                </div>

                <div>
                  <span>Squads</span>
                  {passportProgression.squads.map((squad) => (
                    <strong key={squad}>{squad}</strong>
                  ))}
                </div>

                <div>
                  <span>Season XP</span>
                  <strong>{passportProgression.seasonXp.toLocaleString()}</strong>
                  <small>Level {passportProgression.level} reputation marker</small>
                </div>
              </div>
            </article>
          <article className="panel passport-proof-panel">
            <div className="profile-panel-heading">
              <h2>Verification Proofs</h2>
              <p>Trust and verification are based on proofs, reputation, and approval.</p>
            </div>

            <div className="passport-proof-grid">
              {passportProofs.map((proof) => (
                <div className="passport-proof-card" key={proof.title}>
                  <span className="mini-badge">{proof.category}</span>
                  <strong>{proof.title}</strong>
                  <i>{proof.status}</i>
                  <p>{proof.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel passport-access-panel">
            <div className="profile-panel-heading">
              <h2>Access-Gated Surfaces</h2>
              <p>Future channel rooms unlocked by wallet and proof checks.</p>
            </div>

            <div className="passport-access-stack">
              {channels.slice(0, 3).map((channel, index) => (
                <div className="passport-access-card" key={channel.id}>
                  <div className="passport-access-title-row">
                    <ChannelAvatar channel={channel} size="sm" />
                    <div>
                      <strong>
                        {index === 0
                          ? 'Verified Holder Chat'
                          : index === 1
                            ? 'Developer Alpha Room'
                            : 'Guild Strategy Room'}
                      </strong>
                      <span>{channel.name}</span>
                    </div>
                  </div>

                  <p>
                    {index === 0
                      ? 'Requires wallet plus SuiNS proof.'
                      : index === 1
                        ? 'Requires developer approval badge.'
                        : 'Requires guild standing plus channel subscription.'}
                  </p>

                  <button
                    className={index === 0 ? 'is-unlocked-gate' : ''}
                    onClick={() => props.onOpenProfile(channel)}
                    type="button"
                  >
                    {index === 0 ? 'Unlocked' : index === 1 ? 'Locked' : 'Pending'}
                  </button>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>

      <PassportTimelinePanel timeline={passportView?.timeline ?? null} />
      </div>

      <ProtocolStatusBar />
    </>
  );
}






type ProfileCardLayout = 'vertical' | 'horizontal';

function readProfileCardLayout(): ProfileCardLayout {
  try {
    const savedLayout = window.localStorage.getItem('nami-profile-card-layout');

    return savedLayout === 'horizontal' ? 'horizontal' : 'vertical';
  } catch {
    return 'vertical';
  }
}

function saveProfileCardLayout(layout: ProfileCardLayout): void {
  window.localStorage.setItem('nami-profile-card-layout', layout);
}

function readChannelBrandPalette(): string[] {
  try {
    const savedPalette = window.localStorage.getItem('nami-channel-brand-palette');

    if (!savedPalette) {
      return ['#4da3ff', '#e11d48', '#34d399', '#f97316'];
    }

    const parsedPalette = JSON.parse(savedPalette);

    if (!Array.isArray(parsedPalette)) {
      return ['#4da3ff', '#e11d48', '#34d399', '#f97316'];
    }

    return parsedPalette
      .filter((color): color is string => typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color))
      .slice(0, 4);
  } catch {
    return ['#4da3ff', '#e11d48', '#34d399', '#f97316'];
  }
}

function saveChannelBrandPalette(palette: string[]): void {
  window.localStorage.setItem('nami-channel-brand-palette', JSON.stringify(palette.slice(0, 4)));
}

function readSelectedChannelBrandColor(): string {
  try {
    return window.localStorage.getItem('nami-selected-channel-brand-color') ?? '#4da3ff';
  } catch {
    return '#4da3ff';
  }
}

function saveSelectedChannelBrandColor(color: string): void {
  window.localStorage.setItem('nami-selected-channel-brand-color', color);
}

function UserProfileScreen(props: {
  onOpenGuild?: (guild: NamiGuildRecord) => void;
  onOpenMember?: (member: (typeof members)[number]) => void;
  onOpenProfile?: (channel: NamiChannel) => void;
  onNavigate?: (page: NamiPage) => void;
  tagHandlers?: TagNavigationHandlers;
} = {}): ReactElement {
  const profileMember = useSelfMember();
  const selfStreamingOnline = useMemberStreamingOnline(profileMember.id);
  const profileEdits = useSelfProfileEdits();
  const [profileCarouselSlide, setProfileCarouselSlide] = useState<'passport' | 'badges'>('passport');
  const [viewAsGuest, setViewAsGuest] = useState(false);
  const [profileCardLayout, setProfileCardLayout] = useState<ProfileCardLayout>(() => {
    return readProfileCardLayout();
  });
  const memberFeedEnabled = readEmbeddedFeedEnabled('member', profileMember.id);

  const mySubscriptions = useSubscribedChannels();
  const { owner: protocolOwner, context } = useProtocolOwner();
  const { data: guildCards, loadState: guildLoadState } = useGuildCardsQuery();
  const guildLiveQueryEnabled = context.indexer !== null && protocolOwner !== null;
  const profileGuildAffiliations = useMemo(
    () =>
      resolveMemberGuildAffiliations({
        liveCards: guildCards ?? [],
        loadState: guildLoadState,
        liveQueryEnabled: guildLiveQueryEnabled,
        memberId: profileMember.id,
        createdGuilds: [],
        fixtureGuilds: namiGuilds,
      }),
    [guildCards, guildLoadState, guildLiveQueryEnabled, profileMember.id]
  );



  function chooseProfileCardLayout(layout: ProfileCardLayout): void {
    setProfileCardLayout(layout);
    saveProfileCardLayout(layout);
  }

  return (
    <>
      <header className="page-title user-profile-page-title">
        <div className="user-profile-page-title-copy">
          <p>Passport, activity showcase, and profile surfaces</p>
          <h1>
            My Profile
            {isNamiTeamMember(profileMember) ? (
              <span className="nami-team-badge is-nami-rainbow-foil-border">Official Nami Team</span>
            ) : null}
          </h1>
        </div>
        {!viewAsGuest ? <SharePassportButton member={profileMember} /> : null}
      </header>

      <section className="user-profile-passport-hero is-tight-passport-hero">
        <div className="nami-profile-view-toolbar nami-profile-view-toolbar-stable">
          <div className="nami-profile-toolbar-slot nami-profile-toolbar-slot-layout">
            <div className="nami-profile-layout-switch nami-profile-stable-layout-switch">
              {(['vertical', 'horizontal'] as ProfileCardLayout[]).map((layout) => (
                <button
                  className={profileCardLayout === layout ? 'is-selected-profile-layout' : ''}
                  key={layout}
                  onClick={() => chooseProfileCardLayout(layout)}
                  type="button"
                >
                  {layout === 'vertical' ? 'Vertical' : 'Horizontal'}
                </button>
              ))}
            </div>
          </div>

          <div className="nami-profile-toolbar-slot nami-profile-toolbar-slot-tabs">
            <div
              className="profile-passport-carousel-actions"
              role="tablist"
              aria-label="Profile card views"
            >
              <button
                aria-selected={profileCarouselSlide === 'passport'}
                className={
                  'nami-surface-button profile-passport-view-tab' +
                  (profileCarouselSlide === 'passport' ? ' is-active-view' : '')
                }
                onClick={() => setProfileCarouselSlide('passport')}
                role="tab"
                type="button"
              >
                Passport
              </button>
              <button
                aria-selected={profileCarouselSlide === 'badges'}
                className={
                  'nami-surface-button profile-passport-view-tab' +
                  (profileCarouselSlide === 'badges' ? ' is-active-view' : '')
                }
                onClick={() => setProfileCarouselSlide('badges')}
                role="tab"
                type="button"
              >
                Badge Book
              </button>
            </div>
          </div>

          <div className="nami-profile-toolbar-slot nami-profile-toolbar-slot-extra">
            <button
              aria-pressed={viewAsGuest}
              className={
                'nami-surface-button profile-guest-preview-toggle' + (viewAsGuest ? ' is-active-view' : '')
              }
              onClick={() => setViewAsGuest((value) => !value)}
              type="button"
            >
              {viewAsGuest ? 'Exit Guest View' : 'Preview as Guest'}
            </button>
          </div>
        </div>

        {viewAsGuest ? (
          <p className="profile-guest-preview-note">
            Guest preview — embedded feeds and public profile surfaces only.
          </p>
        ) : null}

        {profileEdits.bio.trim() ? (
          <p className="user-profile-bio-preview">{profileEdits.bio}</p>
        ) : null}

        {viewAsGuest || !canEditProfileCosmetics(profileMember)
          ? null
          : (() => {
              const equippedIdentity = [
                profileEdits.titleDisplay.trim(),
                profileEdits.badgeDisplay.trim(),
                profileEdits.frameDisplay.trim(),
                profileEdits.themeDisplay.trim(),
                profileEdits.ringDisplay.trim(),
              ].filter((entry) => entry.length > 0);

              if (equippedIdentity.length === 0) {
                return null;
              }

              return (
                <div className="user-profile-equipped-identity">
                  {equippedIdentity.map((entry) => (
                    <span key={entry}>{entry}</span>
                  ))}
                </div>
              );
            })()}

        <ProfilePassportCarousel
          activeSlide={profileCarouselSlide}
          badgeBookView={<BadgeCollectorsBook key={profileMember.id} member={profileMember} />}
          passportLayout={profileCardLayout}
          passportView={
            <TcgFoilPassportCard
              layout={profileCardLayout}
              member={profileMember}
              onOpenPassport={() => props.onNavigate?.('passport')}
            />
          }
        />
      </section>

      <section className="user-profile-page">
        {viewAsGuest ? (
          memberFeedEnabled ? (
            <EmbeddedSocialPanel
              feedOwnerMemberId={profileMember.id}
              showFeedToggle={false}
              surface="member"
              title="Member Feed"
              viewerAccess="guest"
            />
          ) : (
            <article className="panel profile-guest-preview-empty">
              <div className="profile-panel-heading">
                <h2>Embedded Panels</h2>
                <p>
                  Turn on Member feeds to preview how guests see your live and social embeds.
                </p>
              </div>
              <button
                className="profile-secondary-link"
                onClick={() => {
                  saveEmbeddedFeedEnabled('member', true, profileMember.id);
                }}
                type="button"
              >
                Turn feeds on
              </button>
            </article>
          )
        ) : (
          <MemberProfileShowcase
            guildAffiliations={profileGuildAffiliations}
            isStreamingOnline={selfStreamingOnline}
            member={profileMember}
            mode="self"
            subscriptions={mySubscriptions}
            onOpenStatusSettings={() => {
              requestSettingsSection('account');
              props.onNavigate?.('settings');
            }}
            {...(props.onNavigate ? { onNavigate: props.onNavigate } : {})}
            {...(props.onOpenProfile ? { onOpenChannel: props.onOpenProfile } : {})}
            {...(props.onOpenGuild ? { onOpenGuild: props.onOpenGuild } : {})}
            belowShowcase={
              <>
                <details className="panel member-profile-collapsible-panel" open={selfStreamingOnline}>
                  <summary>
                    <strong>Member Feed</strong>
                    <small>Live & social embeds</small>
                  </summary>
                  <EmbeddedSocialPanel
                    feedOwnerMemberId={profileMember.id}
                    onOpenFeedSettings={() => {
                      requestSettingsSection('feeds');
                      props.onNavigate?.('settings');
                    }}
                    showFeedSettings
                    surface="member"
                    title="Member Feed"
                  />
                </details>
                <details className="panel member-profile-collapsible-panel">
                  <summary>
                    <strong>Membership & Profile</strong>
                    <small>Plans and identity edits</small>
                  </summary>
                  <MembershipAccessCard />
                  <ProfileEditPanel />
                </details>
              </>
            }
          />
        )}
      </section>

      {!viewAsGuest && canShowMemberPublicChat(profileMember, selfStreamingOnline) ? (
        <MemberPublicPinnedChat
          member={profileMember}
          onOpenMember={(member) => props.onOpenMember?.(member)}
          {...(props.tagHandlers ? { tagHandlers: props.tagHandlers } : {})}
        />
      ) : null}

      <ProtocolStatusBar />
    </>
  );
}

function GuildsScreen(props: {
  onNavigate?: (page: NamiPage) => void;
  onOpenGuild: (guild: NamiGuildRecord) => void;
  onOpenSquad: (squad: NamiSquadRecord, showInvitePanel?: boolean) => void;
  onOpenMessage?: (memberId: string) => void;
}): ReactElement {
  const { owner: protocolOwner, context } = useProtocolOwner();
  const { data: guildCards, loadState: guildLoadState } = useGuildCardsQuery();
  const { data: squadCards, loadState: squadLoadState } = useSquadCardsQuery();
  const guildLiveQueryEnabled = context.indexer !== null && protocolOwner !== null;
  const squadLiveQueryEnabled = context.chain !== null && protocolOwner !== null;

  return (
    <>
      <ProtocolStatusBar />

      <MyGuildHomeScreen
        guildLiveQueryEnabled={guildLiveQueryEnabled}
        guildLoadState={guildLoadState}
        guildRows={guildCards ?? []}
        onOpenGuild={props.onOpenGuild}
        {...(props.onOpenMessage ? { onOpenMessage: props.onOpenMessage } : {})}
        onOpenSquad={props.onOpenSquad}
        protocolOwner={protocolOwner}
        squadLiveQueryEnabled={squadLiveQueryEnabled}
        squadLoadState={squadLoadState}
        squadRows={squadCards ?? []}
      />

      <EmbeddedSocialPanel surface="guild" title="Guild Feed" />
    </>
  );
}

function MessagesScreen(props: {
  onOpenThread: (memberId: string) => void;
}): ReactElement {
  const messageStore = useMessagesStore();
  const selfMember = useSelfMember();
  const pendingApprovals = pendingApprovalsForMember(selfMember.id);

  return (
    <>
      <header className="page-title">
        <p>Member conversations</p>
        <h1>Messages</h1>
      </header>

      {pendingApprovals.length > 0 ? (
        <section className="messages-thread-list">
          <article className="panel">
            <div className="profile-panel-heading">
              <h2>Pending Approvals</h2>
              <p>Open the sender&apos;s message thread to approve squad or guild requests.</p>
            </div>
            {pendingApprovals.map((request) => (
              <button
                className="messages-thread-row"
                key={request.id}
                onClick={() => props.onOpenThread(request.messageThreadMemberId)}
                type="button"
              >
                <div className="messages-thread-copy">
                  <strong>{request.title}</strong>
                  <p>{request.body}</p>
                  <small>From {request.senderName}</small>
                </div>
                <span className="messages-unread-pill">Approve</span>
              </button>
            ))}
          </article>
        </section>
      ) : null}

      <section className="messages-thread-list">
        {messageStore.threads.map((thread) => {
          const member = members.find((entry) => entry.id === thread.memberId);

          if (!member) {
            return null;
          }

          return (
            <button
              className="messages-thread-row panel"
              key={thread.memberId}
              onClick={() => props.onOpenThread(thread.memberId)}
              type="button"
            >
              <UniformMemberAvatar className="messages-thread-avatar" member={member} />
              <div className="messages-thread-copy">
                <strong>{thread.memberName}</strong>
                <p>{thread.preview}</p>
                <small>{thread.updatedAt}</small>
              </div>
              {thread.unread > 0 ? <span className="messages-unread-pill">{thread.unread}</span> : null}
            </button>
          );
        })}
      </section>
    </>
  );
}

function MessageLogScreen(props: {
  member: (typeof members)[number];
  onNavigate: (page: NamiPage) => void;
  onOpenMember: (member: (typeof members)[number]) => void;
  tagHandlers: TagNavigationHandlers;
}): ReactElement {
  const { paused, resumeCount, viewportRef, messageStackRef } = useChatViewportPause();
  const storeSignal = usePausedMessagesStoreSignal(paused);
  const computeThreadMessages = useCallback(() => {
    const activeThread = readMessageThreads().find((thread) => thread.memberId === props.member.id);

    return activeThread?.messages ?? threadMessagesFor(props.member.id, props.member.name);
  }, [props.member.id, props.member.name]);
  const threadMessages = useFrozenChatMessages(
    paused,
    resumeCount,
    storeSignal,
    computeThreadMessages
  );
  const selfMember = useSelfMember();
  const threadParticipants = threadParticipantsFor(props.member.id, props.member.name);
  const [draft, setDraft] = useState('');
  const canSend = canSendPrivateMessages();

  useEffect(() => {
    markThreadRead(props.member.id);
  }, [props.member.id]);

  useChatAutoScroll(messageStackRef, {
    paused,
    resumeCount,
    messageCount: threadMessages.length,
  });

  function sendPrivateReply(): void {
    if (!canSend || !draft.trim()) {
      return;
    }

    sendPrivateMessage(props.member.id, props.member.name, draft);
    setDraft('');
  }

  return (
    <>
      <header className="page-title">
        <p>Conversation log</p>
        <h1>{props.member.name}</h1>
      </header>

      <section className="message-log-passport-rail">
        {threadParticipants.map((participant) => {
          const reviewedSignal = readMemberSignalReview(participant.id, participant.signal);

          return (
            <div className="message-log-passport-slot" key={participant.id}>
              <TcgFoilPassportCard layout="vertical" member={participant} signal={reviewedSignal} />
              <button
                className="secondary-action message-log-passport-profile-button"
                onClick={() => props.onOpenMember(participant)}
                type="button"
              >
                View {participant.name}
              </button>
            </div>
          );
        })}
      </section>

      <div className="message-log-passport-actions tcg-passport-actions">
        <button className="secondary-action" onClick={() => props.onNavigate('messages')} type="button">
          Back to Messages
        </button>
      </div>

      <ApprovalRequestActions counterpartyMemberId={props.member.id} />

      <section className="message-log-page panel" ref={viewportRef}>
        <div className="message-stack" ref={messageStackRef}>
          {threadMessages.map((message) => {
            const messageMember = message.outgoing ? selfMember : props.member;

            return (
              <div
                className={'chat-message-row' + (message.outgoing ? ' is-outgoing-message' : '')}
                key={message.id + '-' + threadMessages.length}
              >
                <UniformMemberAvatarButton
                  member={messageMember}
                  onClick={() => props.onOpenMember(messageMember)}
                  signal={message.signal}
                />
                <div
                  className={
                    'message-bubble' + messageBubbleClass(messageMember, message.author)
                  }
                >
                  <div className="message-meta">
                    <strong>{message.author}</strong>
                    <span>{message.time}</span>
                  </div>
                  <p>
                    <TaggedMessageBody body={message.body} handlers={props.tagHandlers} />
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <ChatComposerWithEmojis
          ariaLabel={'Private message to ' + props.member.name}
          canSend={canSend}
          className="chat-composer-row message-log-composer"
          onChange={setDraft}
          onSend={sendPrivateReply}
          placeholder={
            canSend
              ? 'Send a private message to ' + props.member.name + ' · ' + tagSuggestionHint()
              : 'Sign in and verify to send private messages'
          }
          value={draft}
        />
      </section>
    </>
  );
}

function EventDetailScreen(props: {
  event: StoredEvent;
  onNavigate: (page: NamiPage) => void;
}): ReactElement {
  useEventsStore();
  const localSchedule = formatEventTimeInTimezone(props.event.startsAtUtc, readViewerTimezone());

  return (
    <>
      <header className="page-title">
        <p>Event details</p>
        <h1>{props.event.title}</h1>
      </header>

      <article className={'panel event-detail-page' + eventImportanceClass(props.event)}>
        <span className="mini-badge">{props.event.status}</span>
        <h2>{props.event.title}</h2>
        <p className="event-detail-description">{props.event.description}</p>
        <div className="event-detail-body">{props.event.body}</div>
        <div className="channel-event-meta-row">
          <span>{localSchedule}</span>
          <strong>{props.event.seats}</strong>
        </div>
        <p className="event-timezone-note">Shown in your timezone ({readViewerTimezone()}).</p>
        <EventInterestedButton eventId={props.event.id} />
        <label className="event-timezone-field">
          <span>Adjust timezone</span>
          <input
            onChange={(event) => saveViewerTimezone(event.target.value)}
            placeholder="America/Los_Angeles"
            type="text"
            value={readViewerTimezone()}
          />
        </label>
        <button className="secondary-action" onClick={() => props.onNavigate('hub')} type="button">
          Back to Nami Hub
        </button>
      </article>
    </>
  );
}

function ChannelEventsScreen(props: {
  channel: NamiChannel;
  onNavigate: (page: NamiPage) => void;
  onViewEvent: (event: StoredEvent) => void;
}): ReactElement {
  useEventsStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAtLocal, setStartsAtLocal] = useState('');
  const [notice, setNotice] = useState('');
  const channelBrandTheme = useMemo(() => {
    return getStoredChannelBrandTheme(props.channel.id);
  }, [props.channel.id]);

  useEffect(() => {
    applyChannelBrandToDocument(channelBrandTheme);

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [channelBrandTheme, props.channel.id]);

  const isChannelOwner = ownsGameChannel(props.channel.id);
  const preApprovedWorkspace = isPreApprovedGameOwner() && !isFullyApprovedGameOwner() && isChannelOwner;
  const gameEvents = getChannelEvents(props.channel, {
    includeHiddenDrafts: preApprovedWorkspace,
  });

  function publishChannelEvent(): void {
    if (!isChannelOwner) {
      setNotice('Only the game channel owner can publish events for this channel.');
      return;
    }

    if (!title.trim() || !startsAtLocal) {
      setNotice('Add a title and start time before publishing.');
      return;
    }

    const created = createChannelEvent(props.channel, {
      title,
      description: description.trim() || 'New channel event from ' + props.channel.name + '.',
      body:
        'Subscribed members were notified in their timezone. Interested members receive a reminder before go-live.',
      startsAtUtc: new Date(startsAtLocal).toISOString(),
    });

    setNotice(
      created.hiddenUntilChannelApproval
        ? 'Event saved as a hidden draft. It will publish after Nami Officials approve your channel.'
        : 'Event published. Subscribed members were notified.',
    );
    setTitle('');
    setDescription('');
    setStartsAtLocal('');
    props.onViewEvent(created);
  }

  return (
    <>
      <header className="page-title">
        <p>Selected game events</p>
        <h1>{props.channel.name} Events</h1>
      </header>

      <section className="channel-events-page channel-subsection-surface">
        <article className="channel-events-hero panel">
          <div className="chat-presence-channel">
            <ChannelAvatar channel={props.channel} size="lg" />
            <div>
              <span className="mini-badge">Channel Events</span>
              <h2>{props.channel.name}</h2>
              <p>
                Events shown here belong to this selected game/channel, not your account-level
                My Events page.
              </p>
            </div>
          </div>

          <div className="profile-hero-actions">
            <button
              className="secondary-action"
              onClick={() => props.onNavigate('channelProfile')}
              type="button"
            >
              Back to Game Profile
            </button>

            <button
              className="primary-action"
              onClick={() => props.onNavigate('chat')}
              type="button"
            >
              Open Main Chat
            </button>
          </div>
        </article>

        {isChannelOwner ? (
          <article className="panel event-creator-form">
            <h2>{preApprovedWorkspace ? 'Prepare channel event' : 'Publish channel event'}</h2>
            <p>
              {preApprovedWorkspace
                ? 'Save events now to get launch-ready. Hidden drafts stay invisible until your channel is fully approved.'
                : 'Subscribed members receive a notification when you submit a new event.'}
            </p>
            <label>
              <span>Title</span>
              <input onChange={(event) => setTitle(event.target.value)} type="text" value={title} />
            </label>
            <label>
              <span>Description</span>
              <input
                onChange={(event) => setDescription(event.target.value)}
                type="text"
                value={description}
              />
            </label>
            <label>
              <span>Starts at (your local time)</span>
              <input
                onChange={(event) => setStartsAtLocal(event.target.value)}
                type="datetime-local"
                value={startsAtLocal}
              />
            </label>
            <button className="primary-action" onClick={publishChannelEvent} type="button">
              {preApprovedWorkspace ? 'Save hidden event draft' : 'Submit event'}
            </button>
            {notice ? <p className="event-creator-notice">{notice}</p> : null}
          </article>
        ) : (
          <article className="panel channel-events-viewer-note">
            <h2>Official channel events</h2>
            <p>Events on this page are published by the game channel owner. Members can mark Interested and view details.</p>
          </article>
        )}

        <section className="channel-event-grid">
          {gameEvents.map((event) => (
            <article
              className={'channel-event-card panel' + eventImportanceClass(event)}
              key={event.id}
            >
              <div>
                <span className="mini-badge">{event.status}</span>
                <h2>{event.title}</h2>
                <p>{formatEventTimeInTimezone(event.startsAtUtc)}</p>
              </div>

              <div className="channel-event-meta-row">
                <span>{event.status}</span>
                <strong>{event.seats}</strong>
              </div>

              <EventInterestedButton eventId={event.id} />
              <button onClick={() => props.onViewEvent(event)} type="button">
                View Event
              </button>
            </article>
          ))}
        </section>
      </section>
    </>
  );
}

function EventsScreen(props: {
  onOpenChannel: (channel: NamiChannel) => void;
  onViewEvent: (event: StoredEvent) => void;
}): ReactElement {
  useEventsStore();

  return (
    <>
      <header className="page-title">
        <p>Subscribed channel and guild activity</p>
        <h1>My Events</h1>
      </header>

      <section className="account-grid uniform-card-grid">
        {subscribedUserEvents.map((eventItem) => {
          const event = getEventById(eventItem.id);

          if (!event) {
            return null;
          }

          return (
          <article
            className={'profile-panel account-card fixed-card event-card' + eventImportanceClass(event)}
            key={eventItem.id}
          >
            <div className="fixed-card-body">
              <span className="feature-label">{eventItem.source}</span>

              <div className="fixed-card-copy">
                <h2>{eventItem.title}</h2>
                <p>{eventItem.description}</p>
                <small>
                  {formatEventTimeInTimezone(event.startsAtUtc)} · {eventItem.status}
                </small>
              </div>
            </div>

            <div className="fixed-card-footer event-card-footer">
              <EventInterestedButton eventId={eventItem.id} />
              <div className="event-card-secondary-actions">
                {eventItem.channelId ? (
                  <button
                    className="secondary-action"
                    onClick={() => {
                      const channel = channels.find((entry) => entry.id === eventItem.channelId);

                      if (channel) {
                        props.onOpenChannel(channel);
                      }
                    }}
                    type="button"
                  >
                    Open channel
                  </button>
                ) : (
                  <span aria-hidden="true" className="event-card-action-spacer" />
                )}
                <button
                  className="secondary-action"
                  onClick={() => props.onViewEvent(event)}
                  type="button"
                >
                  View event
                </button>
              </div>
            </div>
          </article>
          );
        })}
      </section>
    </>
  );
}

function MemberFeedOfficialAlertBanner(props: {
  onOpenSafetyCenter: () => void;
}): ReactElement | null {
  const selfMember = useSelfMember();
  const feedAbuseAlerts = useOfficialFeedAbuseAlerts();

  if (!isNamiTeamMember(selfMember) || feedAbuseAlerts.length === 0) {
    return null;
  }

  const alertCount = feedAbuseAlerts.length;
  const suspendedCount = feedAbuseAlerts.filter((alert) => alert.suspended).length;

  return (
    <div className="member-feed-official-alert-banner" role="status">
      <div>
        <strong>Member feed abuse review required</strong>
        <p>
          {alertCount} member feed alert{alertCount === 1 ? '' : 's'} need immediate Nami review
          {suspendedCount > 0
            ? ' · ' + suspendedCount + ' feed' + (suspendedCount === 1 ? '' : 's') + ' suspended'
            : ''}
          .
        </p>
      </div>
      <button
        className="nami-surface-button is-primary-surface-button"
        onClick={props.onOpenSafetyCenter}
        type="button"
      >
        Open Safety Center
      </button>
    </div>
  );
}

export function App(): ReactElement {
  const messageUnreadCount = useMessageUnreadCount();
  const guildEventsStore = useGuildEventsStore();
  const selfMember = useSelfMember();
  const disconnectWallet = useWalletDisconnect();
  useDemoPerspective();

  const [activePage, setActivePage] = useState<NamiPage>('entry');
  const [entryShowGate, setEntryShowGate] = useState(false);
  const [entrySignedOutNotice, setEntrySignedOutNotice] = useState(false);
  const [gridPulseKey, setGridPulseKey] = useState(0);
  const [selectedChannel, setSelectedChannel] = useState<NamiChannel>(() => {
    const defaultChannel = channels[0] ?? seedChannels[0];
    if (!defaultChannel) {
      throw new Error('Nami mock channels must include at least one channel.');
    }

    return defaultChannel;
  });
  const [selectedMember, setSelectedMember] = useState<(typeof members)[number]>(members[0]!);
  const [selectedDeveloper, setSelectedDeveloper] = useState<(typeof developers)[number]>(() => channelDeveloper(channels[0]!));
  const [studioReturnPage, setStudioReturnPage] = useState<NamiPage>('hub');
  const [contextReturnPage, setContextReturnPage] = useState<NamiPage>('hub');
  const [channelProfileSection, setChannelProfileSection] = useState<ChannelProfileSection>('news');
  const [channelProfileOwnerFocus, setChannelProfileOwnerFocus] = useState<ChannelProfileOwnerFocus>(null);
  const [selectedThreadMemberId, setSelectedThreadMemberId] = useState<string>(members[1]?.id ?? 'm2');
  const [selectedEvent, setSelectedEvent] = useState<StoredEvent | null>(null);
  const [selectedGuild, setSelectedGuild] = useState<NamiGuildRecord>(namiGuilds[0]!);
  const [selectedSquad, setSelectedSquad] = useState<NamiSquadRecord>(namiSquads[0]!);
  const [squadShowInviteOnOpen, setSquadShowInviteOnOpen] = useState(false);

  useEffect(() => {
    void ensureOwnerAssetsHydrated();
  }, []);

  function profileReturnLabel(page: NamiPage): string {
    if (page === 'hub') return 'Back to Nami Hub';
    if (page === 'gamehub') return 'Back to Game Hub';
    if (page === 'channelProfile') return 'Back to Game Profile';
    if (page === 'studioProfile') return 'Back to Studio';
    if (page === 'memberProfile') return 'Back to Member Profile';
    if (page === 'chat') return 'Back to Chat';

    return 'Back';
  }

  const openMemberProfile = useCallback((member: (typeof members)[number]): void => {
    setSelectedMember(member);
    setContextReturnPage((returnPage) => (activePage === 'memberProfile' ? returnPage : activePage));
    window.localStorage.setItem('nami-selected-member-id', member.id);
    setActivePage('memberProfile');
  }, [activePage]);


  const openChannelProfile = useCallback((
    channel: NamiChannel,
    section: ChannelProfileSection = 'news',
    ownerFocus: ChannelProfileOwnerFocus = null,
  ): void => {
    if (
      isChannelHiddenFromPublic(channel.id) &&
      !(isGameChannelOwner() && ownsGameChannel(channel.id))
    ) {
      return;
    }

    setSelectedChannel(channel);
    setSelectedDeveloper(channelDeveloper(channel));
    setChannelProfileSection(section);
    setChannelProfileOwnerFocus(ownerFocus);
    setContextReturnPage((returnPage) => (activePage === 'channelProfile' ? returnPage : activePage));
    setActivePage('channelProfile');
  }, [activePage]);

  const handleDemoPerspectiveApplied = useCallback(
    (page: NamiPage, channelId?: string): void => {
      if (channelId && isGameChannelOwner()) {
        const ownedChannel = resolveOwnedGameChannel();

        if (ownedChannel) {
          setContextReturnPage((returnPage) => (activePage === 'channelProfile' ? returnPage : activePage));
          openChannelProfile(ownedChannel, 'owner', null);
          return;
        }
      }

      if (channelId) {
        const channel =
          channels.find((entry) => entry.id === channelId) ??
          seedChannels.find((entry) => entry.id === channelId);

        if (channel) {
          openChannelProfile(channel, 'news', null);
          return;
        }
      }

      setActivePage(page);
    },
    [activePage, openChannelProfile]
  );

  const openOwnedGameChannelProfile = useCallback((ownerFocus: ChannelProfileOwnerFocus = null): void => {
    const ownedChannel = resolveOwnedGameChannel();

    if (!ownedChannel) {
      return;
    }

    setContextReturnPage((returnPage) => (activePage === 'channelProfile' ? returnPage : activePage));
    openChannelProfile(ownedChannel, 'owner', ownerFocus);
  }, [activePage, openChannelProfile]);

  const openOwnedPartnerCarouselTicket = useCallback((): void => {
    openOwnedGameChannelProfile('partner-carousel');
  }, [openOwnedGameChannelProfile]);

  const handleRestoreOwnerDashboard = useCallback((): void => {
    restoreOwnerDemoPerspective();
    requestSettingsSection('advanced');
    setActivePage('settings');
  }, []);


  const openStudioProfile = useCallback((developer: (typeof developers)[number]): void => {
    setSelectedDeveloper(developer);
    setStudioReturnPage((returnPage) => (activePage === 'studioProfile' ? returnPage : activePage));
    setActivePage('studioProfile');
  }, [activePage]);

  const openGuild = (guild: NamiGuildRecord): void => {
    setSelectedGuild(guild);
    setActivePage('guildDetail');
  };

  const openSquad = (squad: NamiSquadRecord, showInvitePanel = false): void => {
    setSelectedSquad(squad);
    setSquadShowInviteOnOpen(showInvitePanel);
    setActivePage('squadDetail');
  };

  const openMessageThread = (memberId: string): void => {
    setSelectedThreadMemberId(memberId);
    markThreadRead(memberId);
    setActivePage('messageLog');
  };

  const tagHandlers = useMemo<TagNavigationHandlers>(() => ({
    onOpenMember: (memberId) => {
      const member = members.find((entry) => entry.id === memberId);

      if (member) {
        openMemberProfile(member);
      }
    },
    onOpenChannel: (channelId) => {
      const channel = channels.find((entry) => entry.id === channelId);

      if (channel) {
        openChannelProfile(channel);
      }
    },
    onOpenStudio: (studioId) => {
      const developer = developers.find((entry) => entry.id === studioId);

      if (developer) {
        openStudioProfile(developer);
      }
    },
    onOpenGuilds: () => {
      markGuildEventsSeen();
      setActivePage('guilds');
    },
  }), [openMemberProfile, openChannelProfile, openStudioProfile]);

  const navigateFromCurrentPage = useCallback((page: NamiPage): void => {
    if (isPreApprovedGameOwner() && !isFullyApprovedGameOwner()) {
      if (page === 'channelProfile') {
        openOwnedGameChannelProfile(null);
        return;
      }

      if (page === 'settings') {
        return;
      }

      return;
    }

    if (page === 'userProfile' && isGameChannelOwner()) {
      openOwnedGameChannelProfile();
      return;
    }

    if (page === 'events' && isGameChannelOwner()) {
      const ownedChannel = resolveOwnedGameChannel();

      if (ownedChannel) {
        setSelectedChannel(ownedChannel);
        setContextReturnPage((returnPage) => (activePage === 'channelEvents' ? returnPage : activePage));
        setActivePage('channelEvents');
        return;
      }
    }

    if (page === 'chat') {
      if (activePage !== 'channelProfile') {
        setContextReturnPage(activePage);
      }

      setChannelProfileSection('chat');
      setActivePage('channelProfile');
      return;
    }

    if ((page === 'channelProfile' || page === 'memberProfile' || page === 'studioProfile') && page !== activePage) {
      setContextReturnPage(activePage);
    }

    if (page === 'channelProfile') {
      if (isGameChannelOwner()) {
        openOwnedGameChannelProfile();
        return;
      }

      if (activePage !== 'channelProfile') {
        setChannelProfileSection('news');
        setChannelProfileOwnerFocus(null);
      }
    }

    if (page === 'guilds') {
      markGuildEventsSeen();
    }

    setActivePage(page);
  }, [activePage, openOwnedGameChannelProfile]);

  function navigateHubSwap(page: 'hub' | 'gamehub'): void {
    if (page !== activePage) {
      triggerHubSpotlightBurst(page === 'hub' ? 'nami' : 'game');
    }

    navigateFromCurrentPage(page);
  }

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    document.body.classList.add('is-grid-nav-pulse');
    setGridPulseKey((value) => value + 1);

    const timer = window.setTimeout(() => {
      document.body.classList.remove('is-grid-nav-pulse');
    }, 920);

    return () => window.clearTimeout(timer);
  }, [activePage]);

  useEffect(() => {
    const sharedMemberId = readMemberIdFromShareUrl();

    if (!sharedMemberId) {
      return;
    }

    const member = members.find((entry) => entry.id === sharedMemberId);

    if (!member) {
      return;
    }

    setSelectedMember(member);
    setContextReturnPage('hub');
    setActivePage('memberProfile');
  }, []);

  function enterNamiHub(): void {
    setEntryShowGate(false);
    setEntrySignedOutNotice(false);
    setActivePage('hub');
  }

  function openEntryGate(): void {
    setEntrySignedOutNotice(false);
    setEntryShowGate(true);
    setActivePage('entry');
  }

  function enterPreApprovedGameChannel(): void {
    setEntryShowGate(false);
    setEntrySignedOutNotice(false);

    const ownedChannel = resolveOwnedGameChannel();

    if (ownedChannel) {
      setSelectedChannel(ownedChannel);
      setChannelProfileSection('about');
      setChannelProfileOwnerFocus(null);
      setContextReturnPage('entry');
      setActivePage('channelProfile');
      return;
    }

    openOwnedGameChannelProfile(null);
  }

  const screen = useMemo(() => {
    if (activePage === 'entry') {
      return (
        <EntryPage
          onEnterHub={enterNamiHub}
          onEnterPreApprovedGame={enterPreApprovedGameChannel}
          onEntryGateHandled={() => setEntryShowGate(false)}
          onNavigateToSettings={() => setActivePage('settings')}
          onRequestEntryGate={openEntryGate}
          showEntryGate={entryShowGate}
          signedOutNotice={entrySignedOutNotice}
        />
      );
    }

    if (activePage === 'hub') {
      return <NamiHub
          selectedChannel={selectedChannel}
          onSelect={setSelectedChannel}
          onOpenOwnedPartnerTicket={openOwnedPartnerCarouselTicket}
          onOpenProfile={openChannelProfile}
          onOpenMember={openMemberProfile}
          onNavigateToSettings={() => setActivePage('settings')}
          onViewEvent={(event) => {
            setSelectedEvent(event);
            setActivePage('eventDetail');
          }}
          tagHandlers={tagHandlers}
        />;
    }

    if (activePage === 'gamehub') {
      return (
        <GameHub
          selectedChannel={selectedChannel}
          onSelect={setSelectedChannel}
          onOpenMember={openMemberProfile}
          onOpenProfile={openChannelProfile}
          tagHandlers={tagHandlers}
        />
      );
    }

    if (activePage === 'subscriptions') {
      return (
        <Subscriptions
          selectedChannel={selectedChannel}
          onSelect={setSelectedChannel}
          onOpenProfile={openChannelProfile}
        />
      );
    }

    if (activePage === 'studioProfile') {
      return (
        <StudioProfileScreen
          developer={selectedDeveloper}
          onNavigate={(page) => setActivePage(page)}
          onOpenProfile={openChannelProfile}
          returnLabel="Back"
          returnPage={studioReturnPage}
        />
      );
    }

    if (activePage === 'channelProfile') {
      return (
        <ChannelProfileScreen
          key={
            selectedChannel.id +
            ':' +
            channelProfileSection +
            ':' +
            (channelProfileOwnerFocus ?? 'none')
          }
          channel={selectedChannel}
          initialSection={channelProfileSection}
          {...(channelProfileOwnerFocus ? { ownerFocus: channelProfileOwnerFocus } : {})}
          onNavigate={navigateFromCurrentPage}
          onOpenChatMember={openMemberProfile}
          onOpenMember={(memberId) => {
            const member = members.find((entry) => entry.id === memberId);

            if (member) {
              openMemberProfile(member);
            }
          }}
          onOpenProfile={openChannelProfile}
          onOpenStudioProfile={openStudioProfile}
          onViewEvent={(event) => {
            setSelectedEvent(event);
            setActivePage('eventDetail');
          }}
          returnPage={contextReturnPage}
          returnLabel={profileReturnLabel(contextReturnPage)}
          tagHandlers={tagHandlers}
        />
      );
    }

  if (activePage === 'channelEvents') {
    return (
      <ChannelEventsScreen
        channel={selectedChannel}
        onNavigate={navigateFromCurrentPage}
        onViewEvent={(event) => {
          setSelectedEvent(event);
          setActivePage('eventDetail');
        }}
      />
    );
  }

  if (activePage === 'safetyCenter') {
    return <SafetyCenterScreen onNavigate={navigateFromCurrentPage} />;
  }

  if (activePage === 'memberProfile') {
    return <MemberProfileScreen
        member={selectedMember}
        onNavigate={navigateFromCurrentPage}
        onNavigateGuilds={() => setActivePage('guilds')}
        onOpenProfile={openChannelProfile}
        onOpenMember={openMemberProfile}
        onOpenThread={(memberId) => {
          setSelectedThreadMemberId(memberId);
          markThreadRead(memberId);
          setActivePage('messageLog');
        }}
        returnPage={contextReturnPage}
        returnLabel={profileReturnLabel(contextReturnPage)}
        tagHandlers={tagHandlers}
      />;
  }

  if (activePage === 'passport') {
    return (
      <PassportScreen
        onNavigate={navigateFromCurrentPage}
        onOpenProfile={(channel) => {
          openChannelProfile(channel);
        }}
      />
    );
  }

if (activePage === 'userProfile') {
      return <UserProfileScreen
          onOpenGuild={openGuild}
          onOpenMember={openMemberProfile}
          onOpenProfile={openChannelProfile}
          onNavigate={navigateFromCurrentPage}
          tagHandlers={tagHandlers}
        />;
    }

    if (activePage === 'guilds') {
      return (
        <GuildsScreen
          onNavigate={navigateFromCurrentPage}
          onOpenGuild={openGuild}
          onOpenMessage={openMessageThread}
          onOpenSquad={openSquad}
        />
      );
    }

    if (activePage === 'guildDetail') {
      return (
        <GuildDetailScreen
          guild={selectedGuild}
          onNavigate={navigateFromCurrentPage}
          onOpenMember={openMemberProfile}
          onOpenMessage={openMessageThread}
          tagHandlers={tagHandlers}
        />
      );
    }

    if (activePage === 'squadDetail') {
      return (
        <SquadDetailScreen
          onNavigate={navigateFromCurrentPage}
          onOpenMember={openMemberProfile}
          onOpenMessage={openMessageThread}
          showInvitePanel={squadShowInviteOnOpen}
          squad={selectedSquad}
        />
      );
    }

    if (activePage === 'messages') {
      return (
        <MessagesScreen
          onOpenThread={(memberId) => {
            setSelectedThreadMemberId(memberId);
            markThreadRead(memberId);
            setActivePage('messageLog');
          }}
        />
      );
    }

    if (activePage === 'messageLog') {
      const threadMember = members.find((member) => member.id === selectedThreadMemberId) ?? members[1]!;

      return (
        <MessageLogScreen
          member={threadMember}
          onNavigate={navigateFromCurrentPage}
          onOpenMember={openMemberProfile}
          tagHandlers={tagHandlers}
        />
      );
    }

    if (activePage === 'events') {
      return (
        <EventsScreen
          onOpenChannel={openChannelProfile}
          onViewEvent={(event) => {
            setSelectedEvent(event);
            setActivePage('eventDetail');
          }}
        />
      );
    }

    if (activePage === 'eventDetail' && selectedEvent) {
      return <EventDetailScreen event={selectedEvent} onNavigate={navigateFromCurrentPage} />;
    }

    return <NamiHub
          selectedChannel={selectedChannel}
          onSelect={setSelectedChannel}
          onOpenProfile={openChannelProfile}
          onOpenMember={openMemberProfile}
          onNavigateToSettings={() => setActivePage('settings')}
          onViewEvent={(event) => {
            setSelectedEvent(event);
            setActivePage('eventDetail');
          }}
          tagHandlers={tagHandlers}
        />;
  }, [activePage, channelProfileOwnerFocus, channelProfileSection, contextReturnPage, entryShowGate, entrySignedOutNotice, navigateFromCurrentPage, openChannelProfile, openMemberProfile, openOwnedPartnerCarouselTicket, selectedChannel, selectedDeveloper, selectedEvent, selectedGuild, selectedMember, selectedSquad, selectedThreadMemberId, squadShowInviteOnOpen, studioReturnPage, tagHandlers]);

  async function signOutToEntry(): Promise<void> {
    clearLocalNamiSession();

    try {
      await disconnectWallet();
    } catch {
      // Wallet extension may already be disconnected.
    }

    setEntryShowGate(false);
    setEntrySignedOutNotice(true);
    setActivePage('entry');
  }

  useEffect(() => {
    if (activePage !== 'entry') {
      return;
    }

    saveIgniteRadioEnabled(false);
  }, [activePage]);

  const isPreApprovedGameOwnerOnly = isPreApprovedGameOwner() && !isFullyApprovedGameOwner();
  const showSidebar = activePage !== 'entry' && !isPreApprovedGameOwnerOnly;
  const showProfileDropdown = showSidebar && !isPreApprovedGameOwnerOnly;

  useEffect(() => {
    if (!isPreApprovedGameOwnerOnly) {
      return;
    }

    if (activePage === 'settings') {
      enterPreApprovedGameChannel();
    }
  }, [activePage, isPreApprovedGameOwnerOnly]);

  return (
    <main
      className="nami-app"
      data-active-page={activePage}
      data-grid-pulse-key={gridPulseKey}
      {...(isPreApprovedGameOwnerOnly ? { 'data-preapproved-game-owner': 'true' } : {})}
    >
      {showSidebar ? <NamiGridSpotlight scope="app" /> : null}
      {showProfileDropdown
        ? createPortal(
            isGameChannelOwner() ? (
              <PinnedGameChannelProfileCard
                onNavigate={navigateFromCurrentPage}
                onOpenGameProfile={() => openOwnedGameChannelProfile(null)}
                onSignOut={signOutToEntry}
              />
            ) : (
              <SidebarProfileCard
                onNavigate={navigateFromCurrentPage}
                onOpenOwnedChannel={() => openOwnedGameChannelProfile(null)}
                onSignOut={signOutToEntry}
              />
            ),
            document.body,
          )
        : null}
      {showSidebar ? (
        <>
          <Sidebar
            activePage={activePage}
            guildEventUnreadCount={guildEventsStore.unreadCount}
            messageUnreadCount={messageUnreadCount}
            onHubSwap={navigateHubSwap}
            onNavigate={navigateFromCurrentPage}
            onOpenOwnedChannel={() => openOwnedGameChannelProfile(null)}
          />
        </>
      ) : (
        <button
          className="sidebar-enter-nami-button"
          onClick={openEntryGate}
          type="button"
        >
          Enter Nami
        </button>
      )}

      {!isPreApprovedGameOwnerOnly ? (
        <NamiOwnerEditModeBar onReturnToDashboard={() => setActivePage('settings')} />
      ) : null}
      {!isPreApprovedGameOwnerOnly ? (
        <DemoPerspectiveBar
          onNavigate={navigateFromCurrentPage}
          onRestoreOwner={handleRestoreOwnerDashboard}
        />
      ) : null}

      <section className="main-stage">
        {showSidebar && (activePage === 'hub' || activePage === 'gamehub') ? (
          <NamiSeasonProgressBar member={selfMember} />
        ) : null}
        {showSidebar ? <ChannelBannerReminderBar /> : null}
        {showSidebar ? (
          <MemberFeedOfficialAlertBanner onOpenSafetyCenter={() => setActivePage('safetyCenter')} />
        ) : null}
        {activePage === 'settings' ? (
          <SettingsScreen
            onDemoPerspectiveApplied={handleDemoPerspectiveApplied}
            onNavigate={navigateFromCurrentPage}
            onOpenMember={openMemberProfile}
          />
        ) : (
          screen
        )}
      </section>

      {showSidebar ? <IgniteRadioDock /> : null}
      {showSidebar && !isGameChannelOwner() ? <MembershipUpgradeOverlay /> : null}
      {showSidebar ? <SuperBannerOverlay /> : null}
      {showSidebar ? <MembershipPaymentReturnHandler /> : null}
      {showSidebar ? <MemberSessionSync /> : null}
      {showSidebar ? <WalletAuthBridge /> : null}
      {showSidebar ? (
        <EventLivePopup
          onOpenEvent={(event) => {
            setSelectedEvent(event);
            setActivePage('eventDetail');
          }}
        />
      ) : null}
      {showSidebar ? (
        <ChannelBannerNotificationOverlay
          onOpenChannel={(channel) => {
            setSelectedChannel(channel);
            openChannelProfile(channel);
          }}
        />
      ) : null}
    </main>
  );
}
