export type TestnetLegalPolicyId = 'privacy' | 'community';

export type TestnetLegalSection = {
  heading: string;
  body: string;
};

export type TestnetLegalPolicy = {
  id: TestnetLegalPolicyId;
  title: string;
  subtitle: string;
  sections: TestnetLegalSection[];
};

export const TESTNET_BETA_NOTICE =
  'Nami testnet beta — features, policies, and payments may change. Not legal advice; counsel review before mainnet.';

export const TESTNET_LEGAL_POLICIES: TestnetLegalPolicy[] = [
  {
    id: 'privacy',
    title: 'Privacy Guidelines (Draft)',
    subtitle: 'Testnet draft — finalize with counsel before mainnet.',
    sections: [
      {
        heading: 'Scope',
        body:
          'Covers the Nami web portal, receiving server (indexer + HTTP API), and on-chain protocol interactions during testnet.',
      },
      {
        heading: 'Data we collect',
        body:
          'Wallet identity (Sui address, zkLogin subject), profile and passport data (on-chain + cached indexer), officials submissions, payment metadata when enabled, media uploads, and basic hosting analytics. We do not store Google passwords.',
      },
      {
        heading: 'Data we do not sell',
        body:
          'Nami does not sell personal data. Official testnet builds disable demo personas — live data reflects real user actions.',
      },
      {
        heading: 'On-chain transparency',
        body:
          'Passport, badge, and moderation state on Sui is public by design. Treat on-chain display names and enforcement flags as visible to anyone with a block explorer.',
      },
      {
        heading: 'User controls',
        body:
          'Sign out clears zkLogin session in the browser. On-chain data is viewable via explorer; full export UI is not on testnet. Deletion requests go through support; on-chain objects may need owner-assisted recovery.',
      },
      {
        heading: 'Security (testnet)',
        body:
          'HTTPS on public deploy origins, wallet signature for officials sync on test launch, mock payment providers disabled when NAMI_TEST_LAUNCH=true, and server-only sync secrets never in frontend env.',
      },
    ],
  },
  {
    id: 'community',
    title: 'Community Guidelines (Draft)',
    subtitle: 'Testnet community standards — may change during beta.',
    sections: [
      {
        heading: 'Purpose',
        body:
          'Nami is a gaming community platform. These guidelines keep channels, guilds, and global chats welcoming while moderation tooling scales.',
      },
      {
        heading: 'Core rules',
        body:
          'Respect people (no harassment or hate speech), no impersonation, honest identity for passport and nodename claims, safe content, no spam or scam links, and follow channel-specific rules within these bounds.',
      },
      {
        heading: 'Enforcement (testnet)',
        body:
          'Official owner may warn, mute, channel-ban, or apply Black passport restrictions per the conduct system. Members may appeal via the recovery and appeals flow. UI moderators are placeholders until delegated caps ship.',
      },
      {
        heading: 'Studios and game channels',
        body:
          'Submit games via Enter Nami — no false approval claims. Trust Score reflects linked platforms; do not falsify playtime or reviews. Partner banners require officials review.',
      },
      {
        heading: 'Gifts, boosts, and payments',
        body:
          'No chargeback abuse or fraudulent payment testing on real cards. Mock checkout is disabled on official testnet builds. Treasury and membership terms post before paid tiers go live.',
      },
      {
        heading: 'Reporting',
        body:
          'Report issues via the in-app officials suggestion flow (synced to the receiving server) or the support email published at launch. Include channel name, wallet or display name, and screenshots where helpful.',
      },
    ],
  },
];

export function resolveTestnetLegalPolicy(id: TestnetLegalPolicyId): TestnetLegalPolicy {
  return TESTNET_LEGAL_POLICIES.find((policy) => policy.id === id) ?? TESTNET_LEGAL_POLICIES[0]!;
}