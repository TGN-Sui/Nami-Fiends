import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';

import { ChatComposerWithEmojis } from './ChatComposerWithEmojis.js';
import { ChatWindowExpandable } from './ChatWindowExpandable.js';

import {
  canSendChatMessages,
  messageBubbleClass,
  readSignedInOwner,
  resolveMessageAuthorMember,
} from './member-access.js';
import { memberPassportTierLabel } from './owner-passport-display.js';
import { useSelfMember } from './member-avatar-store.js';
import {
  chatMemberCardTierClass,
  ConductSignalDot,
  UniformMemberAvatar,
  UniformMemberAvatarButton,
} from './member-avatar.js';
import {
  canEditGuildEvent,
  createGuildEvent,
  getGuildEvents,
  markGuildSeen,
  updateGuildEvent,
  useGuildEventsStore,
  type StoredGuildEvent,
} from './guild-events-store.js';
import { appendGuildChatMessage, readGuildChatMessages } from './messages-store.js';
import {
  useChatAutoScroll,
  useChatViewportPause,
  useFrozenChatMessages,
  usePausedMessagesStoreSignal,
} from './use-chat-viewport.js';
import { MemberPassportCarousel } from './MemberPassportCarousel.js';
import {
  cofounderPendingGuildApprovals,
  creatorPendingGuildProposals,
  formatGuildCreationCooldownRemaining,
  getCreatedGuildRecords,
  getGuildCreationCooldown,
  membersEligibleForGuildCreation,
  pendingCofounderApprovalsForProposal,
  respondToGuildCreationProposal,
  submitGuildCreationProposal,
  useGuildCreationStore,
} from './guild-creation-store.js';
import {
  canGuildMember,
  GUILD_RANK_PERMISSION_SHORT_LABELS,
  getGuildHierarchy,
  getGuildMasterMemberId,
  isGuildMaster,
  managedMembersForGuild,
  rankTitleForMember,
  relinquishGuildMaster,
  removeGuildMember,
  setGuildMemberRank,
  setGuildRankPermission,
  updateGuildRankTitles,
  useGuildHierarchyStore,
  type GuildRankPermissionKey,
} from './guild-hierarchy-store.js';
import { canFoundNewGuild, canLeadSquadInvites, canUseGuildLeadershipTools } from './guild-space-access.js';
import {
  invitableGuildsForTarget,
  sendGuildInvite,
  useGuildInvites,
} from './guild-invites-store.js';
import {
  availableSquadInviteSlots,
  invitableSquadsForMember,
  membersEligibleForSquadInvite,
  sendSquadInvite,
  squadSlotsFromMembership,
  useSquadRosterStore,
} from './squad-roster-store.js';
import {
  resolveMemberGuildAffiliations,
  resolveMemberSquadAffiliations,
  type GuildAffiliationItem,
  type SquadAffiliationItem,
} from './affiliation-provider.js';
import {
  guildMaxMembers,
  membersForSquad,
  type NamiGuildRecord,
  type NamiSquadRecord,
} from './nami-affiliations.js';
import type { GuildCardView, SquadCardView } from './protocol.js';
import {
  canRequestToJoinGuild,
  effectiveGuildMemberIds,
  submitGuildJoinRequest,
} from './guild-join-requests-store.js';
import { searchMemberPredictions } from './member-search.js';
import { tagSuggestionHint } from './nami-tag-registry.js';
import { TaggedMessageBody, type TagNavigationHandlers } from './TaggedMessageBody.js';
import { members, type NamiMember, type NamiPage } from './uiMockData.js';

function guildRosterMembers(guild: NamiGuildRecord): NamiMember[] {
  const removed = new Set(getGuildHierarchy(guild).removedMemberIds);
  const memberIds = effectiveGuildMemberIds(guild).filter((memberId) => !removed.has(memberId));

  return memberIds
    .map((memberId) => members.find((member) => member.id === memberId))
    .filter((member): member is NamiMember => Boolean(member));
}

function MemberSearchPredictions(props: {
  query: string;
  candidates: NamiMember[];
  onSelect: (member: NamiMember) => void;
  selectedMemberIds?: string[];
}): ReactElement | null {
  const predictions = useMemo(
    () => searchMemberPredictions(props.query, props.candidates, 6),
    [props.candidates, props.query]
  );

  if (predictions.length === 0) {
    return null;
  }

  return (
    <div className="member-search-predictions" role="listbox">
      <p className="member-search-predictions-label">Suggested members</p>
      {predictions.map((member) => {
        const selected = props.selectedMemberIds?.includes(member.id) ?? false;

        return (
          <button
            className={'member-search-prediction-row' + (selected ? ' is-selected' : '')}
            key={member.id}
            onClick={() => props.onSelect(member)}
            role="option"
            type="button"
          >
            <UniformMemberAvatar member={member} />
            <div>
              <strong>{member.name}</strong>
              <span>
                {member.tier} · {member.badge}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function readMemberSignalReview(memberId: string, fallbackSignal: NamiMember['signal']): NamiMember['signal'] {
  try {
    const stored = window.localStorage.getItem('nami-member-signal-reviews');

    if (!stored) {
      return fallbackSignal;
    }

    const parsed = JSON.parse(stored) as Record<string, NamiMember['signal']>;

    return parsed[memberId] ?? fallbackSignal;
  } catch {
    return fallbackSignal;
  }
}

function GuildChatPanel(props: {
  guild: NamiGuildRecord;
  onOpenMember: (member: NamiMember) => void;
  tagHandlers?: TagNavigationHandlers;
}): ReactElement {
  const selfMember = useSelfMember();
  const connectedOwner = readSignedInOwner();
  const { paused, resumeCount, viewportRef, messageStackRef } = useChatViewportPause();
  const storeSignal = usePausedMessagesStoreSignal(paused);
  const guildMembers = useMemo(() => guildRosterMembers(props.guild), [props.guild]);
  const computeMessages = useCallback(
    () => readGuildChatMessages(props.guild.id),
    [props.guild.id]
  );
  const messages = useFrozenChatMessages(paused, resumeCount, storeSignal, computeMessages);
  const [draft, setDraft] = useState('');
  const canSend = canSendChatMessages();
  const visibleMembers = guildMembers.filter((member) => member.signal !== 'Black').slice(0, 6);

  useChatAutoScroll(messageStackRef, {
    paused,
    resumeCount,
    messageCount: messages.length,
  });

  function sendMessage(): void {
    if (!canSend || !draft.trim()) {
      return;
    }

    appendGuildChatMessage(props.guild.id, props.guild.name, draft);
    setDraft('');
  }

  return (
    <section className="guild-space-chat-section" ref={viewportRef}>
      <div className="chat-presence-rail">
        <div className="chat-presence-channel is-hub-chat-presence-channel">
          <div className="global-chat-presence-copy is-centered-hub-chat-heading">
            <h2>{props.guild.name}</h2>
            <p>
              {props.guild.isPublic ? 'Public guild room' : 'Private guild room'} ·{' '}
              {guildMembers.length} members online
            </p>
          </div>
        </div>

        <div className="chat-member-strip">
          {visibleMembers.map((member) => (
            <button
              className={'chat-member-card' + chatMemberCardTierClass(member)}
              key={member.id}
              onClick={() => props.onOpenMember(member)}
              type="button"
            >
              <UniformMemberAvatar member={member} />
              <strong>{member.name}</strong>
              <span>{memberPassportTierLabel(member, connectedOwner)}</span>
            </button>
          ))}
        </div>
      </div>

      <ChatWindowExpandable>
        <div className="chat-window-heading">
          <div>
            <h2>{props.guild.name} Guild Chat</h2>
            <p>{messages.length} messages · guild member room</p>
          </div>
        </div>

        <div className="message-stack guild-message-stack" ref={messageStackRef}>
          {messages.length === 0 ? (
            <p className="guild-chat-empty-copy">Start the guild conversation — tag squads with % and guilds with &.</p>
          ) : null}

          {messages.map((message) => {
            const member = resolveMessageAuthorMember(message, selfMember, guildMembers);

            return (
              <div className="chat-message-row" key={message.id}>
                {member ? (
                  <UniformMemberAvatarButton
                    member={member}
                    onClick={() => props.onOpenMember(member)}
                    signal={message.signal}
                  />
                ) : (
                  <span className="message-avatar">??</span>
                )}

                <div className={'message-bubble' + messageBubbleClass(member, message.author)}>
                  <div className="message-meta">
                    <button
                      className={'message-author-button signal-text-' + message.signal.toLowerCase()}
                      onClick={() => member && props.onOpenMember(member)}
                      type="button"
                    >
                      {message.author}
                    </button>
                    <span>{message.time}</span>
                    <ConductSignalDot signal={message.signal} size="sm" />
                  </div>
                  <p>
                    <TaggedMessageBody
                      body={message.body}
                      {...(props.tagHandlers ? { handlers: props.tagHandlers } : {})}
                    />
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <ChatComposerWithEmojis
          ariaLabel={'Message ' + props.guild.name + ' guild chat'}
          canSend={canSend}
          className="chat-composer-row guild-chat-composer"
          onChange={setDraft}
          onSend={sendMessage}
          placeholder={
            canSend
              ? 'Message the guild room… · ' + tagSuggestionHint()
              : 'Sign in and verify to send guild messages'
          }
          value={draft}
        />
      </ChatWindowExpandable>
    </section>
  );
}

export function GuildEventEditorCard(props: {
  event: StoredGuildEvent;
  guildId: string;
}): ReactElement {
  const selfMember = useSelfMember();
  const canEdit = canEditGuildEvent(props.guildId, props.event, selfMember.id);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(props.event.title);
  const [description, setDescription] = useState(props.event.description);
  const [dateLabel, setDateLabel] = useState(props.event.dateLabel);
  const [status, setStatus] = useState(props.event.status);
  const [seats, setSeats] = useState(props.event.seats);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setTitle(props.event.title);
    setDescription(props.event.description);
    setDateLabel(props.event.dateLabel);
    setStatus(props.event.status);
    setSeats(props.event.seats);
  }, [props.event]);

  function saveEdits(): void {
    const updated = updateGuildEvent(
      props.guildId,
      props.event.id,
      {
        title: title.trim(),
        description: description.trim(),
        dateLabel: dateLabel.trim(),
        status: status.trim(),
        seats: seats.trim(),
      },
      selfMember.id
    );

    if (!updated) {
      setNotice('Only the event creator can edit this event.');
      return;
    }

    setNotice('Event updated.');
    setEditing(false);
  }

  return (
    <article className="channel-event-card panel guild-event-card">
      <div>
        <span className="mini-badge">{props.event.status}</span>
        {editing ? (
          <input
            aria-label="Event title"
            className="guild-event-edit-input"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        ) : (
          <h2>{props.event.title}</h2>
        )}
        {editing ? (
          <input
            aria-label="Event date"
            className="guild-event-edit-input"
            onChange={(event) => setDateLabel(event.target.value)}
            value={dateLabel}
          />
        ) : (
          <p>{props.event.dateLabel}</p>
        )}
      </div>

      {editing ? (
        <textarea
          aria-label="Event description"
          className="guild-event-edit-textarea"
          onChange={(event) => setDescription(event.target.value)}
          value={description}
        />
      ) : (
        <p>{props.event.description}</p>
      )}

      <div className="channel-event-meta-row">
        <span>{props.event.guildName}</span>
        {editing ? (
          <input
            aria-label="Event seats"
            className="guild-event-edit-input is-compact"
            onChange={(event) => setSeats(event.target.value)}
            value={seats}
          />
        ) : (
          <strong>{props.event.seats}</strong>
        )}
      </div>

      {editing ? (
        <input
          aria-label="Event status"
          className="guild-event-edit-input is-compact"
          onChange={(event) => setStatus(event.target.value)}
          value={status}
        />
      ) : null}

      {canEdit ? (
        <div className="guild-event-card-actions">
          {editing ? (
            <>
              <button className="primary-action" onClick={saveEdits} type="button">
                Save event
              </button>
              <button className="secondary-action" onClick={() => setEditing(false)} type="button">
                Cancel
              </button>
            </>
          ) : (
            <button className="secondary-action" onClick={() => setEditing(true)} type="button">
              Edit event
            </button>
          )}
        </div>
      ) : null}

      {notice ? <p className="protocol-hint">{notice}</p> : null}
    </article>
  );
}

type GuildSpaceTab = 'members' | 'hierarchy' | 'events' | 'invite';

function GuildSpaceTabBar(props: {
  activeTab: GuildSpaceTab;
  onChange: (tab: GuildSpaceTab) => void;
  showHierarchy: boolean;
  showEvents: boolean;
  showInvite: boolean;
}): ReactElement {
  const tabs: Array<{ id: GuildSpaceTab; label: string; visible: boolean }> = [
    { id: 'members', label: 'Members', visible: true },
    { id: 'hierarchy', label: 'Hierarchy', visible: props.showHierarchy },
    { id: 'events', label: 'Events', visible: props.showEvents },
    { id: 'invite', label: 'Invite', visible: props.showInvite },
  ];

  return (
    <div className="guild-space-tab-row" role="tablist">
      {tabs
        .filter((tab) => tab.visible)
        .map((tab) => (
          <button
            aria-selected={props.activeTab === tab.id}
            className={'guild-space-tab' + (props.activeTab === tab.id ? ' is-active' : '')}
            key={tab.id}
            onClick={() => props.onChange(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
    </div>
  );
}

function GuildHierarchyPanel(props: {
  guild: NamiGuildRecord;
  selfMember: NamiMember;
}): ReactElement {
  useGuildHierarchyStore();

  const hierarchy = getGuildHierarchy(props.guild);
  const roster = managedMembersForGuild(props.guild);
  const [rankTitles, setRankTitles] = useState(hierarchy.rankTitles.join(', '));
  const [notice, setNotice] = useState('');
  const isMaster = isGuildMaster(props.guild, props.selfMember.id);
  const canEditTitles = isMaster;
  const canPromote = canGuildMember(props.guild, props.selfMember.id, 'promoteMembers');
  const canDemote = canGuildMember(props.guild, props.selfMember.id, 'demoteMembers');
  const canRemove = canGuildMember(props.guild, props.selfMember.id, 'removeMembers');
  const canManagePermissions = isMaster;
  const masterId = getGuildMasterMemberId(props.guild);

  function saveRankTitles(): void {
    updateGuildRankTitles(props.guild, rankTitles.split(',').map((title) => title.trim()));
    setNotice('Guild rank titles updated.');
  }

  function handleRemoveMember(member: NamiMember): void {
    const result = removeGuildMember(props.guild, member.id);
    setNotice(result.ok ? member.name + ' removed from the guild.' : result.reason);
  }

  function promoteMember(member: NamiMember): void {
    const entry = hierarchy.memberRanks.find((rank) => rank.memberId === member.id);
    const currentRank = entry?.rankIndex ?? hierarchy.rankTitles.length - 1;

    if (currentRank <= 0) {
      setNotice(member.name + ' is already at the top rank.');
      return;
    }

    setGuildMemberRank(props.guild, member.id, currentRank - 1);
    setNotice(member.name + ' promoted to ' + hierarchy.rankTitles[currentRank - 1] + '.');
  }

  function demoteMember(member: NamiMember): void {
    const entry = hierarchy.memberRanks.find((rank) => rank.memberId === member.id);
    const currentRank = entry?.rankIndex ?? hierarchy.rankTitles.length - 1;
    const maxRank = hierarchy.rankTitles.length - 1;

    if (currentRank >= maxRank) {
      setNotice(member.name + ' is already at the lowest rank.');
      return;
    }

    setGuildMemberRank(props.guild, member.id, currentRank + 1);
    setNotice(member.name + ' demoted to ' + hierarchy.rankTitles[currentRank + 1] + '.');
  }

  function togglePermission(rankIndex: number, permission: GuildRankPermissionKey, enabled: boolean): void {
    const result = setGuildRankPermission(
      props.guild,
      rankIndex,
      permission,
      enabled,
      props.selfMember.id
    );

    setNotice(result.ok ? 'Rank permissions updated.' : result.reason);
  }

  function transferMaster(toMemberId: string): void {
    const result = relinquishGuildMaster(props.guild, toMemberId, props.selfMember.id);
    setNotice(
      result.ok
        ? 'Guild master role transferred. Your moderation controls were removed.'
        : result.reason
    );
  }

  return (
    <article className="panel guild-hierarchy-panel">
      <div className="profile-panel-heading">
        <h2>Guild Hierarchy</h2>
        <p>Only the guild master and permitted ranks can moderate the roster.</p>
      </div>

      {canEditTitles ? (
        <>
          <label className="guild-rank-title-editor">
            <span>Rank titles (comma-separated)</span>
            <input onChange={(event) => setRankTitles(event.target.value)} value={rankTitles} />
          </label>
          <button className="primary-action" onClick={saveRankTitles} type="button">
            Save rank titles
          </button>
        </>
      ) : null}

      <div className="guild-hierarchy-list">
        {roster.map((member) => (
          <div className="guild-hierarchy-row" key={member.id}>
            <div className="guild-hierarchy-member">
              <UniformMemberAvatar member={member} />
              <div>
                <strong>{member.name}</strong>
                <span>{rankTitleForMember(props.guild, member.id)}</span>
              </div>
            </div>

            {member.id === masterId ? (
              <span className="mini-badge">Guild Master</span>
            ) : canPromote || canDemote || canRemove ? (
              <div className="guild-hierarchy-actions">
                {canPromote ? (
                  <button className="secondary-action" onClick={() => promoteMember(member)} type="button">
                    Promote
                  </button>
                ) : null}
                {canDemote ? (
                  <button className="secondary-action" onClick={() => demoteMember(member)} type="button">
                    Demote
                  </button>
                ) : null}
                {canRemove ? (
                  <button className="secondary-action" onClick={() => handleRemoveMember(member)} type="button">
                    Remove
                  </button>
                ) : null}
              </div>
            ) : (
              <span className="mini-badge">Member</span>
            )}
          </div>
        ))}
      </div>

      {canManagePermissions ? (
        <details className="guild-rank-permissions-compact">
          <summary>Rank permissions</summary>
          <div className="guild-rank-permissions-table-wrap">
            <table className="guild-rank-permissions-table">
              <thead>
                <tr>
                  <th scope="col">Permission</th>
                  {hierarchy.rankPermissions
                    .filter((entry) => entry.rankIndex > 0)
                    .map((entry) => (
                      <th key={entry.rankIndex} scope="col">
                        {hierarchy.rankTitles[entry.rankIndex]}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {(Object.keys(GUILD_RANK_PERMISSION_SHORT_LABELS) as GuildRankPermissionKey[]).map(
                  (permission) => (
                    <tr key={permission}>
                      <th scope="row">{GUILD_RANK_PERMISSION_SHORT_LABELS[permission]}</th>
                      {hierarchy.rankPermissions
                        .filter((entry) => entry.rankIndex > 0)
                        .map((entry) => (
                          <td key={entry.rankIndex + '-' + permission}>
                            <input
                              aria-label={
                                hierarchy.rankTitles[entry.rankIndex] +
                                ' · ' +
                                GUILD_RANK_PERMISSION_SHORT_LABELS[permission]
                              }
                              checked={entry.permissions[permission]}
                              onChange={(event) =>
                                togglePermission(entry.rankIndex, permission, event.target.checked)
                              }
                              type="checkbox"
                            />
                          </td>
                        ))}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}

      {isMaster ? (
        <details className="guild-master-transfer-compact">
          <summary>Transfer guild master</summary>
          <p>Pass master controls to a co-founder. You will lose master privileges.</p>
          <div className="guild-hierarchy-actions">
            {hierarchy.cofounderMemberIds
              .filter((memberId) => memberId !== props.selfMember.id)
              .map((memberId) => {
                const member = members.find((entry) => entry.id === memberId);

                if (!member) {
                  return null;
                }

                return (
                  <button
                    className="secondary-action"
                    key={member.id}
                    onClick={() => transferMaster(member.id)}
                    type="button"
                  >
                    Make {member.name} guild master
                  </button>
                );
              })}
          </div>
        </details>
      ) : null}

      {notice ? <p className="protocol-hint">{notice}</p> : null}
    </article>
  );
}

function GuildMemberInvitePanel(props: {
  guild: NamiGuildRecord;
  selfMember: NamiMember;
  onOpenMessage?: (memberId: string) => void;
}): ReactElement {
  useGuildInvites();
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState('');
  const candidates = useMemo(() => members.filter((member) => member.id !== props.selfMember.id), []);
  const predictions = useMemo(
    () => searchMemberPredictions(searchQuery, candidates, 6),
    [candidates, searchQuery]
  );

  function inviteMember(target: NamiMember): void {
    const result = sendGuildInvite(target, props.guild);

    if (!result.ok) {
      setNotice(result.reason);
      return;
    }

    setNotice('Guild invite sent to ' + target.name + '.');
  }

  return (
    <article className="panel guild-creation-panel">
      <div className="profile-panel-heading">
        <h2>Invite Members</h2>
        <p>Send invites to verified members for this guild space.</p>
      </div>

      <label className="guild-rank-title-editor">
        <span>Search members</span>
        <input
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Type a name, badge, or tier"
          value={searchQuery}
        />
      </label>

      <MemberSearchPredictions
        candidates={candidates.filter((member) => invitableGuildsForTarget(member.id).some((g) => g.id === props.guild.id))}
        onSelect={inviteMember}
        query={searchQuery}
      />

      <div className="guild-member-search-results">
        {predictions.map((member) => (
          <div className="guild-member-search-card is-actionable" key={member.id}>
            <UniformMemberAvatar member={member} />
            <div>
              <strong>{member.name}</strong>
              <span>
                {member.tier} · {member.badge}
              </span>
            </div>
            <button className="primary-action" onClick={() => inviteMember(member)} type="button">
              Invite
            </button>
            {props.onOpenMessage ? (
              <button
                className="secondary-action"
                onClick={() => props.onOpenMessage?.(member.id)}
                type="button"
              >
                Open message
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {notice ? <p className="protocol-hint">{notice}</p> : null}
    </article>
  );
}

export function GuildCreationPanel(props: {
  onOpenMessage?: (memberId: string) => void;
}): ReactElement {
  const selfMember = useSelfMember();
  const { proposals } = useGuildCreationStore();
  const [proposedName, setProposedName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCofounders, setSelectedCofounders] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [trackedCreatorProposalId, setTrackedCreatorProposalId] = useState<string | null>(null);

  const eligiblePool = useMemo(
    () => membersEligibleForGuildCreation([selfMember.id]),
    [selfMember.id]
  );
  const searchPredictions = useMemo(
    () => searchMemberPredictions(searchQuery, eligiblePool, 6),
    [eligiblePool, searchQuery]
  );
  const creatorPending = useMemo(
    () => creatorPendingGuildProposals(selfMember.id),
    [proposals, selfMember.id]
  );
  const cofounderPending = useMemo(
    () => cofounderPendingGuildApprovals(selfMember.id),
    [proposals, selfMember.id]
  );
  const cooldown = useMemo(() => getGuildCreationCooldown(selfMember.id), [proposals, selfMember.id]);
  const creationLocked = cooldown.blocked || creatorPending.length > 0;
  const hasApprovalQueue = cofounderPending.length > 0 || creatorPending.length > 0;
  const [formExpanded, setFormExpanded] = useState(hasApprovalQueue);
  const showCofounderPicker = searchQuery.trim().length > 0 || selectedCofounders.length > 0;

  useEffect(() => {
    if (creatorPending.length > 0) {
      setTrackedCreatorProposalId(creatorPending[0]!.id);
      return;
    }

    if (!trackedCreatorProposalId) {
      return;
    }

    const trackedProposal = proposals.find((proposal) => proposal.id === trackedCreatorProposalId);

    if (trackedProposal?.status === 'declined') {
      const declinerName = trackedProposal.cofounderMemberIds
        .map((memberId, index) =>
          trackedProposal.approvals[memberId] === 'declined'
            ? trackedProposal.cofounderNames[index]
            : null
        )
        .find((name): name is string => Boolean(name));

      setProposedName('');
      setSelectedCofounders([]);
      setSearchQuery('');
      setNotice(
        (declinerName ?? 'A co-founder') +
          ' declined ' +
          trackedProposal.proposedName +
          '. Pick new co-founders and try again.'
      );
    }

    setTrackedCreatorProposalId(null);
  }, [creatorPending, proposals, trackedCreatorProposalId]);

  if (!canFoundNewGuild(selfMember)) {
    return (
      <article className="panel">
        <p className="protocol-hint">Guild creation is unavailable for NPC members.</p>
      </article>
    );
  }

  function toggleCofounder(memberId: string): void {
    if (creationLocked) {
      return;
    }

    setSelectedCofounders((current) => {
      if (current.includes(memberId)) {
        return current.filter((entry) => entry !== memberId);
      }

      if (current.length >= 2) {
        setNotice('Select exactly two verified co-founders.');
        return current;
      }

      return [...current, memberId];
    });
  }

  function submitProposal(): void {
    const result = submitGuildCreationProposal({
      proposedName,
      isPublic,
      cofounderMemberIds: selectedCofounders,
    });

    if (!result.ok) {
      setNotice(result.reason);
      return;
    }

    setTrackedCreatorProposalId(result.proposal.id);
    setNotice(
      'Co-founder approvals sent to ' +
        result.proposal.cofounderNames.join(' and ') +
        '. Open their message threads to follow up.'
    );
    setSelectedCofounders([]);
    setProposedName('');
    setSearchQuery('');
  }

  function respondToApproval(
    proposalId: string,
    decision: 'approved' | 'declined'
  ): void {
    const result = respondToGuildCreationProposal(proposalId, selfMember.id, decision);

    if (!result.ok) {
      setNotice(result.reason);
      return;
    }

    if (result.proposal.status === 'finalized') {
      setNotice(result.proposal.proposedName + ' is live — all co-founders approved.');
      return;
    }

    if (result.proposal.status === 'declined') {
      setNotice('You declined the guild creation proposal.');
      return;
    }

    setNotice('Approval recorded. Waiting on remaining co-founders.');
  }

  return (
    <article className="panel guild-creation-panel is-compact">
      {cooldown.blocked ? (
        <p className="protocol-hint guild-creation-cooldown-notice">
          Paused for {formatGuildCreationCooldownRemaining(cooldown.remainingMs)} after 3 declines.
        </p>
      ) : null}

      {cofounderPending.map((proposal) => (
        <article className="guild-creation-pending-card is-actionable is-compact" key={proposal.id}>
          <div className="guild-creation-pending-copy">
            <strong>{proposal.creatorName}</strong>
            <span>
              {proposal.proposedName} · {proposal.isPublic ? 'public' : 'private'}
            </span>
          </div>
          <div className="guild-hierarchy-actions">
            <button
              className="primary-action"
              onClick={() => respondToApproval(proposal.id, 'approved')}
              type="button"
            >
              Approve
            </button>
            <button
              className="secondary-action"
              onClick={() => respondToApproval(proposal.id, 'declined')}
              type="button"
            >
              Decline
            </button>
            {props.onOpenMessage ? (
              <button
                className="secondary-action"
                onClick={() => props.onOpenMessage?.(proposal.creatorMemberId)}
                type="button"
              >
                Message
              </button>
            ) : null}
          </div>
        </article>
      ))}

      {creatorPending.map((proposal) => (
        <article className="guild-creation-pending-card is-compact" key={proposal.id}>
          <div className="guild-creation-pending-copy">
            <strong>{proposal.proposedName}</strong>
            <span>
              Awaiting co-founder approval · {proposal.isPublic ? 'public' : 'private'}
            </span>
          </div>
          {props.onOpenMessage ? (
            <div className="guild-creation-pending-actions">
              {pendingCofounderApprovalsForProposal(proposal).map((cofounder) => (
                <button
                  className="secondary-action guild-creation-pending-link"
                  key={cofounder.memberId}
                  onClick={() => props.onOpenMessage?.(cofounder.memberId)}
                  type="button"
                >
                  Message {cofounder.memberName}
                </button>
              ))}
            </div>
          ) : null}
        </article>
      ))}

      <details
        className="guild-creation-form-details"
        onToggle={(event) => setFormExpanded(event.currentTarget.open)}
        open={formExpanded || hasApprovalQueue}
      >
        <summary>Start a new guild</summary>

        <div className="guild-creation-inline-row">
          <input
            aria-label="Guild name"
            className="guild-creation-name-input"
            disabled={creationLocked}
            onChange={(event) => setProposedName(event.target.value)}
            placeholder="Guild name"
            value={proposedName}
          />
          <div className="guild-visibility-chips" role="group" aria-label="Guild visibility">
            <button
              className={'guild-visibility-chip' + (isPublic ? ' is-active' : '')}
              disabled={creationLocked}
              onClick={() => setIsPublic(true)}
              type="button"
            >
              Public
            </button>
            <button
              className={'guild-visibility-chip' + (!isPublic ? ' is-active' : '')}
              disabled={creationLocked}
              onClick={() => setIsPublic(false)}
              type="button"
            >
              Private
            </button>
          </div>
        </div>

        <div className="guild-creation-cofounder-row">
          <div className="guild-creation-selected-chips">
            {selectedCofounders.map((memberId) => {
              const member = members.find((entry) => entry.id === memberId);

              if (!member) {
                return null;
              }

              return (
                <button
                  className="guild-cofounder-chip"
                  disabled={creationLocked}
                  key={member.id}
                  onClick={() => toggleCofounder(member.id)}
                  type="button"
                >
                  {member.name} ×
                </button>
              );
            })}
            {selectedCofounders.length < 2 ? (
              <span className="protocol-hint">Pick {2 - selectedCofounders.length} co-founder(s)</span>
            ) : null}
          </div>

          <input
            aria-label="Search co-founders"
            className="guild-creation-search-input"
            disabled={creationLocked || selectedCofounders.length >= 2}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search co-founders…"
            value={searchQuery}
          />
        </div>

        {showCofounderPicker ? (
          <>
            <MemberSearchPredictions
              candidates={eligiblePool}
              onSelect={(member) => toggleCofounder(member.id)}
              query={searchQuery}
              selectedMemberIds={selectedCofounders}
            />
            {searchQuery.trim().length > 0 ? (
              <div className="guild-member-search-results is-compact">
                {searchPredictions.map((member) => (
                  <button
                    className={
                      'guild-member-search-card is-compact' +
                      (selectedCofounders.includes(member.id) ? ' is-selected' : '')
                    }
                    disabled={creationLocked}
                    key={member.id}
                    onClick={() => toggleCofounder(member.id)}
                    type="button"
                  >
                    <UniformMemberAvatar member={member} />
                    <span>{member.name}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : null}

        <button
          className="primary-action"
          disabled={creationLocked || selectedCofounders.length !== 2 || !proposedName.trim()}
          onClick={submitProposal}
          type="button"
        >
          Send approvals
        </button>
      </details>

      {notice ? <p className="protocol-hint">{notice}</p> : null}
    </article>
  );
}

function SquadInvitePanel(props: {
  squad: NamiSquadRecord;
  onOpenMessage?: (memberId: string) => void;
}): ReactElement {
  useSquadRosterStore();

  const selfMember = useSelfMember();
  const availableSlots = availableSquadInviteSlots(selfMember.id);
  const invitableSquads = invitableSquadsForMember(selfMember.id).filter((squad) => squad.id === props.squad.id);
  const selectedSquad = invitableSquads[0] ?? props.squad;
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState('');
  const invitePool = useMemo(() => membersEligibleForSquadInvite(selectedSquad, ''), [selectedSquad]);
  const searchPredictions = useMemo(
    () => searchMemberPredictions(searchQuery, invitePool, 6),
    [invitePool, searchQuery]
  );

  if (!canLeadSquadInvites(selfMember) || props.squad.memberIds[0] !== selfMember.id) {
    return (
      <article className="panel">
        <p className="protocol-hint">Squad invites are only available to verified squad leaders.</p>
      </article>
    );
  }

  function sendInvite(targetMember: NamiMember): void {
    const result = sendSquadInvite(selectedSquad, targetMember);
    setNotice(result.ok ? 'Approval request sent to ' + targetMember.name + ' via Messages.' : result.reason);
  }

  return (
    <article className="panel squad-invite-panel">
      <div className="profile-panel-heading">
        <h2>Invite To Squad</h2>
        <p>
          {availableSlots > 0
            ? availableSlots + ' of ' + squadSlotsFromMembership() + ' squad slots remaining.'
            : 'No squad slots available — invites are disabled.'}
        </p>
      </div>

      <label className="guild-rank-title-editor">
        <span>Search members</span>
        <input
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Type a name, badge, or tier"
          value={searchQuery}
        />
      </label>

      <MemberSearchPredictions candidates={invitePool} onSelect={sendInvite} query={searchQuery} />

      <div className="guild-member-search-results">
        {searchPredictions.map((member) => (
          <div className="guild-member-search-card is-actionable" key={member.id}>
            <UniformMemberAvatar member={member} />
            <div>
              <strong>{member.name}</strong>
              <span>
                {member.tier} · {member.badge}
              </span>
            </div>
            <button
              className="primary-action"
              disabled={availableSlots <= 0}
              onClick={() => sendInvite(member)}
              type="button"
            >
              Invite
            </button>
          </div>
        ))}
      </div>

      {notice ? <p className="protocol-hint">{notice}</p> : null}
    </article>
  );
}

type AffiliationViewMode = 'cards' | 'list';

const AFFILIATION_VIEW_KEY = 'nami.affiliation.view-mode';

function readAffiliationViewMode(): AffiliationViewMode {
  try {
    return window.localStorage.getItem(AFFILIATION_VIEW_KEY) === 'list' ? 'list' : 'cards';
  } catch {
    return 'cards';
  }
}

function writeAffiliationViewMode(mode: AffiliationViewMode): void {
  window.localStorage.setItem(AFFILIATION_VIEW_KEY, mode);
}

function AffiliationViewToggle(props: {
  mode: AffiliationViewMode;
  onChange: (mode: AffiliationViewMode) => void;
}): ReactElement {
  return (
    <div aria-label="Affiliation view mode" className="affiliation-view-toggle" role="group">
      <button
        className={'nami-surface-button' + (props.mode === 'cards' ? ' is-active-view' : '')}
        onClick={() => props.onChange('cards')}
        type="button"
      >
        Cards
      </button>
      <button
        className={'nami-surface-button' + (props.mode === 'list' ? ' is-active-view' : '')}
        onClick={() => props.onChange('list')}
        type="button"
      >
        List
      </button>
    </div>
  );
}

export function MyGuildHomeScreen(props: {
  guildLoadState: 'idle' | 'loading' | 'error' | 'ready';
  guildRows: GuildCardView[];
  guildLiveQueryEnabled: boolean;
  squadLoadState: 'idle' | 'loading' | 'error' | 'ready';
  squadRows: SquadCardView[];
  squadLiveQueryEnabled: boolean;
  protocolOwner: string | null;
  onOpenGuild: (guild: NamiGuildRecord) => void;
  onOpenSquad: (squad: NamiSquadRecord, showInvitePanel?: boolean) => void;
  onOpenMessage?: (memberId: string) => void;
}): ReactElement {
  const selfMember = useSelfMember();
  const { proposals } = useGuildCreationStore();
  const [viewMode, setViewMode] = useState<AffiliationViewMode>(() => readAffiliationViewMode());

  const squadSlotsAvailable = availableSquadInviteSlots(selfMember.id);
  const canLeadSquads = canLeadSquadInvites(selfMember);

  const guildAffiliations = useMemo(
    () =>
      resolveMemberGuildAffiliations({
        liveCards: props.guildRows,
        loadState: props.guildLoadState,
        liveQueryEnabled: props.guildLiveQueryEnabled,
        memberId: selfMember.id,
        createdGuilds: getCreatedGuildRecords(),
      }),
    [props.guildLoadState, props.guildLiveQueryEnabled, props.guildRows, proposals, selfMember.id]
  );

  const squadAffiliations = useMemo(
    () =>
      resolveMemberSquadAffiliations({
        liveCards: props.squadRows,
        loadState: props.squadLoadState,
        liveQueryEnabled: props.squadLiveQueryEnabled,
        memberId: selfMember.id,
        protocolOwner: props.protocolOwner,
      }),
    [
      props.protocolOwner,
      props.squadLoadState,
      props.squadLiveQueryEnabled,
      props.squadRows,
      selfMember.id,
    ]
  );

  function setAffiliationView(mode: AffiliationViewMode): void {
    writeAffiliationViewMode(mode);
    setViewMode(mode);
  }

  function renderGuildCards(guilds: GuildAffiliationItem[]): ReactElement {
    return (
      <section className="account-grid uniform-card-grid affiliation-card-grid">
        {guilds.map((guild) => (
          <button
            className="profile-panel account-card fixed-card guild-card is-clickable-guild-card"
            key={guild.id}
            onClick={() => props.onOpenGuild(guild.record)}
            type="button"
          >
            <div className="fixed-card-body">
              <div className="guild-card-icon guild-icon-green">{guild.title.slice(0, 2).toUpperCase()}</div>
              <div className="fixed-card-copy">
                <h2>{guild.title}</h2>
                <p>{guild.subtitle}</p>
              </div>
            </div>
            <div className="fixed-card-footer">
              <span className="guild-signal-pill guild-signal-green">
                {guild.isPublic ? 'Public' : 'Private'} · {guild.memberCount} members
              </span>
              <span className="mini-badge">{guild.badgeLabel}</span>
            </div>
          </button>
        ))}
      </section>
    );
  }

  function renderGuildList(guilds: GuildAffiliationItem[]): ReactElement {
    const showSourceColumn = guilds.some((guild) => guild.source === 'live');

    return (
      <div className="affiliation-list-wrap">
        <table className="affiliation-list-table">
          <thead>
            <tr>
              <th scope="col">Guild</th>
              <th scope="col">Visibility</th>
              <th scope="col">Members</th>
              {showSourceColumn ? <th scope="col">Source</th> : null}
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {guilds.map((guild) => (
              <tr key={guild.id}>
                <td>
                  <strong>{guild.title}</strong>
                  {guild.source === 'live' ? (
                    <span className="affiliation-list-subtitle">{guild.subtitle}</span>
                  ) : null}
                </td>
                <td>{guild.isPublic ? 'Public' : 'Private'}</td>
                <td>{guild.memberCount}</td>
                {showSourceColumn ? <td>{guild.source === 'live' ? guild.badgeLabel : '—'}</td> : null}
                <td>
                  <div className="affiliation-list-actions">
                    <button
                      className="secondary-action"
                      onClick={() => props.onOpenGuild(guild.record)}
                      type="button"
                    >
                      Open
                    </button>
                    <span aria-hidden="true" className="affiliation-list-action-spacer" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderSquadCards(squads: SquadAffiliationItem[]): ReactElement {
    return (
      <section className="account-grid uniform-card-grid affiliation-card-grid">
        {squads.map((squad) => (
          <article className="profile-panel account-card fixed-card guild-card affiliation-squad-card" key={squad.id}>
            <button className="affiliation-squad-open" onClick={() => props.onOpenSquad(squad.record)} type="button">
              <div className="fixed-card-body">
                <div className="guild-card-icon guild-icon-orange">{squad.title.slice(0, 2).toUpperCase()}</div>
                <div className="fixed-card-copy">
                  <h2>{squad.title}</h2>
                  <p>
                    {squad.memberCount}/{squad.maxSlots} slots
                  </p>
                </div>
              </div>
              <div className="fixed-card-footer">
                <span className="guild-signal-pill guild-signal-orange">{squad.roleLabel}</span>
                <span className="mini-badge">{squad.badgeLabel}</span>
              </div>
            </button>
            {squad.isLeader && canLeadSquads ? (
              <button
                className="secondary-action affiliation-squad-invite-btn"
                disabled={squadSlotsAvailable <= 0}
                onClick={() => props.onOpenSquad(squad.record, true)}
                type="button"
              >
                Invite
              </button>
            ) : null}
          </article>
        ))}
      </section>
    );
  }

  function renderSquadList(squads: SquadAffiliationItem[]): ReactElement {
    const showSourceColumn = squads.some((squad) => squad.source === 'live');

    return (
      <div className="affiliation-list-wrap">
        <table className="affiliation-list-table">
          <thead>
            <tr>
              <th scope="col">Squad</th>
              <th scope="col">Slots</th>
              <th scope="col">Your role</th>
              {showSourceColumn ? <th scope="col">Source</th> : null}
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {squads.map((squad) => (
              <tr key={squad.id}>
                <td>
                  <strong>{squad.title}</strong>
                </td>
                <td>
                  {squad.memberCount}/{squad.maxSlots}
                </td>
                <td>{squad.roleLabel}</td>
                {showSourceColumn ? <td>{squad.source === 'live' ? squad.badgeLabel : '—'}</td> : null}
                <td>
                  <div className="affiliation-list-actions">
                    <button className="secondary-action" onClick={() => props.onOpenSquad(squad.record)} type="button">
                      Open
                    </button>
                    {squad.isLeader && canLeadSquads ? (
                      <button
                        className="secondary-action"
                        disabled={squadSlotsAvailable <= 0}
                        onClick={() => props.onOpenSquad(squad.record, true)}
                        type="button"
                      >
                        Invite
                      </button>
                    ) : (
                      <span aria-hidden="true" className="affiliation-list-action-spacer" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const guildCount = guildAffiliations.length;
  const squadCount = squadAffiliations.length;

  return (
    <div className="my-guild-home">
      <header className="page-title">
        <p>Your memberships</p>
        <h1>Squads &amp; Guilds</h1>
      </header>

      <div className="affiliation-toolbar">
        <p className="protocol-hint">
          {guildCount} guild{guildCount === 1 ? '' : 's'} · {squadCount} squad{squadCount === 1 ? '' : 's'}
          {canLeadSquads && squadSlotsAvailable > 0
            ? ' · ' + squadSlotsAvailable + ' invite slot' + (squadSlotsAvailable === 1 ? '' : 's')
            : ''}
        </p>
        <AffiliationViewToggle mode={viewMode} onChange={setAffiliationView} />
      </div>

      {props.guildLoadState === 'loading' || props.squadLoadState === 'loading' ? (
        <p className="protocol-hint">Loading indexed guild memberships…</p>
      ) : null}

      {props.guildLoadState === 'error' ? (
        <p className="protocol-hint">Could not load guild projections. Showing local memberships.</p>
      ) : null}

      {props.squadLoadState === 'error' ? (
        <p className="protocol-hint">Could not load squad projections. Showing local memberships.</p>
      ) : null}

      <section className="affiliation-section">
        <header className="affiliation-section-heading">
          <h2>Guilds</h2>
          <span className="mini-badge">{guildCount}</span>
        </header>
        {guildCount === 0 ? (
          <p className="protocol-hint">You are not in a guild yet.</p>
        ) : viewMode === 'cards' ? (
          renderGuildCards(guildAffiliations)
        ) : (
          renderGuildList(guildAffiliations)
        )}
      </section>

      <section className="affiliation-section">
        <header className="affiliation-section-heading">
          <h2>Squads</h2>
          <span className="mini-badge">{squadCount}</span>
        </header>
        {squadCount === 0 ? (
          <p className="protocol-hint">You are not in a squad yet.</p>
        ) : viewMode === 'cards' ? (
          renderSquadCards(squadAffiliations)
        ) : (
          renderSquadList(squadAffiliations)
        )}
      </section>

      {canUseGuildLeadershipTools(selfMember) ? (
        <section className="affiliation-section affiliation-leadership-section">
          <header className="affiliation-section-heading">
            <h2>Guild founding</h2>
          </header>
          <GuildCreationPanel {...(props.onOpenMessage ? { onOpenMessage: props.onOpenMessage } : {})} />
        </section>
      ) : null}
    </div>
  );
}

export function GuildDetailScreen(props: {
  guild: NamiGuildRecord;
  onNavigate: (page: NamiPage) => void;
  onOpenMember: (member: NamiMember) => void;
  onOpenMessage?: (memberId: string) => void;
  tagHandlers?: TagNavigationHandlers;
}): ReactElement {
  useGuildEventsStore();
  useGuildHierarchyStore();

  const selfMember = useSelfMember();
  const guildMembers = useMemo(() => guildRosterMembers(props.guild), [props.guild]);
  const masterMember = members.find((member) => member.id === getGuildMasterMemberId(props.guild));
  const [eventTitle, setEventTitle] = useState('');
  const [createNotice, setCreateNotice] = useState('');
  const [joinNotice, setJoinNotice] = useState('');
  const [activeTab, setActiveTab] = useState<GuildSpaceTab>('members');
  const guildEvents = getGuildEvents(props.guild.id);
  const isMember = guildMembers.some((member) => member.id === selfMember.id);
  const canJoinRequest = canRequestToJoinGuild(props.guild, selfMember.id);
  const showHierarchy =
    isMember &&
    canUseGuildLeadershipTools(selfMember) &&
    isGuildMaster(props.guild, selfMember.id);
  const showEvents =
    isMember &&
    canUseGuildLeadershipTools(selfMember) &&
    isGuildMaster(props.guild, selfMember.id);
  const showInvite =
    canUseGuildLeadershipTools(selfMember) &&
    canGuildMember(props.guild, selfMember.id, 'inviteMembers');

  useEffect(() => {
    markGuildSeen(props.guild.id);
  }, [props.guild.id]);

  function handleCreateEvent(): void {
    if (!eventTitle.trim()) {
      return;
    }

    const created = createGuildEvent(props.guild, eventTitle, selfMember.id);

    if (!created) {
      setCreateNotice('Only the guild master can create guild events.');
      return;
    }

    setEventTitle('');
    setCreateNotice('Guild event created. Members were notified via My Guild.');
  }

  return (
    <>
      <header className="page-title">
        <p>Guild space</p>
        <h1>{props.guild.name}</h1>
      </header>

      <section className="guild-detail-page">
        <article className="panel guild-detail-hero">
          <div className="guild-detail-hero-copy">
            <span className="mini-badge">{props.guild.isPublic ? 'Public Guild' : 'Private Guild'}</span>
            <h2>{props.guild.name}</h2>
            <p>
              {guildMembers.length} members · cap {guildMaxMembers(props.guild)}
              {masterMember ? ' · guild master ' + masterMember.name : ''}
            </p>
          </div>

          <div className="guild-detail-hero-actions">
            <button className="secondary-action" onClick={() => props.onNavigate('guilds')} type="button">
              Back to My Guild
            </button>
            {!isMember && props.guild.isPublic ? (
              <button
                className="primary-action"
                disabled={!canJoinRequest || !canUseGuildLeadershipTools(selfMember)}
                onClick={() => {
                  const result = submitGuildJoinRequest(props.guild);

                  if (!result.ok) {
                    setJoinNotice(result.reason);
                    return;
                  }

                  setJoinNotice('Join request sent to ' + props.guild.name + ' leadership.');
                }}
                type="button"
              >
                Request to Join
              </button>
            ) : null}
            {!isMember && !props.guild.isPublic ? (
              <span className="mini-badge">Private guild · invite only</span>
            ) : null}
          </div>
        </article>

        {joinNotice ? <p className="protocol-hint">{joinNotice}</p> : null}

        {showHierarchy || showEvents || showInvite ? (
          <GuildSpaceTabBar
            activeTab={activeTab}
            onChange={setActiveTab}
            showEvents={showEvents}
            showHierarchy={showHierarchy}
            showInvite={showInvite}
          />
        ) : null}

        {activeTab === 'members' ? (
          <>
            <MemberPassportCarousel
              members={guildMembers}
              onOpenMember={props.onOpenMember}
              resolveSignal={(member) => readMemberSignalReview(member.id, member.signal)}
            />
            <GuildChatPanel
              guild={props.guild}
              onOpenMember={props.onOpenMember}
              {...(props.tagHandlers ? { tagHandlers: props.tagHandlers } : {})}
            />
          </>
        ) : null}

        {activeTab === 'hierarchy' && showHierarchy ? (
          <GuildHierarchyPanel guild={props.guild} selfMember={selfMember} />
        ) : null}

        {activeTab === 'events' && showEvents ? (
          <article className="panel guild-detail-events-panel">
            <div className="profile-panel-heading">
              <h2>Guild Events</h2>
              <p>Events notify members through the My Guild sidebar button.</p>
            </div>

            <div className="channel-event-grid">
              {guildEvents.map((event) => (
                <GuildEventEditorCard event={event} guildId={props.guild.id} key={event.id} />
              ))}
            </div>

            <div className="guild-owner-create-event">
              <input
                aria-label="New guild event title"
                onChange={(event) => setEventTitle(event.target.value)}
                placeholder="New guild event title"
                value={eventTitle}
              />
              <button
                className="primary-action"
                disabled={!eventTitle.trim()}
                onClick={handleCreateEvent}
                type="button"
              >
                Create guild event
              </button>
            </div>

            {createNotice ? <p className="protocol-hint">{createNotice}</p> : null}
          </article>
        ) : null}

        {activeTab === 'invite' && showInvite ? (
          <GuildMemberInvitePanel
            guild={props.guild}
            selfMember={selfMember}
            {...(props.onOpenMessage ? { onOpenMessage: props.onOpenMessage } : {})}
          />
        ) : null}
      </section>
    </>
  );
}

export function SquadDetailScreen(props: {
  squad: NamiSquadRecord;
  onNavigate: (page: NamiPage) => void;
  onOpenMember: (member: NamiMember) => void;
  onOpenMessage?: (memberId: string) => void;
  showInvitePanel?: boolean;
}): ReactElement {
  const selfMember = useSelfMember();
  const squadMembers = useMemo(() => membersForSquad(props.squad), [props.squad]);
  const isLeader = props.squad.memberIds[0] === selfMember.id;
  const [activeTab, setActiveTab] = useState<'roster' | 'invite'>(
    props.showInvitePanel && isLeader && canLeadSquadInvites(selfMember) ? 'invite' : 'roster'
  );
  const showInviteTab = isLeader && canLeadSquadInvites(selfMember);

  return (
    <>
      <header className="page-title">
        <p>Squad space</p>
        <h1>{props.squad.name}</h1>
      </header>

      <section className="guild-detail-page">
        <article className="panel guild-detail-hero">
          <div className="guild-detail-hero-copy">
            <span className="mini-badge guild-signal-pill guild-signal-orange">Squad</span>
            <h2>{props.squad.name}</h2>
            <p>
              {squadMembers.length}/{props.squad.maxSlots} slots filled
            </p>
          </div>

          <button className="secondary-action" onClick={() => props.onNavigate('guilds')} type="button">
            Back to My Guild
          </button>
        </article>

        {showInviteTab ? (
          <div className="guild-space-tab-row" role="tablist">
            <button
              className={'guild-space-tab' + (activeTab === 'roster' ? ' is-active' : '')}
              onClick={() => setActiveTab('roster')}
              type="button"
            >
              Roster
            </button>
            <button
              className={'guild-space-tab' + (activeTab === 'invite' ? ' is-active' : '')}
              onClick={() => setActiveTab('invite')}
              type="button"
            >
              Invite
            </button>
          </div>
        ) : null}

        {activeTab === 'roster' ? (
          <MemberPassportCarousel
            members={squadMembers}
            onOpenMember={props.onOpenMember}
            resolveSignal={(member) => readMemberSignalReview(member.id, member.signal)}
          />
        ) : (
          <SquadInvitePanel
            squad={props.squad}
            {...(props.onOpenMessage ? { onOpenMessage: props.onOpenMessage } : {})}
          />
        )}
      </section>
    </>
  );
}

