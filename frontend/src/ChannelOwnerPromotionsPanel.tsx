import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';

import { isMockMembershipCheckoutEnabled } from './app-config.js';
import { ChannelOwnerPromotionsStatusCard } from './ChannelOwnerPromotionsStatusCard.js';
import {
  canSendSuperBanner,
  confirmPromotionPurchase,
  formatPromotionPrice,
  PROMOTION_DURATION_LABELS,
  requestPromotionPurchase,
  savePartnerCarouselTicket,
  saveSuperBannerDraft,
  sendSuperBanner,
  useChannelOwnerPromotionsState,
  type PromotionDuration,
  type PromotionProduct,
} from './channel-owner-promotions-store.js';
import {
  MEDIA_UPLOAD_ACCEPTED_LABEL,
  readFileAsDataUrl,
  validateMediaFile,
} from './media-upload-service.js';
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
  const promotions = useChannelOwnerPromotionsState();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [checkoutRail, setCheckoutRail] = useState<MembershipCheckoutRail>('card');
  const [superDuration] = useState<PromotionDuration>('weekly');
  const [hubDuration, setHubDuration] = useState<PromotionDuration>('72h');
  const [partnerDuration, setPartnerDuration] = useState<PromotionDuration>('weekly');
  const superFileRef = useRef<HTMLInputElement | null>(null);
  const partnerFileRef = useRef<HTMLInputElement | null>(null);

  const superGate = canSendSuperBanner();
  const ticket = promotions.partnerCarousel.ticket;

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

  function handleSuperCoverChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const validationError = validateMediaFile(file, 'channel-cover');

    if (validationError) {
      setError(validationError);
      return;
    }

    void readFileAsDataUrl(file)
      .then((dataUrl) => {
        saveSuperBannerDraft(props.channel.id, {
          ...promotions.superBanner.draft,
          coverUrl: dataUrl,
        });
        setNotice('Super Banner cover updated.');
      })
      .catch((readError: unknown) => {
        setError(readError instanceof Error ? readError.message : 'Could not read image.');
      });
  }

  function handlePartnerCoverChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const validationError = validateMediaFile(file, 'channel-cover');

    if (validationError) {
      setError(validationError);
      return;
    }

    void readFileAsDataUrl(file)
      .then((dataUrl) => {
        savePartnerCarouselTicket(props.channel.id, { coverUrl: dataUrl });
        setNotice('Partner banner cover updated.');
      })
      .catch((readError: unknown) => {
        setError(readError instanceof Error ? readError.message : 'Could not read image.');
      });
  }

  return (
    <section className="channel-owner-promotions-stack">
      <ChannelOwnerPromotionsStatusCard compact />

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
            (promotions.superBanner.draft.coverUrl ? ' has-cover' : '')
          }
          style={
            promotions.superBanner.draft.coverUrl
              ? { backgroundImage: 'url(' + JSON.stringify(promotions.superBanner.draft.coverUrl) + ')' }
              : undefined
          }
        >
          <div className="channel-owner-super-banner-preview-copy">
            <strong>{promotions.superBanner.draft.headline || props.channel.name}</strong>
            <p>{promotions.superBanner.draft.body || 'Your Super Banner message appears here.'}</p>
          </div>
        </div>

        <div className="channel-owner-tool-field-grid">
          <label className="channel-owner-tool-field">
            <span>Headline</span>
            <input
              onChange={(event) =>
                saveSuperBannerDraft(props.channel.id, {
                  ...promotions.superBanner.draft,
                  headline: event.target.value,
                })
              }
              type="text"
              value={promotions.superBanner.draft.headline}
            />
          </label>
          <label className="channel-owner-tool-field">
            <span>Message</span>
            <textarea
              onChange={(event) =>
                saveSuperBannerDraft(props.channel.id, {
                  ...promotions.superBanner.draft,
                  body: event.target.value,
                })
              }
              rows={3}
              value={promotions.superBanner.draft.body}
            />
          </label>
        </div>

        <input
          accept="image/png,image/jpeg,image/webp"
          className="member-avatar-upload-input"
          onChange={handleSuperCoverChange}
          ref={superFileRef}
          type="file"
        />

        <div className="channel-owner-tool-actions">
          <button className="nami-surface-button" onClick={() => superFileRef.current?.click()} type="button">
            Upload cover
          </button>
          {promotions.superBanner.status !== 'active' ? (
            <button
              className="nami-surface-button is-primary-surface-button"
              onClick={() => purchase('super-banner', superDuration)}
              type="button"
            >
              Purchase Super Banner · {formatPromotionPrice('super-banner', superDuration)}
            </button>
          ) : (
            <button
              className="nami-surface-button is-primary-surface-button"
              disabled={!superGate.ok}
              onClick={() => {
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
        <small className="channel-owner-tool-footnote">{MEDIA_UPLOAD_ACCEPTED_LABEL}</small>
      </article>

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
              onChange={(event) => savePartnerCarouselTicket(props.channel.id, { title: event.target.value })}
              type="text"
              value={ticket?.title ?? ''}
            />
          </label>
          <label className="channel-owner-tool-field">
            <span>Description</span>
            <textarea
              onChange={(event) =>
                savePartnerCarouselTicket(props.channel.id, { description: event.target.value })
              }
              rows={3}
              value={ticket?.description ?? ''}
            />
          </label>
        </div>

        <input
          accept="image/png,image/jpeg,image/webp"
          className="member-avatar-upload-input"
          onChange={handlePartnerCoverChange}
          ref={partnerFileRef}
          type="file"
        />

        <div className="channel-owner-tool-actions">
          <button className="nami-surface-button" onClick={() => partnerFileRef.current?.click()} type="button">
            Upload banner cover
          </button>
          <button
            className="nami-surface-button"
            onClick={() => {
              const result = savePartnerCarouselTicket(props.channel.id, { duration: partnerDuration });

              if (result.ok) {
                setNotice(result.message);
              }
            }}
            type="button"
          >
            Save draft
          </button>
          <button
            className="nami-surface-button is-primary-surface-button"
            onClick={() => purchase('partner-carousel', partnerDuration)}
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
    </section>
  );
}