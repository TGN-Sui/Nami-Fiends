import { useMemo, useState, type ReactElement } from 'react';

import { useChannelDirectory } from './channel-directory-provider.js';
import { useMemberDirectory } from './member-directory-provider.js';
import { OwnerHubItemControls } from './OwnerHubItemControls.js';
import { isOfficialOwner } from './nami-capabilities.js';
import { dedupeChannelsByIdentity } from './local-channel-directory.js';
import {
  addCommunityGrowthChannel,
  addMemberSpotlightMember,
  COMMUNITY_GROWTH_DISPLAY_LIMIT,
  MEMBER_SPOTLIGHT_DISPLAY_LIMIT,
  moveCommunityGrowthChannel,
  moveMemberSpotlightMember,
  readOwnerHubCuration,
  removeCommunityGrowthChannel,
  removeMemberSpotlightMember,
  resetCommunityGrowthCuration,
  resetMemberSpotlightCuration,
  useOwnerHubCuration,
} from './owner-hub-curation-store.js';
import { channels as seedChannels } from './uiMockData.js';
import { useProtocolOwner } from './wallet.js';

function channelHandle(handle: string): string {
  return handle.startsWith('@') ? handle : '@' + handle;
}

export function OwnerHubCurationPanel(): ReactElement | null {
  const { owner } = useProtocolOwner();
  const curation = useOwnerHubCuration();
  const { channels: directoryChannels } = useChannelDirectory(80);
  const { members: directoryMembers } = useMemberDirectory();
  const [selectedGrowthChannelId, setSelectedGrowthChannelId] = useState('');
  const [selectedSpotlightMemberId, setSelectedSpotlightMemberId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCurate = isOfficialOwner(owner);

  const channelLookup = useMemo(() => {
    const map = new Map<string, (typeof directoryChannels)[number]>();

    for (const channel of [...directoryChannels, ...seedChannels]) {
      map.set(channel.id, channel);
    }

    return map;
  }, [directoryChannels]);

  const memberLookup = useMemo(() => {
    const map = new Map<string, (typeof directoryMembers)[number]>();

    for (const member of directoryMembers) {
      map.set(member.id, member);
    }

    return map;
  }, [directoryMembers]);

  const curatedGrowthChannels = useMemo(
    () =>
      dedupeChannelsByIdentity(
        curation.communityGrowthChannelIds
          .map((channelId) => channelLookup.get(channelId))
          .filter((channel): channel is NonNullable<typeof channel> => channel !== undefined),
      ),
    [curation.communityGrowthChannelIds, channelLookup]
  );

  const curatedSpotlightMembers = useMemo(
    () =>
      curation.memberSpotlightMemberIds
        .map((memberId) => memberLookup.get(memberId))
        .filter((member): member is NonNullable<typeof member> => member !== undefined),
    [curation.memberSpotlightMemberIds, memberLookup]
  );

  const availableGrowthChannels = useMemo(() => {
    const curatedKeys = new Set(
      curation.communityGrowthChannelIds
        .map((channelId) => channelLookup.get(channelId))
        .filter((channel): channel is NonNullable<typeof channel> => channel !== undefined)
        .map((channel) => channel.handle.replace(/^@+/, '').toLowerCase()),
    );

    return dedupeChannelsByIdentity([...directoryChannels, ...seedChannels]).filter((channel) => {
      const handleKey = channel.handle.replace(/^@+/, '').toLowerCase();
      return !curatedKeys.has(handleKey);
    });
  }, [channelLookup, curation.communityGrowthChannelIds, directoryChannels]);

  const availableSpotlightMembers = useMemo(() => {
    const curatedIds = new Set(curation.memberSpotlightMemberIds);

    return directoryMembers.filter(
      (member) =>
        !curatedIds.has(member.id) && member.tier !== 'NPC' && member.signal !== 'Black'
    );
  }, [curation.memberSpotlightMemberIds, directoryMembers]);

  if (!canCurate) {
    return null;
  }

  function clearMessages(): void {
    setNotice(null);
    setError(null);
  }

  function handleAddGrowthChannel(): void {
    clearMessages();

    if (!selectedGrowthChannelId) {
      setError('Select a channel to add.');
      return;
    }

    const added = addCommunityGrowthChannel(selectedGrowthChannelId, owner);

    if (!added) {
      setError('Could not add channel. The list may be full.');
      return;
    }

    setSelectedGrowthChannelId('');
    setNotice('Channel added to Community Growth.');
  }

  function handleAddSpotlightMember(): void {
    clearMessages();

    if (!selectedSpotlightMemberId) {
      setError('Select a member to add.');
      return;
    }

    const added = addMemberSpotlightMember(selectedSpotlightMemberId, owner);

    if (!added) {
      setError('Could not add member. The list may be full.');
      return;
    }

    setSelectedSpotlightMemberId('');
    setNotice('Member added to Member Spotlight.');
  }

  const usingCustomGrowth = readOwnerHubCuration().communityGrowthChannelIds.length > 0;
  const usingCustomSpotlight = readOwnerHubCuration().memberSpotlightMemberIds.length > 0;

  return (
    <article className="panel settings-card settings-compact-card settings-section-wide owner-hub-curation-panel">
      <div className="profile-panel-heading">
        <span className="mini-badge">Owner Account</span>
        <h2>Hub spotlight curation</h2>
        <p>
          Choose which channels appear in Community Growth and which members appear in Member
          Spotlight. Clear a list to restore the automatic rotation.
        </p>
      </div>

      <section className="owner-hub-curation-section">
        <div className="owner-hub-curation-section-heading">
          <h3>Community Growth</h3>
          <span>
            {usingCustomGrowth
              ? curatedGrowthChannels.length + ' curated channel(s)'
              : 'Using automatic subscriber ranking'}
          </span>
        </div>

        <div className="owner-hub-curation-add-row">
          <select
            className="owner-hub-curation-select"
            onChange={(event) => setSelectedGrowthChannelId(event.target.value)}
            value={selectedGrowthChannelId}
          >
            <option value="">Add channel…</option>
            {availableGrowthChannels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.name} ({channelHandle(channel.handle)})
              </option>
            ))}
          </select>
          <button
            className="onboarding-primary-btn"
            disabled={curation.communityGrowthChannelIds.length >= COMMUNITY_GROWTH_DISPLAY_LIMIT}
            onClick={handleAddGrowthChannel}
            type="button"
          >
            Add channel
          </button>
          {usingCustomGrowth ? (
            <button
              className="profile-secondary-link"
              onClick={() => {
                clearMessages();
                resetCommunityGrowthCuration(owner);
                setNotice('Community Growth restored to automatic ranking.');
              }}
              type="button"
            >
              Reset to automatic
            </button>
          ) : null}
        </div>

        {curatedGrowthChannels.length === 0 ? (
          <p className="protocol-hint">No custom Community Growth lineup yet.</p>
        ) : (
          <ul className="owner-hub-curation-list">
            {curatedGrowthChannels.map((channel, index) => (
              <li className="owner-hub-curation-row" key={channel.id}>
                <div className="owner-hub-curation-row-copy">
                  <strong>{channel.name}</strong>
                  <span>{channelHandle(channel.handle)}</span>
                  <span>{channel.subscribers.toLocaleString()} subscribers</span>
                </div>
                <OwnerHubItemControls
                  canMoveDown={index < curatedGrowthChannels.length - 1}
                  canMoveUp={index > 0}
                  onMoveDown={() => moveCommunityGrowthChannel(channel.id, 'down', owner)}
                  onMoveUp={() => moveCommunityGrowthChannel(channel.id, 'up', owner)}
                  onRemove={() => removeCommunityGrowthChannel(channel.id, owner)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="owner-hub-curation-section">
        <div className="owner-hub-curation-section-heading">
          <h3>Member Spotlight</h3>
          <span>
            {usingCustomSpotlight
              ? curatedSpotlightMembers.length + ' curated member(s)'
              : 'Using automatic daily rotation'}
          </span>
        </div>

        <div className="owner-hub-curation-add-row">
          <select
            className="owner-hub-curation-select"
            onChange={(event) => setSelectedSpotlightMemberId(event.target.value)}
            value={selectedSpotlightMemberId}
          >
            <option value="">Add member…</option>
            {availableSpotlightMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.tier})
              </option>
            ))}
          </select>
          <button
            className="onboarding-primary-btn"
            disabled={curation.memberSpotlightMemberIds.length >= MEMBER_SPOTLIGHT_DISPLAY_LIMIT}
            onClick={handleAddSpotlightMember}
            type="button"
          >
            Add member
          </button>
          {usingCustomSpotlight ? (
            <button
              className="profile-secondary-link"
              onClick={() => {
                clearMessages();
                resetMemberSpotlightCuration(owner);
                setNotice('Member Spotlight restored to automatic rotation.');
              }}
              type="button"
            >
              Reset to automatic
            </button>
          ) : null}
        </div>

        {curatedSpotlightMembers.length === 0 ? (
          <p className="protocol-hint">No custom Member Spotlight lineup yet.</p>
        ) : (
          <ul className="owner-hub-curation-list">
            {curatedSpotlightMembers.map((member, index) => (
              <li className="owner-hub-curation-row" key={member.id}>
                <div className="owner-hub-curation-row-copy">
                  <strong>{member.name}</strong>
                  <span>{member.tier} · {member.signal}</span>
                </div>
                <OwnerHubItemControls
                  canMoveDown={index < curatedSpotlightMembers.length - 1}
                  canMoveUp={index > 0}
                  onMoveDown={() => moveMemberSpotlightMember(member.id, 'down', owner)}
                  onMoveUp={() => moveMemberSpotlightMember(member.id, 'up', owner)}
                  onRemove={() => removeMemberSpotlightMember(member.id, owner)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? <p className="onboarding-field-error">{error}</p> : null}
      {notice ? <p className="protocol-hint nami-owner-action-notice">{notice}</p> : null}
    </article>
  );
}