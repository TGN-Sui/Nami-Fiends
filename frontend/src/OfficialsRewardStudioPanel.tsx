import { useMemo, useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import {
  CHAT_BORDER_ANIMATED_ACCEPT_LABEL,
  CHAT_BORDER_ART_SLICE_DEFAULTS,
  CHAT_BORDER_DISPLAY_WIDTH_DEFAULTS,
  CHAT_BORDER_STATIC_ACCEPT_LABEL,
  chatBorderArtDimensionNote,
  type ChatBorderSliceInsets,
} from './chat-border-art-specs.js';
import {
  readChatBorderArtDataUrl,
  validateChatBorderAnimatedArt,
  validateChatBorderStaticArt,
} from './chat-border-art-upload.js';
import { buildChatBorderPresentation } from './chat-border-rendering.js';
import {
  CHAT_OVERLAY_BORDER_STYLES,
  readOfficialChatOverlayRewards,
  removeOfficialChatOverlayReward,
  upsertOfficialChatOverlayReward,
  useOfficialChatOverlayRewards,
  type ChatOverlayMotion,
  type ChatOverlayBorderStyle,
  type ChatOverlayUnlockCondition,
  type OfficialChatOverlayReward,
} from './official-chat-overlay-rewards-store.js';
import { overlayRewardClassName } from './chat-overlay-rewards.js';
import { isOfficialOwner } from './nami-capabilities.js';
import { useProtocolOwner } from './wallet.js';

function createDraftReward(): OfficialChatOverlayReward {
  const stamp = Date.now();

  return {
    id: 'overlay-custom-' + stamp,
    name: 'New overlay reward',
    description: 'Describe how members unlock this chat overlay.',
    borderStyle: 'signal-glow',
    motion: 'static',
    accent: 'cyan',
    staticArtUrl: null,
    animatedArtUrl: null,
    artSliceInsets: { ...CHAT_BORDER_ART_SLICE_DEFAULTS },
    displayWidths: { ...CHAT_BORDER_DISPLAY_WIDTH_DEFAULTS },
    condition: { type: 'verified' },
    enabled: true,
    updatedAtMs: stamp,
  };
}

function updateSliceInset(
  current: ChatBorderSliceInsets,
  edge: keyof ChatBorderSliceInsets,
  value: string
): ChatBorderSliceInsets {
  const parsed = Number.parseInt(value, 10);

  return {
    ...current,
    [edge]: Number.isFinite(parsed) ? parsed : current[edge],
  };
}

export function OfficialsRewardStudioPanel(props: { embedded?: boolean } = {}): ReactElement | null {
  const { owner } = useProtocolOwner();
  const rewards = useOfficialChatOverlayRewards();
  const staticInputRef = useRef<HTMLInputElement | null>(null);
  const animatedInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedId, setSelectedId] = useState<string>(() => rewards[0]?.id ?? '');
  const [draft, setDraft] = useState<OfficialChatOverlayReward | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const activeDraft = useMemo(() => {
    if (draft) {
      return draft;
    }

    return rewards.find((reward) => reward.id === selectedId) ?? rewards[0] ?? null;
  }, [draft, rewards, selectedId]);

  if (!isOfficialOwner(owner)) {
    return null;
  }

  function selectReward(reward: OfficialChatOverlayReward): void {
    setSelectedId(reward.id);
    setDraft({ ...reward });
    setNotice(null);
    setUploadError(null);
  }

  function updateDraft(patch: Partial<OfficialChatOverlayReward>): void {
    if (!activeDraft) {
      return;
    }

    setDraft({
      ...activeDraft,
      ...patch,
    });
  }

  function updateCondition(next: ChatOverlayUnlockCondition): void {
    if (!activeDraft) {
      return;
    }

    setDraft({
      ...activeDraft,
      condition: next,
    });
  }

  async function handleStaticUpload(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !activeDraft) {
      return;
    }

    const validationError = validateChatBorderStaticArt(file);

    if (validationError) {
      setUploadError(validationError);
      return;
    }

    updateDraft({ staticArtUrl: await readChatBorderArtDataUrl(file) });
    setUploadError(null);
  }

  async function handleAnimatedUpload(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !activeDraft) {
      return;
    }

    const validationError = validateChatBorderAnimatedArt(file);

    if (validationError) {
      setUploadError(validationError);
      return;
    }

    updateDraft({ animatedArtUrl: await readChatBorderArtDataUrl(file) });
    setUploadError(null);
  }

  function handleSave(): void {
    if (!activeDraft) {
      return;
    }

    const saved = upsertOfficialChatOverlayReward(activeDraft);
    setSelectedId(saved.id);
    setDraft({ ...saved });
    setNotice('Saved "' + saved.name + '" to the border art reward catalog.');
  }

  function handleCreate(): void {
    const next = createDraftReward();
    setSelectedId(next.id);
    setDraft(next);
    setNotice('Draft border reward ready — upload art and save to publish.');
  }

  function handleRemove(): void {
    if (!activeDraft) {
      return;
    }

    removeOfficialChatOverlayReward(activeDraft.id);
    const remaining = readOfficialChatOverlayRewards();
    const next = remaining[0] ?? null;

    setSelectedId(next?.id ?? '');
    setDraft(next ? { ...next } : null);
    setNotice('Removed border reward from the catalog.');
  }

  const previewPresentation = activeDraft
    ? buildChatBorderPresentation(activeDraft, overlayRewardClassName(activeDraft))
    : null;

  return (
    <article
      className={
        'panel settings-card settings-compact-card settings-section-wide officials-reward-studio-panel' +
        (props.embedded ? ' nami-owner-advanced-embedded-panel' : '')
      }
    >
      <div className="profile-panel-heading">
        <span className="mini-badge">Border Art</span>
        <h2>Chat border rewards</h2>
        <p>
          Upload static or animated 9-patch border art, define unlock conditions, and publish
          scalable chat bubble cosmetics for members to equip.
        </p>
        <p className="protocol-hint">{chatBorderArtDimensionNote()}</p>
      </div>

      <div className="officials-reward-studio-layout">
        <aside className="officials-reward-studio-list">
          <div className="officials-reward-studio-list-actions">
            <button className="nami-surface-button is-primary-surface-button" onClick={handleCreate} type="button">
              New border reward
            </button>
          </div>
          <ul>
            {rewards.map((reward) => (
              <li key={reward.id}>
                <button
                  className={
                    'officials-reward-studio-list-item' +
                    (activeDraft?.id === reward.id ? ' is-active-reward-item' : '')
                  }
                  onClick={() => selectReward(reward)}
                  type="button"
                >
                  <strong>{reward.name}</strong>
                  <small>
                    {reward.borderStyle} · {reward.motion}
                    {reward.enabled ? '' : ' · disabled'}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {activeDraft ? (
          <div className="officials-reward-studio-editor">
            <label className="onboarding-field">
              <span>Reward name</span>
              <input
                onChange={(event) => updateDraft({ name: event.target.value })}
                type="text"
                value={activeDraft.name}
              />
            </label>

            <label className="onboarding-field">
              <span>Description</span>
              <textarea
                onChange={(event) => updateDraft({ description: event.target.value })}
                rows={3}
                value={activeDraft.description}
              />
            </label>

            <div className="officials-reward-studio-field-grid">
              <label className="onboarding-field">
                <span>Border style</span>
                <select
                  onChange={(event) =>
                    updateDraft({ borderStyle: event.target.value as ChatOverlayBorderStyle })
                  }
                  value={activeDraft.borderStyle}
                >
                  {CHAT_OVERLAY_BORDER_STYLES.map((borderStyle) => (
                    <option key={borderStyle} value={borderStyle}>
                      {borderStyle}
                    </option>
                  ))}
                </select>
              </label>

              <label className="onboarding-field">
                <span>Motion</span>
                <select
                  onChange={(event) =>
                    updateDraft({ motion: event.target.value as ChatOverlayMotion })
                  }
                  value={activeDraft.motion}
                >
                  <option value="static">Static</option>
                  <option value="premium-loop">Premium loop</option>
                </select>
              </label>

              <label className="onboarding-field">
                <span>Accent</span>
                <select
                  onChange={(event) =>
                    updateDraft({
                      accent: event.target.value as OfficialChatOverlayReward['accent'],
                    })
                  }
                  value={activeDraft.accent}
                >
                  <option value="cyan">Cyan</option>
                  <option value="violet">Violet</option>
                  <option value="gold">Gold</option>
                  <option value="mint">Mint</option>
                </select>
              </label>
            </div>

            <fieldset className="officials-reward-studio-condition-field">
              <legend>Unlock condition</legend>
              <div className="officials-reward-studio-condition-picker">
                <button
                  aria-pressed={activeDraft.condition.type === 'verified'}
                  className={'nami-surface-button' + (activeDraft.condition.type === 'verified' ? ' is-primary-surface-button' : '')}
                  onClick={() => updateCondition({ type: 'verified' })}
                  type="button"
                >
                  Verified member
                </button>
                <button
                  aria-pressed={activeDraft.condition.type === 'tier-min'}
                  className={'nami-surface-button' + (activeDraft.condition.type === 'tier-min' ? ' is-primary-surface-button' : '')}
                  onClick={() => updateCondition({ type: 'tier-min', tier: 'Pro' })}
                  type="button"
                >
                  Tier minimum
                </button>
                <button
                  aria-pressed={activeDraft.condition.type === 'official-grant'}
                  className={
                    'nami-surface-button' +
                    (activeDraft.condition.type === 'official-grant' ? ' is-primary-surface-button' : '')
                  }
                  onClick={() => updateCondition({ type: 'official-grant', memberIds: [] })}
                  type="button"
                >
                  Official grant
                </button>
              </div>

              {activeDraft.condition.type === 'tier-min' ? (
                <label className="onboarding-field">
                  <span>Minimum tier</span>
                  <select
                    onChange={(event) =>
                      updateCondition({
                        type: 'tier-min',
                        tier: event.target.value as 'Adventurer' | 'Pro' | 'Elite',
                      })
                    }
                    value={activeDraft.condition.tier}
                  >
                    <option value="Adventurer">Adventurer</option>
                    <option value="Pro">Pro</option>
                    <option value="Elite">Elite</option>
                  </select>
                </label>
              ) : null}

              {activeDraft.condition.type === 'official-grant' ? (
                <label className="onboarding-field">
                  <span>Granted member ids (comma-separated)</span>
                  <input
                    onChange={(event) =>
                      updateCondition({
                        type: 'official-grant',
                        memberIds: event.target.value
                          .split(',')
                          .map((entry) => entry.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="m1, m2, partner-member-id"
                    type="text"
                    value={activeDraft.condition.memberIds.join(', ')}
                  />
                </label>
              ) : null}
            </fieldset>

            <fieldset className="officials-reward-studio-condition-field">
              <legend>Border art uploads</legend>
              <div className="profile-edit-chip-row">
                <button
                  className="nami-surface-button"
                  onClick={() => staticInputRef.current?.click()}
                  type="button"
                >
                  Upload static ({CHAT_BORDER_STATIC_ACCEPT_LABEL})
                </button>
                <button
                  className="nami-surface-button"
                  onClick={() => animatedInputRef.current?.click()}
                  type="button"
                >
                  Upload animated ({CHAT_BORDER_ANIMATED_ACCEPT_LABEL})
                </button>
              </div>
              <input
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={handleStaticUpload}
                ref={staticInputRef}
                type="file"
              />
              <input
                accept="image/gif,image/webp"
                hidden
                onChange={handleAnimatedUpload}
                ref={animatedInputRef}
                type="file"
              />
              {uploadError ? <p className="profile-edit-field-hint is-unavailable-name">{uploadError}</p> : null}
            </fieldset>

            <div className="officials-reward-studio-field-grid">
              {(['top', 'right', 'bottom', 'left'] as const).map((edge) => (
                <label className="onboarding-field" key={'art-' + edge}>
                  <span>Art slice {edge}</span>
                  <input
                    min={8}
                    onChange={(event) =>
                      updateDraft({
                        artSliceInsets: updateSliceInset(
                          activeDraft.artSliceInsets,
                          edge,
                          event.target.value
                        ),
                      })
                    }
                    type="number"
                    value={activeDraft.artSliceInsets[edge]}
                  />
                </label>
              ))}
            </div>

            <div className="officials-reward-studio-field-grid">
              {(['top', 'right', 'bottom', 'left'] as const).map((edge) => (
                <label className="onboarding-field" key={'display-' + edge}>
                  <span>Display width {edge}</span>
                  <input
                    min={8}
                    onChange={(event) =>
                      updateDraft({
                        displayWidths: updateSliceInset(
                          activeDraft.displayWidths,
                          edge,
                          event.target.value
                        ),
                      })
                    }
                    type="number"
                    value={activeDraft.displayWidths[edge]}
                  />
                </label>
              ))}
            </div>

            <label className="officials-reward-studio-enabled-toggle">
              <input
                checked={activeDraft.enabled}
                onChange={(event) => updateDraft({ enabled: event.target.checked })}
                type="checkbox"
              />
              <span>Reward enabled in catalog</span>
            </label>

            <div className="officials-reward-studio-preview">
              <p>Border preview</p>
              <div className="officials-reward-studio-preview-bubble">
                <div
                  className={
                    'message-bubble ' +
                    (previewPresentation?.hasCustomArt
                      ? previewPresentation.className
                      : overlayRewardClassName(activeDraft))
                  }
                  style={previewPresentation?.hasCustomArt ? previewPresentation.style : undefined}
                >
                  Member message preview scales with width and height.
                </div>
              </div>
            </div>

            <div className="officials-reward-studio-actions">
              <button className="nami-surface-button is-primary-surface-button" onClick={handleSave} type="button">
                Save reward
              </button>
              <button className="nami-surface-button" onClick={handleRemove} type="button">
                Remove
              </button>
            </div>
          </div>
        ) : (
          <p className="protocol-hint">Create a border reward to get started.</p>
        )}
      </div>

      {notice ? <p className="protocol-hint nami-owner-action-notice">{notice}</p> : null}
    </article>
  );
}