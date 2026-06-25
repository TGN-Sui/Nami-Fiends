import { useMemo, useState, type ReactElement } from 'react';

import { readMemberChannelBadgeLabel } from './channel-game-badge-store.js';
import {
  getCommentsForReview,
  submitChannelOwnerReviewComment,
  useChannelGameReviewComments,
} from './channel-game-review-comments-store.js';
import {
  averageChannelGameReviewRating,
  canSubmitChannelGameReview,
  getChannelGameReviewEligibility,
  getChannelGameReviews,
  submitChannelGameReview,
  useChannelGameReviewsStore,
} from './channel-game-reviews-store.js';
import { ownsGameChannel } from './channel-owner-access.js';
import { getSelfMember } from './member-access.js';
import { LegendReviewMeter } from './LegendReviewMeter.js';
import { UniformMemberAvatar } from './member-avatar.js';
import type { NamiChannel, NamiMember } from './uiMockData.js';

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
  useChannelGameReviewComments();
  const selfMember = getSelfMember();
  const reviews = useMemo(() => getChannelGameReviews(props.channel.id), [allReviews, props.channel.id]);
  const averageRating = averageChannelGameReviewRating(props.channel.id);
  const eligibility = getChannelGameReviewEligibility(selfMember, props.channel.id);
  const canSubmit = canSubmitChannelGameReview(selfMember, props.channel.id);
  const ownedBadge = readMemberChannelBadgeLabel(selfMember.id, props.channel.id);
  const isOwnChannelOwner = ownsGameChannel(props.channel.id);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notice, setNotice] = useState('');
  const [activeCommentReviewId, setActiveCommentReviewId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentNotice, setCommentNotice] = useState('');

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
            Player-written reviews from verified members who own a badge from {props.channel.name}.
            {isOwnChannelOwner
              ? ' You can reply to reviews on your channel — posting new reviews is disabled.'
              : ' Channel owners cannot edit this wall.'}
          </p>
        </div>

        <div className="channel-profile-review-summary" aria-label="Average community Legend rating">
          {averageRating !== null ? (
            <>
              <LegendReviewMeter className="channel-profile-review-summary-meter" value={averageRating} />
              <small>{reviews.length} review{reviews.length === 1 ? '' : 's'}</small>
            </>
          ) : (
            <small>No reviews yet</small>
          )}
        </div>
      </div>

      {!isOwnChannelOwner ? (
        <article className="channel-profile-review-eligibility-card">
          <span className="channel-profile-review-lock-label">Badge-gated reviews</span>
          <p>{eligibilityMessage(eligibility, props.channel.name)}</p>
          {ownedBadge ? <span className="channel-profile-review-owned-badge">Your badge: {ownedBadge}</span> : null}
        </article>
      ) : (
        <article className="channel-profile-review-eligibility-card is-owner-review-note">
          <span className="channel-profile-review-lock-label">Owner replies</span>
          <p>Use Comment on reviews below to respond to players on your game channel.</p>
        </article>
      )}

      {canSubmit ? (
        <article className="channel-profile-review-compose-card">
          <h3>Share your review</h3>

          <LegendReviewMeter onChange={setRating} value={rating} />

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

      {commentNotice ? <p className="report-pulse">{commentNotice}</p> : null}

      {reviews.length === 0 ? (
        <div className="channel-profile-empty-state">
          <p>No community reviews yet. Verified badge holders can be the first to share their experience.</p>
        </div>
      ) : (
        <div className="channel-profile-review-list">
          {reviews.map((review) => {
            const reviewComments = getCommentsForReview(review.id);
            const isCommenting = activeCommentReviewId === review.id;

            return (
              <article className="channel-profile-review-card" key={review.id}>
                <div className="channel-profile-review-card-head">
                  <ReviewAuthorAvatar
                    memberId={review.memberId}
                    memberName={review.memberName}
                    {...(props.onOpenMember ? { onOpenMember: props.onOpenMember } : {})}
                  />

                  <div>
                    <div className="channel-profile-review-card-meta">
                      <button
                        className="channel-profile-review-author"
                        onClick={() => props.onOpenMember?.(review.memberId)}
                        type="button"
                      >
                        {review.memberName}
                      </button>
                      <LegendReviewMeter compact showValue={false} value={review.rating} />
                    </div>
                    <small>
                      {review.badgeLabel} badge · {review.createdAtLabel}
                    </small>
                  </div>
                </div>

                <strong>{review.title}</strong>
                <p>{review.body}</p>

                {isOwnChannelOwner ? (
                  <div className="channel-profile-review-owner-reply-block">
                    <button
                      className="nami-surface-button channel-profile-review-comment-button"
                      onClick={() => {
                        setCommentNotice('');
                        setActiveCommentReviewId(isCommenting ? null : review.id);
                        setCommentDraft('');
                      }}
                      type="button"
                    >
                      {isCommenting ? 'Close' : 'Comment'}
                    </button>

                    {isCommenting ? (
                      <div className="channel-profile-review-comment-compose">
                        <label className="channel-profile-review-field">
                          <span>Owner reply</span>
                          <textarea
                            maxLength={400}
                            onChange={(event) => setCommentDraft(event.target.value)}
                            placeholder="Thank the reviewer or clarify updates for your community."
                            rows={3}
                            value={commentDraft}
                          />
                        </label>
                        <button
                          className="primary-action"
                          onClick={() => {
                            const result = submitChannelOwnerReviewComment({
                              reviewId: review.id,
                              channelId: props.channel.id,
                              authorMemberId: selfMember.id,
                              authorName: selfMember.name,
                              body: commentDraft,
                            });

                            if (!result.ok) {
                              setCommentNotice(result.reason);
                              return;
                            }

                            setCommentDraft('');
                            setActiveCommentReviewId(null);
                            setCommentNotice('Owner comment posted.');
                          }}
                          type="button"
                        >
                          Post comment
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {reviewComments.length > 0 ? (
                  <div className="channel-profile-review-comment-list">
                    {reviewComments.map((comment) => (
                      <article className="channel-profile-review-comment" key={comment.id}>
                        <span className="mini-badge">Owner</span>
                        <strong>{comment.authorName}</strong>
                        <p>{comment.body}</p>
                        <small>{comment.createdAtLabel}</small>
                      </article>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
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