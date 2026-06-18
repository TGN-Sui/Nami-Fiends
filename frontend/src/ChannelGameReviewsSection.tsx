import { useMemo, useState, type ReactElement } from 'react';

import { readMemberChannelBadgeLabel } from './channel-game-badge-store.js';
import {
  averageChannelGameReviewRating,
  canSubmitChannelGameReview,
  getChannelGameReviewEligibility,
  getChannelGameReviews,
  submitChannelGameReview,
  useChannelGameReviewsStore,
} from './channel-game-reviews-store.js';
import { getSelfMember } from './member-access.js';
import { UniformMemberAvatar } from './member-avatar.js';
import type { NamiChannel, NamiMember } from './uiMockData.js';

function renderRatingStars(rating: number): string {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));

  return '★★★★★'.slice(0, rounded) + '☆☆☆☆☆'.slice(0, 5 - rounded);
}

function eligibilityMessage(eligibility: ReturnType<typeof getChannelGameReviewEligibility>, channelName: string): string {
  if (eligibility === 'eligible') {
    return 'You are verified and hold a badge from ' + channelName + '. Share one review for the community wall.';
  }

  if (eligibility === 'not-verified') {
    return 'Only verified members can post community reviews. Complete verification to unlock the review form.';
  }

  if (eligibility === 'missing-badge') {
    return 'Earn a badge from ' + channelName + ' to prove you play here. Reviews stay locked until you hold channel proof.';
  }

  return 'You already posted your review for this channel. Thanks for helping other players decide.';
}

export function ChannelGameReviewsSection(props: {
  channel: NamiChannel;
  onOpenMember?: (memberId: string) => void;
}): ReactElement {
  const allReviews = useChannelGameReviewsStore();
  const selfMember = getSelfMember();
  const reviews = useMemo(() => getChannelGameReviews(props.channel.id), [allReviews, props.channel.id]);
  const averageRating = averageChannelGameReviewRating(props.channel.id);
  const eligibility = getChannelGameReviewEligibility(selfMember, props.channel.id);
  const canSubmit = canSubmitChannelGameReview(selfMember, props.channel.id);
  const ownedBadge = readMemberChannelBadgeLabel(selfMember.id, props.channel.id);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notice, setNotice] = useState('');

  function handleSubmit(): void {
    const result = submitChannelGameReview({
      channelId: props.channel.id,
      member: selfMember,
      rating,
      title,
      body,
    });

    if (!result.ok) {
      if (result.reason === 'not-verified') {
        setNotice('Verification is required before posting a community review.');
      } else if (result.reason === 'missing-badge') {
        setNotice('Earn a badge from this game channel before reviewing it.');
      } else if (result.reason === 'already-reviewed') {
        setNotice('You already shared a review for this channel.');
      } else {
        setNotice('Add a rating, headline, and review copy before submitting.');
      }

      return;
    }

    setTitle('');
    setBody('');
    setRating(5);
    setNotice('Review posted to the community wall.');
  }

  return (
    <section className="channel-profile-section channel-profile-reviews">
      <div className="channel-profile-section-head">
        <div>
          <h2>Community reviews</h2>
          <p>
            Player-written reviews from verified members who own a badge from {props.channel.name}. Channel owners cannot
            edit this wall.
          </p>
        </div>

        <div className="channel-profile-review-summary" aria-label="Average community rating">
          {averageRating !== null ? (
            <>
              <strong>{averageRating.toFixed(1)}</strong>
              <span className="channel-profile-review-stars" aria-hidden="true">
                {renderRatingStars(averageRating)}
              </span>
              <small>{reviews.length} review{reviews.length === 1 ? '' : 's'}</small>
            </>
          ) : (
            <small>No reviews yet</small>
          )}
        </div>
      </div>

      <article className="channel-profile-review-eligibility-card">
        <span className="channel-profile-review-lock-label">Badge-gated reviews</span>
        <p>{eligibilityMessage(eligibility, props.channel.name)}</p>
        {ownedBadge ? <span className="channel-profile-review-owned-badge">Your badge: {ownedBadge}</span> : null}
      </article>

      {canSubmit ? (
        <article className="channel-profile-review-compose-card">
          <h3>Share your review</h3>

          <div className="channel-profile-review-rating-picker" role="group" aria-label="Review rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                aria-pressed={rating === value}
                className={'channel-profile-review-rating-button' + (rating === value ? ' is-selected-review-rating' : '')}
                key={value}
                onClick={() => setRating(value)}
                type="button"
              >
                {value}★
              </button>
            ))}
          </div>

          <label className="channel-profile-review-field">
            <span>Headline</span>
            <input
              maxLength={80}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={'What should players know about ' + props.channel.name + '?'}
              value={title}
            />
          </label>

          <label className="channel-profile-review-field">
            <span>Review</span>
            <textarea
              maxLength={500}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Describe the community, events, and why badge holders recommend it."
              rows={4}
              value={body}
            />
          </label>

          <div className="channel-profile-review-compose-actions">
            <button className="primary-action" onClick={handleSubmit} type="button">
              Post review
            </button>
            {notice ? <span className="report-pulse">{notice}</span> : null}
          </div>
        </article>
      ) : notice ? (
        <p className="report-pulse">{notice}</p>
      ) : null}

      {reviews.length === 0 ? (
        <div className="channel-profile-empty-state">
          <p>No community reviews yet. Verified badge holders can be the first to share their experience.</p>
        </div>
      ) : (
        <div className="channel-profile-review-list">
          {reviews.map((review) => (
            <article className="channel-profile-review-card" key={review.id}>
              <div className="channel-profile-review-card-head">
                <ReviewAuthorAvatar memberId={review.memberId} memberName={review.memberName} {...(props.onOpenMember ? { onOpenMember: props.onOpenMember } : {})} />

                <div>
                  <div className="channel-profile-review-card-meta">
                    <button
                      className="channel-profile-review-author"
                      onClick={() => props.onOpenMember?.(review.memberId)}
                      type="button"
                    >
                      {review.memberName}
                    </button>
                    <span className="channel-profile-review-stars" aria-label={review.rating + ' out of 5 stars'}>
                      {renderRatingStars(review.rating)}
                    </span>
                  </div>
                  <small>
                    {review.badgeLabel} badge · {review.createdAtLabel}
                  </small>
                </div>
              </div>

              <strong>{review.title}</strong>
              <p>{review.body}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewAuthorAvatar(props: {
  memberId: string;
  memberName: string;
  onOpenMember?: (memberId: string) => void;
}): ReactElement {
  const member = useMemo((): NamiMember => {
    return {
      id: props.memberId,
      surfaceType: 'member',
      avatarSeed: props.memberName.slice(0, 2).toUpperCase(),
      name: props.memberName,
      signal: 'Green',
      tier: 'Adventurer',
      badge: 'Reviewer',
    };
  }, [props.memberId, props.memberName]);

  if (!props.onOpenMember) {
    return <UniformMemberAvatar member={member} />;
  }

  return (
    <button className="channel-profile-review-avatar-button" onClick={() => props.onOpenMember?.(props.memberId)} type="button">
      <UniformMemberAvatar member={member} />
    </button>
  );
}