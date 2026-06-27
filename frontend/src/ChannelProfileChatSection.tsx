import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';

import { ChatComposerWithEmojis } from './ChatComposerWithEmojis.js';
import { ChatMessageBubble } from './ChatMessageBubble.js';
import { ChatOverlayEquipPicker } from './ChatOverlayEquipPicker.js';
import { ChatWindowExpandable } from './ChatWindowExpandable.js';
import type { ChannelBrandTheme } from './channel-profile-brand.js';
import {
  canEditProfileCosmetics,
  canSendChatMessages,
  getSelfMember,
  readSignedInOwner,
  resolveMessageAuthorMember,
} from './member-access.js';
import {
  chatMemberCardTierClass,
  ConductSignalDot,
  UniformMemberAvatar,
  UniformMemberAvatarButton,
} from './member-avatar.js';
import { memberPassportTierLabel } from './owner-passport-display.js';
import {
  channelChatPresenceTarget,
  resolveChannelChatLiveStats,
} from './chat-live-stats.js';
import { getChannelChatMessages, getChannelChatPresenceMembers } from './channel-chats.js';
import { useMemberChatTimeTracker, useMemberChatTimeVersion } from './member-chat-time-store.js';
import { readMemberPreference, useMemberPreferencesVersion } from './member-preference-store.js';
import { saveEquippedChatOverlay } from './member-cosmetic-equip.js';
import { useSelfEquippedChatOverlayId } from './member-cosmetic-equips-store.js';
import { appendChannelChatMessage } from './messages-store.js';
import {
  useChatAutoScroll,
  useChatViewportPause,
  useFrozenChatMessages,
  usePausedMessagesStoreSignal,
} from './use-chat-viewport.js';
import { tagSuggestionHint } from './nami-tag-registry.js';
import { saveSafetyReport } from './safety-report-store.js';
import { resolveChatEmojisForChannel, useChannelCustomEmojis } from './channel-custom-emojis-store.js';
import { ChatPokeButton } from './ChatPokeButton.js';
import { TaggedMessageBody, type TagNavigationHandlers } from './TaggedMessageBody.js';

import { members, type ChatMessage, type NamiChannel, type NamiMember, type NamiPage } from './uiMockData.js';

const conductLanguageTerms = [
  'nsfw',
  'explicit',
  'adult-only',
  '18+',
  'xxx',
  'sexual',
  'harassment',
  'threat',
];

function hasAdultLanguage(content: string): boolean {
  const normalizedContent = content.toLowerCase();

  return conductLanguageTerms.some((term) => normalizedContent.includes(term));
}

function censorAdultLanguage(content: string): string {
  return conductLanguageTerms.reduce((censoredContent, term) => {
    const charactersToEscape = '\\^$.*+?()[]{}|';
    const escapedTerm = term
      .split('')
      .map((character) => (charactersToEscape.includes(character) ? '\\' + character : character))
      .join('');
    const termPattern = new RegExp(escapedTerm, 'gi');

    return censoredContent.replace(termPattern, (match) => '•'.repeat(Math.max(4, match.length)));
  }, content);
}

export function ChannelProfileChatSection(props: {
  channel: NamiChannel;
  channelBrandTheme: ChannelBrandTheme;
  onNavigate: (page: NamiPage) => void;
  onOpenMember: (member: NamiMember) => void;
  tagHandlers: TagNavigationHandlers;
}): ReactElement {
  const [hideNpc, setHideNpc] = useState(false);
  const [hideRed, setHideRed] = useState(false);
  const [proEliteOnly, setProEliteOnly] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [customizationCollapsed, setCustomizationCollapsed] = useState(true);
  const [gatedAccessCollapsed, setGatedAccessCollapsed] = useState(true);
  const [adultLanguageCollapsed, setAdultLanguageCollapsed] = useState(true);
  const [reportPulse, setReportPulse] = useState('');
  const [adultLanguageMode, setAdultLanguageMode] = useState<'censor' | 'filter' | 'show'>('censor');
  useChannelCustomEmojis(props.channel.id);
  const channelEmojis = resolveChatEmojisForChannel(props.channel.id);

  useEffect(() => {
    setFiltersCollapsed(true);
    setCustomizationCollapsed(true);
    setGatedAccessCollapsed(true);
    setAdultLanguageCollapsed(true);
  }, [props.channel.id]);

  const preferencesVersion = useMemberPreferencesVersion();
  const selfChatMember = getSelfMember();
  const canEquipOverlays = canEditProfileCosmetics(selfChatMember);
  const equippedChatOverlayId = useSelfEquippedChatOverlayId();
  const channelChatTimeTarget = useMemo(
    () => channelChatPresenceTarget(props.channel.id, props.channel.name),
    [props.channel.id, props.channel.name],
  );
  useMemberChatTimeTracker(selfChatMember.id, channelChatTimeTarget);
  useMemberChatTimeVersion();
  const connectedOwner = readSignedInOwner();
  const { paused, resumeCount, viewportRef, messageStackRef } = useChatViewportPause();
  const storeSignal = usePausedMessagesStoreSignal(paused);
  const channelLiveStats = useMemo(
    () => resolveChannelChatLiveStats(props.channel.id, getChannelChatMessages(props.channel.id)),
    [props.channel.id, preferencesVersion, storeSignal],
  );
  const chatEligibleMembers = useMemo(
    () => members.filter((member) => member.signal !== 'Black'),
    [],
  );

  const channelPresenceMembers = useMemo(() => {
    return getChannelChatPresenceMembers(props.channel.id, getChannelChatMessages(props.channel.id));
  }, [props.channel.id, preferencesVersion, storeSignal]);

  const visibleChatMembers = useMemo(() => {
    return channelPresenceMembers.filter((member) => !readMemberPreference(member.id).blocked);
  }, [channelPresenceMembers, preferencesVersion]);
  const [chatDraft, setChatDraft] = useState('');
  const canSend = canSendChatMessages();

  const resolveChatMessageMember = useCallback((message: ChatMessage): NamiMember | undefined => {
    return resolveMessageAuthorMember(message, selfChatMember, chatEligibleMembers);
  }, [selfChatMember, chatEligibleMembers]);

  const computeVisibleMessages = useCallback(() => {
    return getChannelChatMessages(props.channel.id).filter((message) => {
      if (message.signal === 'Black') return false;
      if (adultLanguageMode === 'filter' && hasAdultLanguage(message.body)) return false;

      const member = resolveChatMessageMember(message);

      if (!member) return false;
      if (readMemberPreference(member.id).blocked) return false;
      if (hideNpc && member.tier === 'NPC') return false;
      if (hideRed && message.signal === 'Red') return false;
      if (proEliteOnly && member.tier !== 'Pro' && member.tier !== 'Elite') return false;

      return true;
    });
  }, [
    adultLanguageMode,
    hideNpc,
    hideRed,
    preferencesVersion,
    proEliteOnly,
    props.channel.id,
    resolveChatMessageMember,
  ]);

  const visibleMessages = useFrozenChatMessages(
    paused,
    resumeCount,
    storeSignal,
    computeVisibleMessages
  );

  useChatAutoScroll(messageStackRef, {
    paused,
    resumeCount,
    messageCount: visibleMessages.length,
  });

  const onlineMembers = visibleChatMembers.slice(0, 4);
  const offlineMembers = visibleChatMembers.slice(4);

  function reportMessage(member: NamiMember, messageBody: string): void {
    saveSafetyReport({
      source: 'message',
      targetId: member.id,
      targetName: member.name,
      reason: messageBody,
      channelName: props.channel.name,
    });

    setReportPulse('Report queued for ' + member.name);
  }

  return (
    <section className="channel-profile-section channel-profile-chat-panel" ref={viewportRef}>
      <section className="chat-presence-rail channel-profile-chat-presence">
        <div className="chat-presence-channel">
          <span className="mini-badge">Live room</span>
          <h2>Main chat</h2>
          <p>
            {channelLiveStats.membersInside.toLocaleString()} in chat ·{' '}
            {channelLiveStats.activeNow.toLocaleString()} active now ·{' '}
            {channelLiveStats.weeklyActive.toLocaleString()} active this week
          </p>
        </div>

        <div className="chat-member-strip">
          {onlineMembers.map((member) => {
            const preference = readMemberPreference(member.id);

            return (
              <div
                className={
                  'chat-member-card-wrap' +
                  chatMemberCardTierClass(member) +
                  (preference.muted ? ' is-muted-member-card' : '')
                }
                key={member.id}
              >
                <button
                  className={'chat-member-card' + chatMemberCardTierClass(member)}
                  onClick={() => props.onOpenMember(member)}
                  type="button"
                >
                  <UniformMemberAvatar member={member} />
                  <strong>{member.name}</strong>
                  <span>
                    {preference.muted ? 'Muted' : memberPassportTierLabel(member, connectedOwner)}
                  </span>
                </button>
                <ChatPokeButton compact target={member} />
              </div>
            );
          })}

          {offlineMembers.map((member) => {
            const preference = readMemberPreference(member.id);

            return (
              <div
                className={
                  'chat-member-card-wrap is-offline' +
                  chatMemberCardTierClass(member) +
                  (preference.muted ? ' is-muted-member-card' : '')
                }
                key={member.id}
              >
                <button
                  className={'chat-member-card is-offline' + chatMemberCardTierClass(member)}
                  onClick={() => props.onOpenMember(member)}
                  type="button"
                >
                  <UniformMemberAvatar member={member} />
                  <strong>{member.name}</strong>
                  <span>{preference.muted ? 'Muted' : 'Offline'}</span>
                </button>
                <ChatPokeButton compact target={member} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="chat-shell chat-shell-buildout channel-profile-chat-shell">
        <div className="chat-layout chat-layout-buildout">
          <ChatWindowExpandable className="chat-theme-channel-brand">
            <div className="chat-window-heading">
              <div>
                <h2>{props.channel.name} Main Chat</h2>
                <p>
                  {visibleMessages.length} visible messages · {visibleChatMembers.length} visible members
                </p>
              </div>

              <div className="chat-heading-actions">
                {reportPulse ? <span className="report-pulse">{reportPulse}</span> : null}
                <button onClick={() => props.onNavigate('safetyCenter')} type="button">
                  Safety Center
                </button>
              </div>
            </div>

            <div className="message-stack global-message-stack" ref={messageStackRef}>
              {visibleMessages.map((message) => {
                const member = resolveChatMessageMember(message);

                if (!member) {
                  return null;
                }

                const preference = readMemberPreference(member.id);

                return (
                  <div
                    className={'chat-message-row' + (preference.muted ? ' is-muted-chat-row' : '')}
                    key={message.id}
                  >
                    <UniformMemberAvatarButton
                      member={member}
                      onClick={() => props.onOpenMember(member)}
                      signal={message.signal}
                    />

                    <ChatMessageBubble authorName={message.author} member={member}>
                      <div className="message-meta">
                        <button
                          className={'message-author-button signal-text-' + message.signal.toLowerCase()}
                          onClick={() => props.onOpenMember(member)}
                          type="button"
                        >
                          {message.author}
                        </button>

                        <span>{message.time}</span>
                        <i>{preference.muted ? 'Muted' : member.tier}</i>
                        <ConductSignalDot signal={message.signal} size="sm" />

                        <button
                          className="message-report-button"
                          onClick={() => reportMessage(member, message.body)}
                          type="button"
                        >
                          Report
                        </button>
                      </div>

                      <p>
                        <TaggedMessageBody
                          body={message.body}
                          customEmojis={channelEmojis}
                          handlers={props.tagHandlers}
                          {...(adultLanguageMode === 'censor'
                            ? { transformText: censorAdultLanguage }
                            : {})}
                        />
                      </p>
                    </ChatMessageBubble>
                  </div>
                );
              })}
            </div>

            <ChatComposerWithEmojis
              ariaLabel={'Message ' + props.channel.name}
              canSend={canSend}
              className="chat-composer-row chat-input-placeholder"
              customEmojis={channelEmojis}
              emojiPickerLabel={props.channel.name + ' emojis'}
              onChange={setChatDraft}
              onSend={() => {
                if (!canSend || !chatDraft.trim()) {
                  return;
                }

                appendChannelChatMessage(props.channel.id, chatDraft, props.channel.name);
                setChatDraft('');
              }}
              placeholder={
                canSend
                  ? 'Message ' + props.channel.name + ' · ' + tagSuggestionHint()
                  : 'Sign in and verify to send messages'
              }
              sendButtonClassName="channel-chat-send-button"
              value={chatDraft}
            />
          </ChatWindowExpandable>

          <aside className="chat-side-panel chat-side-panel-collapsible">
            <section
              className={
                'gated-access-panel chat-rail-collapsible-panel' +
                (gatedAccessCollapsed ? ' is-chat-rail-collapsed' : '')
              }
            >
              <button
                className="chat-rail-collapse-button"
                onClick={() => setGatedAccessCollapsed((value) => !value)}
                type="button"
              >
                <span>Gated Access</span>
                <strong>{gatedAccessCollapsed ? '+' : '−'}</strong>
              </button>

              {!gatedAccessCollapsed ? (
                <div className="chat-rail-panel-body">
                  <div className="profile-panel-heading">
                    <h2>Passport Gates</h2>
                    <p>Proof-based access for verified rooms, holder chats, and guild areas.</p>
                  </div>

                  <div className="gated-access-mini-list">
                    <span>Wallet linked</span>
                    <span>SuiNS verified</span>
                    <span>Guild standing clear</span>
                  </div>

                  <button
                    className="profile-secondary-link chat-rail-action-button"
                    onClick={() => props.onNavigate('passport')}
                    type="button"
                  >
                    Passport
                  </button>
                </div>
              ) : null}
            </section>

            <section
              className={
                'chat-filter-panel chat-rail-collapsible-panel' +
                (filtersCollapsed ? ' is-chat-rail-collapsed' : '')
              }
            >
              <button
                className="chat-rail-collapse-button"
                onClick={() => setFiltersCollapsed((value) => !value)}
                type="button"
              >
                <span>Filters</span>
                <strong>{filtersCollapsed ? '+' : '−'}</strong>
              </button>

              {!filtersCollapsed ? (
                <div className="chat-rail-panel-body filter-options-stack">
                  <label>
                    <input checked={hideNpc} onChange={(event) => setHideNpc(event.target.checked)} type="checkbox" />
                    Hide NPCs
                  </label>

                  <label>
                    <input checked={hideRed} onChange={(event) => setHideRed(event.target.checked)} type="checkbox" />
                    Hide Red Signal
                  </label>

                  <label>
                    <input
                      checked={proEliteOnly}
                      onChange={(event) => setProEliteOnly(event.target.checked)}
                      type="checkbox"
                    />
                    Pro / Elite only
                  </label>
                </div>
              ) : null}
            </section>

            <section
              className={
                'adult-language-settings-panel chat-rail-collapsible-panel' +
                (adultLanguageCollapsed ? ' is-chat-rail-collapsed' : '')
              }
            >
              <button
                className="chat-rail-collapse-button"
                onClick={() => setAdultLanguageCollapsed((value) => !value)}
                type="button"
              >
                <span>Language</span>
                <strong>{adultLanguageCollapsed ? '+' : '−'}</strong>
              </button>

              {!adultLanguageCollapsed ? (
                <div className="chat-rail-panel-body">
                  <div className="profile-panel-heading">
                    <h2>Adult Language</h2>
                    <p>Channel owner moderation setting. Default behavior is censoring.</p>
                  </div>

                  <div className="adult-language-control">
                    <strong>Mode</strong>

                    <div className="adult-language-mode-row">
                      {(['censor', 'filter', 'show'] as const).map((mode) => (
                        <button
                          className={adultLanguageMode === mode ? 'is-active-adult-mode' : ''}
                          key={mode}
                          onClick={() => setAdultLanguageMode(mode)}
                          type="button"
                        >
                          {mode === 'censor' ? 'Censor' : mode === 'filter' ? 'Filter' : 'Show'}
                        </button>
                      ))}
                    </div>

                    <small>Censor masks matching words. Filter removes matching messages.</small>
                  </div>
                </div>
              ) : null}
            </section>

            <section
              className={
                'chat-customization-panel chat-rail-collapsible-panel' +
                (customizationCollapsed ? ' is-chat-rail-collapsed is-collapsed-customization' : '')
              }
            >
              <button
                className="chat-rail-collapse-button"
                onClick={() => setCustomizationCollapsed((value) => !value)}
                type="button"
              >
                <span>Chat Style</span>
                <strong>{customizationCollapsed ? '+' : '−'}</strong>
              </button>

              {!customizationCollapsed ? (
                <div className="chat-rail-panel-body chat-customization-body chat-style-body">
                  <div className="profile-panel-heading">
                    <h2>Chat Box Style</h2>
                    <p>Use channel-approved accents and future earned cosmetic rewards.</p>
                  </div>

                  <div className="chat-style-brand-card">
                    <span
                      style={{
                        background:
                          'linear-gradient(135deg, ' +
                          props.channelBrandTheme.primary +
                          ', ' +
                          props.channelBrandTheme.secondary +
                          ')',
                      }}
                    />
                    <div>
                      <strong>{props.channelBrandTheme.label}</strong>
                      <small>Channel-approved accent</small>
                    </div>
                  </div>

                  {canEquipOverlays ? (
                    <ChatOverlayEquipPicker
                      member={selfChatMember}
                      onSelect={(overlayId) => {
                        saveEquippedChatOverlay(overlayId);
                      }}
                      selectedOverlayId={equippedChatOverlayId}
                    />
                  ) : (
                    <div className="customization-note">
                      Verify your passport to equip earned chat borders in Profile Edit.
                    </div>
                  )}

                  <div className="customization-note">
                    Chat borders scale with your message size. Owner brand colors stay in Settings.
                  </div>
                </div>
              ) : null}
            </section>
          </aside>
        </div>
      </section>
    </section>
  );
}