import { useMemo } from 'react';

import { useMemberSession } from './member-session-store.js';
import { useNamiAdminStore } from './nami-admin-store.js';
import { useLinkedPlayerPlatforms } from './player-link-store.js';
import { computePlayerScore, type PlayerScoreBreakdown } from './player-score.js';
import { usePassportQuery } from './protocol-query.js';
import { useProtocolOwner } from './wallet.js';
import { useXVerificationState } from './x-verification-store.js';

export function usePlayerScoreSnapshot(options?: {
  guildStandingVerified?: boolean;
}): PlayerScoreBreakdown | null {
  const session = useMemberSession();
  const linkedPlatforms = useLinkedPlayerPlatforms();
  const xVerification = useXVerificationState();
  const { owner, source } = useProtocolOwner();
  const { userClaimStatus } = useNamiAdminStore();
  const { data: passportView } = usePassportQuery();

  return useMemo(() => {
    if (!session) {
      return null;
    }

    return computePlayerScore({
      displayName: session.displayName,
      email: session.email,
      quizAnswers: session.quizAnswers,
      linkedPlatforms,
      xVerified: xVerification.verified,
      walletLinked: owner !== null,
      walletSource: source,
      claimApproved: userClaimStatus.status === 'approved',
      hasOnChainPassport: passportView?.passport != null,
      moderationClear: true,
      guildStandingVerified: options?.guildStandingVerified ?? true,
    });
  }, [
    session,
    linkedPlatforms,
    xVerification.verified,
    owner,
    source,
    userClaimStatus.status,
    passportView?.passport,
    options?.guildStandingVerified,
  ]);
}