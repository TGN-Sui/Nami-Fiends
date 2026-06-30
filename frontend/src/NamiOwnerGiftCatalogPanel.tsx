import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import { isGiftApiAvailable, syncGiftCatalog } from './gift-payments-api.js';
import {
  hydrateGiftCatalog,
  setGiftCatalogSnapshot,
  useGiftCatalog,
} from './gift-catalog-store.js';
import {
  giftTierLabel,
  OFFICIAL_GIFT_CATALOG,
  type GiftCatalogEntry,
} from './gift-catalog.js';
import { GiftIcon } from './GiftIcon.js';
import { canPreviewMockStreamGifts } from './gift-mock-preview.js';
import { triggerMockStreamGift } from './gift-store.js';
import { getSelfMember } from './member-access.js';
import { isOfficialOwner } from './nami-capabilities.js';
import { readFileAsDataUrl, validateMediaFile } from './media-upload-service.js';
import { readWalletAuthRequired } from './protocol-env.js';
import { createCatalogSyncAuthPayload } from './wallet-auth.js';
import { canZkLoginSignForOwner } from './zklogin.js';
import { useProtocolOwner } from './wallet.js';

const PREVIEW_STREAM_KEY = 'owner-gift-preview';

type GiftDraft = {
  id: string;
  label: string;
  emoji: string;
  goonAmount: number;
  iconUrl: string | null;
  tier: GiftCatalogEntry['tier'];
  animationClass: string;
};

function toDraft(entry: GiftCatalogEntry): GiftDraft {
  return {
    id: entry.id,
    label: entry.label,
    emoji: entry.emoji,
    goonAmount: entry.goonAmount,
    iconUrl: entry.iconUrl ?? null,
    tier: entry.tier,
    animationClass: entry.animationClass,
  };
}

export function NamiOwnerGiftCatalogPanel(props: { embedded?: boolean } = {}): ReactElement | null {
  const { owner } = useProtocolOwner();
  const catalog = useGiftCatalog();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [drafts, setDrafts] = useState<GiftDraft[]>(() => OFFICIAL_GIFT_CATALOG.map(toDraft));
  const [selectedId, setSelectedId] = useState(OFFICIAL_GIFT_CATALOG[0]?.id ?? 'goon-pop');
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const selectedDraft = useMemo(
    () => drafts.find((draft) => draft.id === selectedId) ?? drafts[0] ?? null,
    [drafts, selectedId]
  );

  const canMockPreview = canPreviewMockStreamGifts(owner);
  const selfMember = getSelfMember();

  useEffect(() => {
    void hydrateGiftCatalog();
  }, []);

  useEffect(() => {
    if (catalog.length > 0) {
      setDrafts(catalog.map(toDraft));
    }
  }, [catalog]);

  if (!isOfficialOwner(owner)) {
    return null;
  }

  function updateDraft(patch: Partial<GiftDraft>): void {
    if (!selectedDraft) {
      return;
    }

    setDrafts((current) =>
      current.map((draft) => (draft.id === selectedDraft.id ? { ...draft, ...patch } : draft))
    );
  }

  function openIconPicker(): void {
    fileInputRef.current?.click();
  }

  function handleIconChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !selectedDraft) {
      return;
    }

    const validationError = validateMediaFile(file, 'channel-cover');

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage(null);
    setIsReadingFile(true);

    void readFileAsDataUrl(file)
      .then((dataUrl) => {
        updateDraft({ iconUrl: dataUrl });
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : 'Could not read gift icon.');
      })
      .finally(() => {
        setIsReadingFile(false);
      });
  }

  async function saveCatalog(): Promise<void> {
    if (!owner) {
      setErrorMessage('Connect the official owner wallet to save gift catalog changes.');
      return;
    }

    if (!isGiftApiAvailable()) {
      setErrorMessage('Gift API is offline. Set VITE_NAMI_INDEXER_URL and run the backend server.');
      return;
    }

    setIsSaving(true);
    setNotice(null);
    setErrorMessage(null);

    try {
      let auth: Awaited<ReturnType<typeof createCatalogSyncAuthPayload>> | undefined;

      if (readWalletAuthRequired()) {
        auth = await createCatalogSyncAuthPayload(owner);

        if (!auth?.signature || !Number.isFinite(auth.timestampMs)) {
          throw new Error('Wallet signature is required. Reconnect zkLogin or your owner wallet.');
        }

        if (canZkLoginSignForOwner(owner) && !auth.signerAddress) {
          throw new Error('zkLogin signer address is missing. Reconnect and try again.');
        }
      }

      const response = await syncGiftCatalog({
        owner,
        entries: drafts.map((draft) => ({
          id: draft.id,
          label: draft.label,
          emoji: draft.emoji,
          goonAmount: draft.goonAmount,
          iconUrl: draft.iconUrl,
        })),
        ...(auth
          ? {
              auth: {
                signature: auth.signature,
                timestampMs: auth.timestampMs,
                ...(auth.signerAddress ? { signerAddress: auth.signerAddress } : {}),
              },
            }
          : {}),
      });

      setGiftCatalogSnapshot(response.catalog);
      setDrafts(response.catalog.map(toDraft));
      setNotice('Gift catalog saved. Live profiles and streams will use the updated icons and prices.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save gift catalog.');
    } finally {
      setIsSaving(false);
    }
  }

  function previewMockGift(giftId: string): void {
    const ok = triggerMockStreamGift({
      giftId,
      streamKey: PREVIEW_STREAM_KEY,
      targetMemberId: selfMember.id,
      targetMemberName: selfMember.name,
      senderMemberId: selfMember.id,
      senderMemberName: selfMember.name + ' (preview)',
    });

    if (ok) {
      setNotice('Mock gift burst queued. Open a live embed on your profile feed to see the overlay.');
    } else {
      setErrorMessage('Could not preview that gift.');
    }
  }

  return (
    <article className={'panel nami-owner-gift-catalog-panel' + (props.embedded ? ' is-embedded' : '')}>
      <div className="nami-owner-gift-catalog-head">
        <span className="mini-badge">Official gifts</span>
        <h3>Gift catalog editor</h3>
        <p>
          Upload custom icons, rename gifts, and set $GOON prices. Changes apply to profile gifts and
          live-stream overlays after you save.
        </p>
      </div>

      <div className="nami-owner-gift-catalog-layout">
        <div className="nami-owner-gift-catalog-list" role="list">
          {drafts.map((draft) => (
            <button
              className={
                'nami-owner-gift-catalog-item' +
                (selectedId === draft.id ? ' is-selected' : '') +
                ' nami-owner-gift-catalog-item-' +
                draft.tier
              }
              key={draft.id}
              onClick={() => setSelectedId(draft.id)}
              type="button"
            >
              <GiftIcon emoji={draft.emoji} iconUrl={draft.iconUrl} imageClassName="nami-owner-gift-catalog-thumb" />
              <span>{draft.label}</span>
              <small>{draft.goonAmount} $GOON</small>
            </button>
          ))}
        </div>

        {selectedDraft ? (
          <div className="nami-owner-gift-catalog-editor">
            <div className="nami-owner-gift-catalog-preview">
              <GiftIcon
                emoji={selectedDraft.emoji}
                iconUrl={selectedDraft.iconUrl}
                imageClassName="nami-owner-gift-catalog-preview-image"
              />
              <div>
                <strong>{selectedDraft.label}</strong>
                <p>{giftTierLabel(selectedDraft.tier)} · {selectedDraft.animationClass}</p>
              </div>
            </div>

            <label className="nami-owner-gift-catalog-field">
              <span>Gift title</span>
              <input
                maxLength={48}
                onChange={(event) => updateDraft({ label: event.target.value })}
                type="text"
                value={selectedDraft.label}
              />
            </label>

            <label className="nami-owner-gift-catalog-field">
              <span>$GOON amount</span>
              <input
                min={1}
                onChange={(event) =>
                  updateDraft({
                    goonAmount: Math.max(1, Number.parseInt(event.target.value, 10) || 1),
                  })
                }
                step={1}
                type="number"
                value={selectedDraft.goonAmount}
              />
            </label>

            <div className="nami-owner-gift-catalog-icon-row">
              <button
                className="nami-surface-button"
                disabled={isReadingFile}
                onClick={openIconPicker}
                type="button"
              >
                {isReadingFile ? 'Reading icon…' : 'Upload gift icon'}
              </button>
              {selectedDraft.iconUrl ? (
                <button
                  className="profile-secondary-link"
                  onClick={() => updateDraft({ iconUrl: null })}
                  type="button"
                >
                  Remove icon
                </button>
              ) : null}
              <input
                accept="image/png,image/jpeg,image/webp,image/gif"
                hidden
                onChange={handleIconChange}
                ref={fileInputRef}
                type="file"
              />
            </div>
            <p className="nami-owner-gift-catalog-hint">
              Recommended square PNG/WebP, 256×256 px or larger. Emoji shows when no custom icon is set.
            </p>
          </div>
        ) : null}
      </div>

      <div className="nami-owner-gift-catalog-actions">
        <button
          className="primary-action"
          disabled={isSaving}
          onClick={() => void saveCatalog()}
          type="button"
        >
          {isSaving ? 'Saving catalog…' : 'Save gift catalog'}
        </button>
      </div>

      {canMockPreview ? (
        <section className="nami-owner-gift-mock-preview">
          <h4>Mock live gifts (local testing)</h4>
          <p>
            Fire gift overlay bursts without spending $GOON. Use on any live Twitch/YouTube embed, or
            preview here while tuning icons.
          </p>
          <div className="nami-owner-gift-mock-grid">
            {drafts.map((draft) => (
              <button
                className="nami-surface-button nami-owner-gift-mock-button"
                key={'mock-' + draft.id}
                onClick={() => previewMockGift(draft.id)}
                type="button"
              >
                <GiftIcon emoji={draft.emoji} iconUrl={draft.iconUrl} imageClassName="nami-owner-gift-mock-thumb" />
                <span>{draft.label}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {notice ? <p className="nami-owner-gift-catalog-notice">{notice}</p> : null}
      {errorMessage ? <p className="nami-owner-gift-catalog-error">{errorMessage}</p> : null}
    </article>
  );
}