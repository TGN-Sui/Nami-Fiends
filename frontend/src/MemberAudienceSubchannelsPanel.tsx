import { useMemo, useState, type ReactElement } from 'react';

import {
  canCreateAudienceSubchannel,
  createAudienceSubchannel,
  maxAudienceSubchannelsForMember,
  removeAudienceSubchannel,
  renameAudienceSubchannel,
  setAudienceSubchannelVoiceEnabled,
  useMemberAudienceSubchannels,
} from './member-audience-subchannels-store.js';
import { memberFeatureTier } from './member-access.js';
import type { NamiMember } from './uiMockData.js';

export function MemberAudienceSubchannelsPanel(props: {
  member: NamiMember;
  editable?: boolean;
}): ReactElement {
  const channels = useMemberAudienceSubchannels(props.member.id);
  const limit = maxAudienceSubchannelsForMember(props.member);
  const tier = memberFeatureTier(props.member);
  const [status, setStatus] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');

  const quotaLabel = useMemo(() => {
    return channels.length + ' / ' + limit + ' audience rooms';
  }, [channels.length, limit]);

  function handleCreate(): void {
    const result = createAudienceSubchannel(props.member);

    if (!result.ok) {
      setStatus(result.reason);
      return;
    }

    setStatus('Created "' + result.channel.title + '".');
  }

  function startRename(channelId: string, currentTitle: string): void {
    setEditingId(channelId);
    setDraftTitle(currentTitle);
  }

  function commitRename(channelId: string): void {
    const result = renameAudienceSubchannel(props.member.id, channelId, draftTitle);

    if (!result.ok) {
      setStatus(result.reason);
      return;
    }

    setEditingId(null);
    setDraftTitle('');
    setStatus('Renamed to "' + result.channel.title + '".');
  }

  function toggleVoice(channelId: string, enabled: boolean): void {
    const result = setAudienceSubchannelVoiceEnabled(props.member.id, channelId, enabled);

    if (!result.ok) {
      setStatus(result.reason);
      return;
    }

    setStatus(
      result.channel.voiceChatEnabled
        ? 'Voice chat enabled for "' + result.channel.title + '".'
        : 'Voice chat disabled for "' + result.channel.title + '".'
    );
  }

  return (
    <article className="panel member-audience-subchannels-panel">
      <div className="profile-panel-heading">
        <h2>Audience subchannels</h2>
        <p>
          Personal rooms for your audience. {tier} members get up to {limit} editable subchannels with
          optional voice chat.
        </p>
      </div>

      <div className="member-audience-subchannels-meta">
        <span className="mini-badge">{quotaLabel}</span>
        {props.editable && canCreateAudienceSubchannel(props.member) ? (
          <button className="nami-surface-button is-primary-surface-button" onClick={handleCreate} type="button">
            New audience room
          </button>
        ) : null}
      </div>

      {channels.length === 0 ? (
        <p className="protocol-hint">
          {limit === 0
            ? 'Upgrade to Adventurer or higher to open your first audience subchannel.'
            : 'Create a room to host your personal audience outside the main game chat.'}
        </p>
      ) : (
        <ul className="member-audience-subchannels-list">
          {channels.map((channel) => (
            <li className="member-audience-subchannel-card" key={channel.id}>
              <div className="member-audience-subchannel-heading">
                {props.editable && editingId === channel.id ? (
                  <div className="member-audience-subchannel-rename-row">
                    <input
                      aria-label="Subchannel title"
                      maxLength={48}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      value={draftTitle}
                    />
                    <button
                      className="nami-surface-button is-primary-surface-button"
                      onClick={() => commitRename(channel.id)}
                      type="button"
                    >
                      Save
                    </button>
                    <button
                      className="nami-surface-button"
                      onClick={() => {
                        setEditingId(null);
                        setDraftTitle('');
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <strong>{channel.title}</strong>
                    <span className="member-audience-subchannel-slug">{channel.slug}</span>
                  </>
                )}
              </div>

              <div className="member-audience-subchannel-actions">
                {props.editable ? (
                  <>
                    <button
                      className="nami-surface-button"
                      onClick={() => startRename(channel.id, channel.title)}
                      type="button"
                    >
                      Rename
                    </button>
                    <label className="member-audience-voice-toggle">
                      <input
                        checked={channel.voiceChatEnabled}
                        onChange={(event) => toggleVoice(channel.id, event.target.checked)}
                        type="checkbox"
                      />
                      Voice chat
                    </label>
                    <button
                      className="nami-surface-button danger-preference"
                      onClick={() => removeAudienceSubchannel(props.member.id, channel.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <span className="protocol-hint">
                    {channel.voiceChatEnabled ? 'Voice chat enabled' : 'Text audience room'}
                  </span>
                )}
              </div>

              {channel.voiceChatEnabled ? (
                <p className="member-audience-voice-status">
                  Voice lounge ready — profile owner can admit audience when live.
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {status ? <p className="protocol-hint">{status}</p> : null}
    </article>
  );
}