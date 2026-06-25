import { useState, type ReactElement } from 'react';

import { isMockMembershipCheckoutEnabled } from './app-config.js';
import { ChannelOwnerPromotionsStatusCard } from './ChannelOwnerPromotionsStatusCard.js';
import { useChannelOwnerSettings } from './channel-owner-settings-context.js';
import { useChannelOwnerMediaVersion } from './channel-owner-media-store.js';
import {
  canSendSuperBanner,
  confirmPromotionPurchase,
  formatPromotionPrice,
  PROMOTION_DURATION_LABELS,
  requestPromotionPurchase,
  resolvePartnerCarouselCoverUrl,
  resolveSuperBannerCoverUrl,
  savePartnerCarouselTicket,
  saveSuperBannerDraft,
  sendSuperBanner,
  useChannelOwnerPromotionsState,
  type PromotionDuration,
  type PromotionProduct,
} from './channel-owner-promotions-store.js';
import {
  isPreApprovedGameOwnerWorkspace,
  preApprovedOwnerCapabilityAllowed,
} from './game-owner-approval-guards.js';
import { OwnerMediaUploadField } from './OwnerMediaUploadField.js';
import { PreApprovedGameOwnerLockedPanel } from './PreApprovedGameOwnerLockedPanel.js';
import { FeaturedPlacementAuctionPanel } from './FeaturedPlacementAuctionPanel.js';
import { PartnerCarouselPreviewOverlay } from './PartnerCarouselPreviewOverlay.js';
import type { MembershipCheckoutRail, MembershipCryptoAsset } from './membership-plans-store.js';
import type { NamiChannel } from './uiMockData.js';

const DURATIONS: PromotionDuration[] = ['24h', '72h', 'weekly'];

function PromotionCheckoutActions(props: {
  product: PromotionProduct;
  duration: PromotionDuration;
  pendingPaymentId: string | null;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}): ReactElement | null {
  if (!props.pendingPaymentId || !isMockMembershipCheckoutEnabled()) {
    return null;
  }

  return (
    <button
      className="nami-surface-button is-primary-surface-button"
      onClick={() => {
        const result = confirmPromotionPurchase(props.product, props.pendingPaymentId!);

        if (result.ok) {
          props.onNotice(result.message);
        } else {
          props.onError(result.reason);
        }
      }}
      type="button"
    >
      Confirm mock payment
    </button>
  );
}

export function ChannelOwnerPromotionsPanel(props: {
  channel: NamiChannel;
}): ReactElement {
  useChannelOwnerMediaVersion();
  const settings = useChannelOwnerSettings();
  const promotions = useChannelOwnerPromotionsState(props.channel.id);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [checkoutRail, setCheckoutRail] = useState<MembershipCheckoutRail>('card');
  const [superDuration] = useState<PromotionDuration>('weekly');
  const [hubDuration, setHubDuration] = useState<PromotionDuration>('72h');
  const [partnerDuration, setPartnerDuration] = useState<PromotionDuration>('weekly');
  const [showPartnerPreview, setShowPartnerPreview] = useState(false);

  const superHeadline = settings.draft.superBanner.headline;
  const superBody = settings.draft.superBanner.body;
  const partnerTitle = settings.draft.partnerCarousel.title;
  const partnerDescription = settings.draft.partnerCarousel.description;

  const superGate = canSendSuperBanner(props.channel.id);
  const ticket = promotions.partnerCarousel.ticket;
  const superBannerCoverUrl = resolveSuperBannerCoverUrl(
    props.channel.id,
    promotions.superBanner.draft.coverUrl,
  );
  const partnerBannerCoverUrl = resolvePartnerCarouselCoverUrl(props.channel.id, ticket);
  const preApprovedWorkspace = isPreApprovedGameOwnerWorkspace(props.channel.id);
  const purchasesLocked = !preApprovedOwnerCapabilityAllowed(
    'purchase-promotions',
    props.channel.id,
  );
  const partnerSubmitLocked = !preApprovedOwnerCapabilityAllowed(
    'submit-partner-ticket',
    props.channel.id,
  );
  const sendLocked = !preApprovedOwnerCapabilityAllowed('send-banners', props.channel.id);

  function clearMessages(): void {
    setNotice('');
    setError('');
  }

  function purchase(product: PromotionProduct, duration: PromotionDuration): void {
    clearMessages();
    const result = requestPromotionPurchase(props.channel.id, product, duration, checkoutRail, null);

    if (result.ok) {
      setNotice(result.message);
    } else {
      setError(result.reason);
    }
  }

  function persistSuperCover(coverUrl: string): void {
    saveSuperBannerDraft(props.channel.id, {
      coverUrl,
      headline: superHeadline,
      body: superBody,
    });
  }

  function persistPartnerCover(coverUrl: string): void {
    savePartnerCarouselTicket(props.channel.id, {
      title: partnerTitle,
      description: partnerDescription,
      coverUrl,
    });
  }

  const partnerPreviewTitle = partnerTitle.trim() || props.channel.name;
  const partnerPreviewDescription = partnerDescription.trim() || props.channel.genre;

  return (
    <section className="channel-owner-promotions-stack">
      {preApprovedWorkspace ? (
        <PreApprovedGameOwnerLockedPanel
          feature="Promotion purchases and partner ticket submission"
          title="Purchases locked until approval"
        />
      ) : null}

      <ChannelOwnerPromotionsStatusCard channelId={props.channel.id} compact />

      <article
        className="panel channel-owner-tool-card channel-owner-super-banner-card"
        id="channel-owner-super-banner"
      >
        <div className="channel-owner-tool-card-head">
          <div>
            <span className="mini-badge">Super Banner</span>
            <h3>Reach every member instantly</h3>
            <p>
              Full-screen alert for at least 3 seconds. Up to 2 sends per day — resets 12:00 PM Central.
            </p>
          </div>
          <span className="channel-owner-tool-status-pill">
            {promotions.superBanner.status === 'active'
              ? superGate.remaining + ' sends left today'
              : 'Purchase required'}
          </span>
        </div>

        <div
          className={
            'channel-owner-super-banner-preview' +
            (superBannerCoverUrl ? ' has-cover' : '')
          }
          style={
            superBannerCoverUrl
              ? { backgroundImage: 'url(' + JSON.stringify(superBannerCoverUrl) + ')' }
              : undefined
          }
        >
          <div className="channel-owner-super-banner-preview-copy">
            <strong>{superHeadline.trim() || props.channel.name}</strong>
            <p>{superBody.trim() || 'Your Super Banner message appears here.'}</p>
          </div>
        </div>

        <div className="channel-owner-tool-field-grid">
          <label className="channel-owner-tool-field">
            <span>Headline</span>
            <input
              onChange={(event) =>
                settings.updateSuperBanner({ headline: event.target.value })
              }
              type="text"
              value={superHeadline}
            />
          </label>
          <label className="channel-owner-tool-field">
            <span>Message</span>
            <textarea
              onChange={(event) => settings.updateSuperBanner({ body: event.target.value })}
              rows={3}
              value={superBody}
            />
          </label>
        </div>

        <OwnerMediaUploadField
          onUpload={(dataUrl, _file) => {
            persistSuperCover(dataUrl);
            setNotice('Super Banner cover updated.');
          }}
          previewUrl={superBannerCoverUrl || null}
          slot="super-banner-cover"
          uploadLabel="Upload Super Banner cover"
        />

        <div className="channel-owner-tool-actions">
          {promotions.superBanner.status !== 'active' ? (
            <button
              className="nami-surface-button is-primary-surface-button"
              disabled={purchasesLocked}
              onClick={() => purchase('super-banner', superDuration)}
              type="button"
            >
              Purchase Super Banner · {formatPromotionPrice('super-banner', superDuration)}
            </button>
          ) : (
            <button
              className="nami-surface-button is-primary-surface-button"
              disabled={!superGate.ok || sendLocked}
              onClick={() => {
                settings.saveSettings();
                const result = sendSuperBanner(props.channel.id);

                if (result.ok) {
                  setNotice(result.message);
                } else {
                  setError(result.reason);
                }
              }}
              type="button"
            >
              Send Super Banner
            </button>
          )}
          <PromotionCheckoutActions
            duration={superDuration}
            onError={setError}
            onNotice={setNotice}
            pendingPaymentId={promotions.superBanner.pendingPaymentId}
            product="super-banner"
          />
        </div>
      </article>

      <FeaturedPlacementAuctionPanel />

      <article className="panel channel-owner-tool-card" id="channel-owner-hub-featured">
        <div className="channel-owner-tool-card-head">
          <div>
            <span className="mini-badge">Nami Hub</span>
            <h3>Featured game spot</h3>
            <p>Pin your channel in the Nami Hub featured rail after checkout.</p>
          </div>
        </div>

        <div className="channel-owner-duration-picker" role="group" aria-label="Hub featured duration">
          {DURATIONS.map((duration) => (
            <button
              aria-pressed={hubDuration === duration}
              className={'channel-owner-duration-option' + (hubDuration === duration ? ' is-active' : '')}
              key={duration}
              onClick={() => setHubDuration(duration)}
              type="button"
            >
              <strong>{PROMOTION_DURATION_LABELS[duration]}</strong>
              <span>{formatPromotionPrice('hub-featured', duration)}</span>
            </button>
          ))}
        </div>

        <div className="channel-owner-tool-actions">
          {promotions.hubFeatured.status !== 'active' ? (
            <button
              className="nami-surface-button is-primary-surface-button"
              disabled={purchasesLocked}
              onClick={() => purchase('hub-featured', hubDuration)}
              type="button"
            >
              Purchase featured spot
            </button>
          ) : (
            <span className="channel-owner-tool-status-pill is-active-promotion">
              Featured until{' '}
              {promotions.hubFeatured.expiresAtMs
                ? new Date(promotions.hubFeatured.expiresAtMs).toLocaleString()
                : '—'}
            </span>
          )}
          <PromotionCheckoutActions
            duration={hubDuration}
            onError={setError}
            onNotice={setNotice}
            pendingPaymentId={promotions.hubFeatured.pendingPaymentId}
            product="hub-featured"
          />
        </div>
      </article>

      <article className="panel channel-owner-tool-card" id="channel-owner-partner-carousel">
        <div className="channel-owner-tool-card-head">
          <div>
            <span className="mini-badge">Partner carousel</span>
            <h3>Featured Partner Banner ticket</h3>
            <p>Submit cover art, title, and copy for Nami Official approval.</p>
          </div>
          {ticket?.status === 'submitted' ? (
            <span className="channel-owner-tool-status-pill">Pending review</span>
          ) : null}
          {ticket?.status === 'approved' ? (
            <span className="channel-owner-tool-status-pill is-active-promotion">Approved</span>
          ) : null}
        </div>

        <div className="channel-owner-duration-picker" role="group" aria-label="Partner carousel duration">
          {DURATIONS.map((duration) => (
            <button
              aria-pressed={partnerDuration === duration}
              className={
                'channel-owner-duration-option' + (partnerDuration === duration ? ' is-active' : '')
              }
              key={duration}
              onClick={() => setPartnerDuration(duration)}
              type="button"
            >
              <strong>{PROMOTION_DURATION_LABELS[duration]}</strong>
              <span>{formatPromotionPrice('partner-carousel', duration)}</span>
            </button>
          ))}
        </div>

        <div className="channel-owner-tool-field-grid">
          <label className="channel-owner-tool-field">
            <span>Banner title</span>
            <input
              onChange={(event) =>
                settings.updatePartnerCarousel({ title: event.target.value })
              }
              type="text"
              value={partnerTitle}
            />
          </label>
          <label className="channel-owner-tool-field">
            <span>Description</span>
            <textarea
              onChange={(event) =>
                settings.updatePartnerCarousel({ description: event.target.value })
              }
              rows={3}
              value={partnerDescription}
            />
          </label>
        </div>

        <div
          className={
            'banner-panel featured-banner-carousel nami-hub-rotating-banner partner-carousel-inline-preview' +
            (partnerBannerCoverUrl ? ' has-partner-banner-cover' : '')
          }
        >
          {partnerBannerCoverUrl ? (
            <span
              aria-hidden="true"
              className="nami-hub-banner-cover"
              style={{ backgroundImage: 'url(' + JSON.stringify(partnerBannerCoverUrl) + ')' }}
            />
          ) : null}
          {partnerBannerCoverUrl ? <span aria-hidden="true" className="nami-hub-banner-scrim" /> : null}
          <div className="nami-hub-banner-copy">
            <span>Featured Partner Banner Carousel</span>
            <strong>{partnerPreviewTitle}</strong>
            <small>{partnerPreviewDescription}</small>
          </div>
        </div>

        <OwnerMediaUploadField
          onUpload={(dataUrl, _file) => {
            persistPartnerCover(dataUrl);
            setNotice('Partner banner cover updated.');
          }}
          previewUrl={partnerBannerCoverUrl || null}
          slot="partner-carousel-banner"
          uploadLabel="Upload partner banner cover"
        />

        <div className="channel-owner-tool-actions">
          <button
            className="nami-surface-button"
            onClick={() => {
              settings.saveSettings();
              setShowPartnerPreview(true);
            }}
            type="button"
          >
            Preview on Nami Hub
          </button>
          <button
            className="nami-surface-button"
            onClick={() => {
              settings.saveSettings();
              const result = savePartnerCarouselTicket(props.channel.id, { duration: partnerDuration });

              if (result.ok) {
                setNotice(result.message);
              }
            }}
            type="button"
          >
            Save ticket draft
          </button>
          <button
            className="nami-surface-button is-primary-surface-button"
            disabled={partnerSubmitLocked}
            onClick={() => {
              settings.saveSettings();
              purchase('partner-carousel', partnerDuration);
            }}
            type="button"
          >
            Submit ticket for approval
          </button>
          <PromotionCheckoutActions
            duration={partnerDuration}
            onError={setError}
            onNotice={setNotice}
            pendingPaymentId={promotions.partnerCarousel.pendingPaymentId}
            product="partner-carousel"
          />
        </div>
      </article>

      <div className="channel-owner-checkout-rail-row" role="group" aria-label="Payment method">
        {(['card', 'paypal', 'other'] as MembershipCheckoutRail[]).map((rail) => (
          <button
            aria-pressed={checkoutRail === rail}
            className={'channel-owner-checkout-rail' + (checkoutRail === rail ? ' is-active' : '')}
            key={rail}
            onClick={() => setCheckoutRail(rail)}
            type="button"
          >
            {rail === 'card' ? 'Card' : rail === 'paypal' ? 'PayPal' : 'Crypto'}
          </button>
        ))}
      </div>

      {notice ? <p className="channel-owner-tool-notice is-success">{notice}</p> : null}
      {error ? <p className="channel-owner-tool-notice is-error">{error}</p> : null}

      {showPartnerPreview ? (
        <PartnerCarouselPreviewOverlay
          channel={props.channel}
          coverUrl={partnerBannerCoverUrl}
          description={partnerDescription}
          onClose={() => setShowPartnerPreview(false)}
          title={partnerTitle}
        />
      ) : null}
    </section>
  );
}