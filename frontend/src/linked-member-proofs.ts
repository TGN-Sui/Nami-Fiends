import type { PassportProtocolView } from '@nami/sdk';

import type { NamiLinkedProfile } from './nami-linked-profile-api.js';
import type { ProtocolOwnerSource } from './wallet.js';

export type PassportProofCard = {
  title: string;
  status: string;
  detail: string;
  category: string;
};

function proofStatusLabel(
  verified: boolean,
  pendingLabel = 'Pending',
  verifiedLabel = 'Verified',
  missingLabel = 'Not linked'
): string {
  return verified ? verifiedLabel : pendingLabel;
}

export function buildPassportProofs(input: {
  linkedProfile: NamiLinkedProfile | null;
  passportView: PassportProtocolView | null | undefined;
  protocolSource: ProtocolOwnerSource;
  suiNsPublic: boolean;
}): PassportProofCard[] {
  const linked = input.linkedProfile;
  const verified = linked?.proof.status === 'verified';
  const nodename = linked?.anchor.nodename?.trim() ?? linked?.offchain.claimNodename?.trim() ?? null;
  const conductLabel = linked?.progression?.conductSignalLabel ?? 'Unknown';
  const conductClear =
    linked?.progression?.conductSignal === null ||
    linked?.progression?.conductSignal === 1 ||
    conductLabel === 'Green';

  const signInProof =
    input.protocolSource === 'zklogin'
      ? 'zkLogin address owns your on-chain passport objects.'
      : input.protocolSource === 'wallet' || input.protocolSource === 'linked'
        ? 'Connected wallet owns your on-chain passport objects.'
        : 'Connect zkLogin or wallet to prove passport ownership on this device.';

  return [
    {
      title: 'Passport Ownership',
      status: verified ? 'Verified' : linked ? 'Partial' : 'Not found',
      detail: verified
        ? 'Identity and passport objects are owned and cross-linked at this address.'
        : signInProof,
      category: 'Identity',
    },
    {
      title: 'Account Linked',
      status: verified || input.protocolSource === 'zklogin' ? 'Verified' : 'Connect',
      detail:
        input.protocolSource === 'zklogin'
          ? 'Google zkLogin session is active for this passport wallet.'
          : 'Link zkLogin or wallet so partner platforms can resolve your Nami identity.',
      category: 'Sign-In',
    },
    {
      title: 'Nodename',
      status: nodename ? (verified ? 'Verified' : 'Reserved') : 'Not minted',
      detail: nodename
        ? input.suiNsPublic
          ? `${nodename} is your immutable on-chain handle.`
          : `${nodename} is connected${verified ? '' : ' (claim approved, mint pending)'}.`
        : 'Mint your passport with enter_nami to lock your nodename on-chain.',
      category: 'Name Proof',
    },
    {
      title: 'Cross-Platform Proof',
      status: verified ? 'Portable' : 'Unavailable',
      detail: verified
        ? 'Other Nami-integrated platforms can trust this wallet without a new claim.'
        : 'Complete passport mint so partner platforms can hydrate your linked profile.',
      category: 'Integrator',
    },
    {
      title: 'Developer Approval',
      status: 'Not Requested',
      detail: 'Developer trust is approval-based and never purchased by subscription.',
      category: 'Developer Trust',
    },
    {
      title: 'Moderation Standing',
      status: conductClear ? 'Clear' : conductLabel,
      detail: conductClear
        ? 'No active conduct restrictions on this passport.'
        : `Conduct signal: ${conductLabel}.`,
      category: 'Safety',
    },
    {
      title: 'Live Passport Read',
      status: input.passportView?.passport ? 'Synced' : 'Unavailable',
      detail: input.passportView?.passport
        ? `Level ${input.passportView.passport.level} · ${input.passportView.passport.membershipTierLabel}`
        : 'Indexer or chain read not available for this wallet yet.',
      category: 'Chain',
    },
  ];
}