import {
  useMemo,
  useState,
  type ReactElement,
  type ReactNode
} from 'react';

import type {
  BadgeSummary,
  ChannelSummary,
  CommunitySummary,
  CosmeticSummary,
  PassportSummary,
  ProfileSummary,
  TitleSummary
} from './types.js';

const samplePassport: PassportSummary = {
  owner: '0xUSER',
  passportId: '0xPASSPORT',
  identityId: '0xIDENTITY',
  level: 18,
  xp: 1840,
  reputation: 'Gamester',
  membershipTier: 'Adventurer',
  conductSignal: 'Green'
};

const sampleProfile: ProfileSummary = {
  displayName: 'NPC Gamer',
  bio: 'Portable gamer identity powered by Sui.',
  avatarRef: 'avatar://nami-default',
  isPublic: true
};

const sampleBadges: BadgeSummary[] = [
  {
    label: 'First Quest',
    badgeType: 'Basic',
    points: 1
  },
  {
    label: 'Community Event',
    badgeType: 'Event',
    points: 2
  },
  {
    label: 'Verified Completion',
    badgeType: 'Completion',
    points: 3
  }
];

const sampleTitles: TitleSummary[] = [
  {
    label: 'Gamester',
    equipped: true
  },
  {
    label: 'Goblin',
    equipped: false
  }
];

const sampleCosmetics: CosmeticSummary[] = [
  {
    label: 'Genesis Frame',
    cosmeticType: 'Profile Frame',
    equipped: true
  },
  {
    label: 'Wave Passport Theme',
    cosmeticType: 'Passport Theme',
    equipped: false
  }
];

const sampleChannels: ChannelSummary[] = [
  {
    name: 'Main Channel',
    verified: true,
    allowNpcChat: false
  },
  {
    name: 'Casual Lobby',
    verified: false,
    allowNpcChat: true
  }
];

const sampleCommunity: CommunitySummary = {
  squads: 1,
  guilds: 2
};

function signalClass(signal: PassportSummary['conductSignal']): string {
  return `signal signal-${signal.toLowerCase()}`;
}

function tierLabel(tier: PassportSummary['membershipTier']): string {
  if (tier === 'NPC') {
    return 'NPC / Free';
  }

  return tier;
}

function StatCard(props: {
  label: string;
  value: string | number;
  note: string;
}): ReactElement {
  return (
    <article className="stat-card">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
      <p>{props.note}</p>
    </article>
  );
}

function Section(props: {
  title: string;
  description: string;
  children: ReactNode;
}): ReactElement {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>{props.title}</h2>
          <p>{props.description}</p>
        </div>
      </div>
      {props.children}
    </section>
  );
}

export function App(): ReactElement {
  const [walletAddress, setWalletAddress] = useState('');
  const [packageId, setPackageId] = useState(
    import.meta.env.VITE_NAMI_PACKAGE_ID ?? ''
  );

  const activePassport = useMemo<PassportSummary>(() => {
    if (walletAddress.trim() === '') {
      return samplePassport;
    }

    return {
      ...samplePassport,
      owner: walletAddress.trim()
    };
  }, [walletAddress]);

  return (
    <main className="app-shell">
      <header className="hero">
        <nav className="top-nav">
          <div className="brand">
            <div className="brand-mark">N</div>
            <div>
              <span>Nami Chat</span>
              <small>Gaming identity protocol</small>
            </div>
          </div>

          <div className="status-pill">MVP Preview</div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Portable gamer identity</p>
            <h1>Your Passport for gaming communities.</h1>
            <p>
              Nami connects Identity, Passport, reputation, conduct, channels,
              squads, guilds, profiles, titles, cosmetics, recovery, and
              moderation into one gamer-native trust layer.
            </p>
          </div>

          <div className="connect-card">
            <label htmlFor="walletAddress">Wallet / zkLogin Address</label>
            <input
              id="walletAddress"
              placeholder="0x..."
              value={walletAddress}
              onChange={(event) => setWalletAddress(event.target.value)}
            />

            <label htmlFor="packageId">Nami Package ID</label>
            <input
              id="packageId"
              placeholder="0x..."
              value={packageId}
              onChange={(event) => setPackageId(event.target.value)}
            />

            <p>
              This screen is currently a UI foundation. SDK and backend data
              wiring comes next.
            </p>
          </div>
        </div>
      </header>

      <section className="passport-card">
        <div className="avatar-orb">🎮</div>

        <div className="passport-main">
          <div className="profile-title-row">
            <div>
              <p className="eyebrow">Public Profile</p>
              <h2>{sampleProfile.displayName}</h2>
              <p>{sampleProfile.bio}</p>
            </div>

            <span className={signalClass(activePassport.conductSignal)}>
              {activePassport.conductSignal}
            </span>
          </div>

          <div className="passport-meta">
            <span>Owner: {activePassport.owner}</span>
            <span>Passport: {activePassport.passportId}</span>
            <span>Identity: {activePassport.identityId}</span>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          label="Membership"
          value={tierLabel(activePassport.membershipTier)}
          note="Access benefits are based on effective tier."
        />
        <StatCard
          label="Level"
          value={activePassport.level}
          note={`${activePassport.xp.toLocaleString()} XP earned`}
        />
        <StatCard
          label="Reputation"
          value={activePassport.reputation}
          note="Earned through meaningful activity."
        />
        <StatCard
          label="Communities"
          value={`${sampleCommunity.squads} Squad / ${sampleCommunity.guilds} Guilds`}
          note="Small trust groups and larger communities."
        />
      </section>

      <div className="content-grid">
        <Section
          title="Badges"
          description="Achievement and participation proofs."
        >
          <div className="list-stack">
            {sampleBadges.map((badge) => (
              <div className="list-row" key={badge.label}>
                <div>
                  <strong>{badge.label}</strong>
                  <span>{badge.badgeType} Badge</span>
                </div>
                <span>{badge.points} pts</span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Titles"
          description="Earned identity labels from reputation."
        >
          <div className="list-stack">
            {sampleTitles.map((title) => (
              <div className="list-row" key={title.label}>
                <div>
                  <strong>{title.label}</strong>
                  <span>{title.equipped ? 'Equipped' : 'Unlocked'}</span>
                </div>
                <span>{title.equipped ? 'Active' : 'Idle'}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Cosmetics"
          description="Profile identity and visual customization."
        >
          <div className="list-stack">
            {sampleCosmetics.map((cosmetic) => (
              <div className="list-row" key={cosmetic.label}>
                <div>
                  <strong>{cosmetic.label}</strong>
                  <span>{cosmetic.cosmeticType}</span>
                </div>
                <span>{cosmetic.equipped ? 'Equipped' : 'Unlocked'}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Channels"
          description="Creator and community spaces with access rules."
        >
          <div className="list-stack">
            {sampleChannels.map((channel) => (
              <div className="list-row" key={channel.name}>
                <div>
                  <strong>{channel.name}</strong>
                  <span>
                    {channel.verified ? 'Verified Channel' : 'Unverified Channel'}
                  </span>
                </div>
                <span>{channel.allowNpcChat ? 'NPC Chat On' : 'NPC Chat Off'}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <section className="roadmap-strip">
        <div>
          <strong>Next wiring step</strong>
          <span>
            Connect this UI to the SDK read helpers and backend indexed events.
          </span>
        </div>

        <div>
          <strong>Safety rule</strong>
          <span>
            Black Passport pauses active benefits without erasing earned
            history.
          </span>
        </div>

        <div>
          <strong>MVP direction</strong>
          <span>
            Build product surface first, then run the Break-the-System suite.
          </span>
        </div>
      </section>
    </main>
  );
}