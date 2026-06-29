import { describe, expect, it } from 'vitest';

import {
  eventRewardConditionSummary,
  eventRewardDetailsHiddenFromViewer,
  eventRewardKindRequiresNamiSeal,
  eventRewardRequiresGamerLockIn,
  eventRewardSealedStatusLabel,
  normalizeEventRewardAttachment,
} from './event-reward-attachments.js';

describe('event-reward-attachments', () => {
  it('only requires Nami seal for cosmetic and badge rewards', () => {
    expect(eventRewardKindRequiresNamiSeal('cosmetic')).toBe(true);
    expect(eventRewardKindRequiresNamiSeal('badge')).toBe(true);
    expect(eventRewardKindRequiresNamiSeal('description')).toBe(false);
    expect(eventRewardKindRequiresNamiSeal('link')).toBe(false);
    expect(eventRewardKindRequiresNamiSeal('move-object')).toBe(false);
    expect(eventRewardKindRequiresNamiSeal('nft')).toBe(false);
  });

  it('normalizes sealRequired from reward kind', () => {
    const cosmetic = normalizeEventRewardAttachment(
      { kind: 'cosmetic', label: 'Wave Frame', catalogRef: 'overlay-wave' },
      'fiends-event-1'
    );

    expect(cosmetic.sealRequired).toBe(true);
    expect(cosmetic.unlockCondition).toEqual({ type: 'event-attendance', eventId: 'fiends-event-1' });

    const link = normalizeEventRewardAttachment(
      { kind: 'link', label: 'Claim page', linkUrl: 'https://example.com/claim' },
      'fiends-event-1'
    );

    expect(link.sealRequired).toBe(false);
  });

  it('hides sealed reward details from gamers but not hosts or officials', () => {
    const attachment = normalizeEventRewardAttachment(
      { kind: 'badge', label: 'Secret Badge', catalogRef: 'badge-secret' },
      'event-1'
    );

    attachment.sealedEvidenceId = 'seal-official-1';

    expect(
      eventRewardDetailsHiddenFromViewer(attachment, {
        viewerIsOfficialOwner: false,
        viewerCanManageEventRewards: false,
      })
    ).toBe(true);
    expect(
      eventRewardDetailsHiddenFromViewer(attachment, {
        viewerIsOfficialOwner: true,
        viewerCanManageEventRewards: false,
      })
    ).toBe(false);
    expect(
      eventRewardDetailsHiddenFromViewer(attachment, {
        viewerIsOfficialOwner: false,
        viewerCanManageEventRewards: true,
      })
    ).toBe(false);
    expect(eventRewardSealedStatusLabel()).toBe('Reward Sealed');
    expect(eventRewardConditionSummary(attachment, 'Launch Night')).toContain('Launch Night');
  });

  it('prompts gamer lock-in only for official-sealed cosmetic rewards', () => {
    const attachment = normalizeEventRewardAttachment(
      { kind: 'cosmetic', label: 'Genesis Spark', catalogRef: 'overlay-genesis' },
      'event-1'
    );

    expect(eventRewardRequiresGamerLockIn(attachment, null)).toBe(false);

    attachment.sealedEvidenceId = 'seal-official-1';
    expect(eventRewardRequiresGamerLockIn(attachment, null)).toBe(true);
    expect(eventRewardRequiresGamerLockIn(attachment, 'seal-member-1')).toBe(false);
  });
});