import { useMemo, useState, type CSSProperties, type ReactElement, useEffect } from 'react';

import {
  channels,
  chatMessages,
  members,
  navItems,
  userProfile,
  type ConductSignal,
  type NamiChannel,
  type NamiPage
} from './uiMockData.js';

function signalClass(signal: ConductSignal): string {
  return 'signal-ring signal-' + signal.toLowerCase();
}

function ChannelAvatar(props: {
  channel: NamiChannel;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
}): ReactElement {
  const className =
    'channel-avatar channel-avatar-' +
    (props.size ?? 'md') +
    ' ' +
    signalClass(props.channel.signal) +
    (props.selected ? ' is-selected' : '');

  const label = props.channel.name.slice(0, 2).toUpperCase();

  if (props.onClick) {
    return (
      <button
        className={className}
        onClick={props.onClick}
        type="button"
        title={props.channel.name}
      >
        <span>{label}</span>
      </button>
    );
  }

  return (
    <div className={className} title={props.channel.name}>
      <span>{label}</span>
    </div>
  );
}

function Sidebar(props: {
  activePage: NamiPage;
  collapsed: boolean;
  onNavigate: (page: NamiPage) => void;
  onToggle: () => void;
}): ReactElement {
  return (
    <aside className={'sidebar ' + (props.collapsed ? 'is-collapsed' : '')}>
      <button
        className="sidebar-brand"
        onClick={() => props.onNavigate('gamehub')}
        type="button"
      >
        <div className="diamond-mark">N</div>
        {!props.collapsed && <span>Game Hub</span>}
      </button>

      <button className="sidebar-toggle" onClick={props.onToggle} type="button">
        {props.collapsed ? '→' : '←'}
      </button>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.page}
            className={props.activePage === item.page ? 'is-active' : ''}
            onClick={() => props.onNavigate(item.page)}
            type="button"
          >
            <span className="nav-icon">{item.shortLabel.slice(0, 1)}</span>
            {!props.collapsed && <span>{item.shortLabel}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function FeaturedRail(props: {
  title: string;
  selectedChannel: NamiChannel;
  onSelect: (channel: NamiChannel) => void;
  onlySubscribed?: boolean;
}): ReactElement {
  const visibleChannels = props.onlySubscribed ? channels.slice(0, 4) : channels;

  return (
    <section className="feature-rail">
      <div className="rail-heading">
        <h2>{props.title}</h2>
        <p>{props.onlySubscribed ? 'Your pinned channels' : 'Featured discovery'}</p>
      </div>

      <div className="rail-scroll">
        {visibleChannels.map((channel) => (
          <div className="rail-item" key={channel.id}>
            <ChannelAvatar
              channel={channel}
              selected={channel.id === props.selectedChannel.id}
              onClick={() => props.onSelect(channel)}
            />
            <span>{channel.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ChannelInfoCard(props: {
  channel: NamiChannel;
  onSubscribe?: () => void;
  onJoinChat?: () => void;
  onGetBanners?: () => void;
}): ReactElement {
  return (
    <article className="channel-info-card">
      <ChannelAvatar channel={props.channel} size="lg" />
      <div>
        <div className="badge-row">
          {props.channel.verified && <span className="mini-badge">Verified</span>}
          {props.channel.partner && <span className="mini-badge">Partner</span>}
          <span className={'mini-badge signal-text-' + props.channel.signal.toLowerCase()}>
            {props.channel.signal}
          </span>
        </div>

        <h2>{props.channel.name}</h2>
        <p>{props.channel.tagline}</p>

        <dl>
          <div>
            <dt>Owner</dt>
            <dd>{props.channel.owner}</dd>
          </div>
          <div>
            <dt>Genre</dt>
            <dd>{props.channel.genre}</dd>
          </div>
          <div>
            <dt>Platforms</dt>
            <dd>{props.channel.platforms.join(', ')}</dd>
          </div>
          <div>
            <dt>Subscribers</dt>
            <dd>{props.channel.subscribers.toLocaleString()}</dd>
          </div>
        </dl>

        <div className="action-row">
          <button onClick={props.onSubscribe} type="button">Subscribe</button>
          <button onClick={props.onJoinChat} type="button">Join Chat</button>
          <button onClick={props.onGetBanners} type="button">Get Banners</button>
        </div>
      </div>
    </article>
  );
}

function ModuleGrid(props: {
  channel: NamiChannel;
  onNavigate?: (page: NamiPage) => void;
}): ReactElement {
  const modules =
    props.channel.modules.length > 0
      ? props.channel.modules
      : channels.find((channel) => channel.id === 'fiends')?.modules ?? [];

  return (
    <div className="module-grid">
      {modules.map((module) => (
        <button
          className="module-card"
          key={module.label}
          onClick={() => {
            const label = module.label.toLowerCase();

            if (label.includes('chat')) {
              props.onNavigate?.('chat');
            } else if (label.includes('profile')) {
              props.onNavigate?.('channelProfile');
            }
          }}
          type="button"
        >
          <strong>{module.label}</strong>
          <span>{module.description}</span>
        </button>
      ))}
    </div>
  );
}

function NamiHub(props: {
  selectedChannel: NamiChannel;
  onSelect: (channel: NamiChannel) => void;
  onOpenProfile: (channel: NamiChannel) => void;
}): ReactElement {
  const [bubbleCursor, setBubbleCursor] = useState({
    x: 50,
    y: 50,
    active: false
  });

  const bubbleSeed = useMemo(() => {
    return Math.floor(Math.random() * 100000);
  }, []);

  const topCommunities = useMemo(() => {
    const items: Array<{
      channel: NamiChannel;
      rank: number;
    }> = [];

    for (let index = 0; index < 50; index += 1) {
      const channel = channels[index % channels.length];

      if (channel) {
        items.push({
          channel,
          rank: index + 1
        });
      }
    }

    return items;
  }, []);

  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  function seededFraction(seed: number): number {
    const value = Math.sin((seed + bubbleSeed) * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  }

  function getBubbleLayout(index: number): {
    x: number;
    y: number;
    size: number;
  } {
    const columns = 10;
    const rows = 5;
    const totalSlots = columns * rows;
    const randomizedSlot = (index * 37 + bubbleSeed) % totalSlots;
    const column = randomizedSlot % columns;
    const row = Math.floor(randomizedSlot / columns);

    const rankScore = 1 - index / Math.max(topCommunities.length - 1, 1);
    const rankScale = Math.pow(rankScore, 1.85);

    const jitterX = (seededFraction(index + 11) - 0.5) * 5.5;
    const jitterY = (seededFraction(index + 29) - 0.5) * 7.5;

    return {
      x: clamp(((column + 0.5) / columns) * 100 + jitterX, 5, 95),
      y: clamp(((row + 0.5) / rows) * 100 + jitterY, 8, 92),
      size: 38 + rankScale * 78
    };
  }

  const bubblePhysicsNodes = useMemo(() => {
    const nodes = topCommunities.map((item, index) => {
      const layout = getBubbleLayout(index);
      const dx = layout.x - bubbleCursor.x;
      const dy = layout.y - bubbleCursor.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const safeDistance = distance === 0 ? 1 : distance;

      const rawInfluence = bubbleCursor.active
        ? Math.max(0, 1 - distance / 34)
        : 0;

      const easedInfluence =
        rawInfluence * rawInfluence * (3 - 2 * rawInfluence);

      const zoomCurve =
        easedInfluence === 0
          ? 0
          : 1 - Math.pow(1 - easedInfluence, 2.65);

      const cursorPushCurve =
        easedInfluence * (1 - Math.pow(easedInfluence, 2.15) * 0.48);

      const closeRangeDamping = Math.max(0.28, distance / 34);

      const isSmallBubble = layout.size <= 58 || item.rank > 18;

      const cursorForce = isSmallBubble
        ? 9 * cursorPushCurve * closeRangeDamping
        : 13 * cursorPushCurve * closeRangeDamping;

      const direction = isSmallBubble ? -1 : 1;

      const translateX = direction * (dx / safeDistance) * cursorForce;
      const translateY = direction * (dy / safeDistance) * cursorForce;

      const scale = 1 + zoomCurve * (isSmallBubble ? 0.36 : 0.28);
      const radius = (layout.size / 15) * scale;

      return {
        channel: item.channel,
        rank: item.rank,
        index,
        x: clamp(layout.x + translateX, 4, 96),
        y: clamp(layout.y + translateY, 6, 94),
        size: layout.size,
        radius,
        scale,
        influence: easedInfluence,
        glow: 10 + zoomCurve * (isSmallBubble ? 48 : 42),
        insetGlow: 5 + zoomCurve * (isSmallBubble ? 24 : 20)
      };
    });

    for (let iteration = 0; iteration < 6; iteration += 1) {
      for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
          const left = nodes[leftIndex];
          const right = nodes[rightIndex];

          if (!left || !right) {
            continue;
          }

          const dx = right.x - left.x;
          const dy = right.y - left.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const safeDistance = distance === 0 ? 0.01 : distance;
          const minimumDistance = left.radius + right.radius + 1.1;

          if (safeDistance >= minimumDistance) {
            continue;
          }

          const overlap = minimumDistance - safeDistance;
          const normalX = dx / safeDistance;
          const normalY = dy / safeDistance;

          const leftMass = 1 + (topCommunities.length - left.index) / topCommunities.length;
          const rightMass = 1 + (topCommunities.length - right.index) / topCommunities.length;

          const leftMove = overlap * (rightMass / (leftMass + rightMass)) * 0.72;
          const rightMove = overlap * (leftMass / (leftMass + rightMass)) * 0.72;

          left.x = clamp(left.x - normalX * leftMove, 4, 96);
          left.y = clamp(left.y - normalY * leftMove, 6, 94);
          right.x = clamp(right.x + normalX * rightMove, 4, 96);
          right.y = clamp(right.y + normalY * rightMove, 6, 94);
        }
      }
    }

    return nodes;
  }, [bubbleCursor, bubbleSeed, topCommunities]);

  function getBubbleStyle(index: number): CSSProperties {
    const node = bubblePhysicsNodes[index];

    if (!node) {
      return {};
    }

    return {
      left: String(node.x) + '%',
      top: String(node.y) + '%',
      width: String(node.size) + 'px',
      height: String(node.size) + 'px',
      transform:
        'translate(-50%, -50%) scale(' +
        node.scale.toFixed(3) +
        ')',
      zIndex: Math.round(10 + node.influence * 50 + (50 - index) / 8),
      boxShadow:
        '0 0 ' +
        node.glow.toFixed(0) +
        'px currentColor, inset 0 0 ' +
        node.insetGlow.toFixed(0) +
        'px rgba(255,255,255,0.08)'
    };
  }

  return (
    <>
      <header className="page-title">
        <p>Signed-in dashboard</p>
        <h1>Nami Hub</h1>
      </header>

      <section className="banner-panel">
        <span>Featured Partner Banner Carousel</span>
        <strong>{props.selectedChannel.name}</strong>
      </section>

      <FeaturedRail
        title="Community Showcase"
        selectedChannel={props.selectedChannel}
        onSelect={props.onSelect}
      />

      <section className="dashboard-grid dashboard-grid-compact">
        <article className="panel">
          <h2>Community Growth</h2>
          {channels.map((channel, index) => (
            <div className="growth-row" key={channel.id}>
              <span>{channel.handle}</span>
              <div>
                <i style={{ width: String(92 - index * 12) + '%' }} />
              </div>
              <strong>{channel.subscribers.toLocaleString()}</strong>
            </div>
          ))}
        </article>

        <article className="panel">
          <h2>Latest Names</h2>
          <ul className="simple-list">
            <li>exavil@talise</li>
            <li>mint85@talise</li>
            <li>rom378@talise</li>
            <li>victory@talise</li>
          </ul>
        </article>

        <article className="panel bubble-panel-wide">
          <div className="bubble-panel-heading">
            <div>
              <h2>Top 50 Communities</h2>
              <p>Randomized ranked community map with small-bubble attraction, cursor push, and bubble collision.</p>
            </div>

            <span className="selected-channel-chip">
              Selected: <strong>{props.selectedChannel.name}</strong>
            </span>
          </div>

          <div
            className="bubble-map bubble-field bubble-field-wide"
            onMouseLeave={() => {
              setBubbleCursor({
                x: 50,
                y: 50,
                active: false
              });
            }}
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const width = Math.max(rect.width, 1);
              const height = Math.max(rect.height, 1);

              setBubbleCursor({
                x: ((event.clientX - rect.left) / width) * 100,
                y: ((event.clientY - rect.top) / height) * 100,
                active: true
              });
            }}
          >
            {topCommunities.map((item, index) => (
              <button
                className={'interactive-bubble ' + signalClass(item.channel.signal)}
                key={item.channel.id + '-bubble-' + item.rank}
                onClick={() => props.onOpenProfile(item.channel)}
                style={getBubbleStyle(index)}
                type="button"
              >
                <strong>{item.rank}</strong>
                <span>{item.channel.name}</span>
                <small>{item.channel.subscribers.toLocaleString()}</small>
              </button>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}

function GameHub(props: {
  selectedChannel: NamiChannel;
  onSelect: (channel: NamiChannel) => void;
  onOpenProfile: (channel: NamiChannel) => void;
}): ReactElement {
  const partnerChannels = channels.filter((channel) => channel.partner);
  const topChannels = [...channels]
    .sort((left, right) => right.subscribers - left.subscribers)
    .slice(0, 4);
  const browserChannels = channels.concat(channels, channels);

  return (
    <>
      <header className="page-title">
        <p>Browse and discover</p>
        <h1>GameHub</h1>
      </header>

      <section className="gamehub-top-panel">
        <article className="gamehub-feature-card partner-feature">
          <span className="feature-label">Partner Channels</span>
          <h2>Featured official spaces</h2>
          <div className="compact-channel-list">
            {partnerChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => props.onSelect(channel)}
                type="button"
              >
                <ChannelAvatar channel={channel} size="sm" />
                <span>
                  <strong>{channel.name}</strong>
                  <small>{channel.genre}</small>
                </span>
              </button>
            ))}
          </div>
        </article>

        <article className="gamehub-feature-card">
          <span className="feature-label">Top Channels</span>
          <h2>Trending by activity</h2>
          <div className="compact-channel-list">
            {topChannels.map((channel, index) => (
              <button
                key={channel.id}
                onClick={() => props.onSelect(channel)}
                type="button"
              >
                <strong className="rank-badge">#{index + 1}</strong>
                <span>
                  <strong>{channel.name}</strong>
                  <small>{channel.subscribers.toLocaleString()} subscribers</small>
                </span>
              </button>
            ))}
          </div>
        </article>

        <article className="gamehub-feature-card paid-feature">
          <span className="feature-label">Featured Placement</span>
          <h2>Pro / Elite channel boosts</h2>
          <p>
            Paid placement should increase discovery visibility, not trust status.
            Verification and reputation remain identity-based.
          </p>
          <button
            onClick={() => props.onOpenProfile(props.selectedChannel)}
            type="button"
          >
            View selected channel
          </button>
        </article>
      </section>

      <section className="panel gamehub-browser">
        <div className="browser-heading">
          <div>
            <h2>Channel Browser</h2>
            <p>Randomized discovery cards with signal rings and channel metadata.</p>
          </div>
          <div className="selected-channel-chip">
            Selected: <strong>{props.selectedChannel.name}</strong>
          </div>
        </div>

        <div className="filter-row">
          <button type="button">All</button>
          <button type="button">Games</button>
          <button type="button">IRL</button>
          <button type="button">Music & DJs</button>
          <button type="button">Creative</button>
          <button type="button">Esports</button>
          <button type="button">Verified</button>
          <button type="button">PC</button>
          <button type="button">Console</button>
          <button type="button">Mobile</button>
        </div>

        <div className="discovery-grid">
          {browserChannels.map((channel, index) => (
            <button
              className="discovery-card discovery-card-expanded"
              key={channel.id + '-' + index}
              onClick={() => props.onOpenProfile(channel)}
              type="button"
            >
              <div className="discovery-card-top">
                <ChannelAvatar channel={channel} size="sm" />
                <span className={'mini-badge signal-text-' + channel.signal.toLowerCase()}>
                  {channel.signal}
                </span>
              </div>

              <strong>{channel.name}</strong>
              <span>{channel.genre}</span>
              <small>{channel.platforms.join(' / ')}</small>

              <div className="card-meta-row">
                {channel.verified && <i>Verified</i>}
                {channel.partner && <i>Partner</i>}
                <i>{channel.subscribers.toLocaleString()}</i>
              </div>
            </button>
          ))}
        </div>

        <div className="interest-tracker">
          <div>
            <h3>Preferred Channels & Interests</h3>
            <p>
              Future personalization module for pinned genres, preferred platforms,
              favorite signal types, and followed channel categories.
            </p>
          </div>

          <div className="interest-tags">
            <span>Gaming</span>
            <span>Verified</span>
            <span>PC</span>
            <span>Guilds</span>
            <span>Events</span>
          </div>

          <button className="add-module-button" type="button">
            + Add Section / Module
          </button>
        </div>
      </section>
    </>
  );
}

type ChannelBrandTheme = {
  key: string;
  label: string;
  primary: string;
  secondary: string;
  glow: string;
};

const channelBrandThemes: ChannelBrandTheme[] = [
  {
    key: 'nami',
    label: 'Nami Blue',
    primary: '#75d7ff',
    secondary: '#1f65ff',
    glow: 'rgba(117, 215, 255, 0.2)'
  },
  {
    key: 'fiends',
    label: 'Fiends Red',
    primary: '#ff3152',
    secondary: '#a01c30',
    glow: 'rgba(255, 49, 82, 0.2)'
  },
  {
    key: 'ocean',
    label: 'Ocean Mint',
    primary: '#43f5a7',
    secondary: '#0c7f65',
    glow: 'rgba(67, 245, 167, 0.2)'
  },
  {
    key: 'ember',
    label: 'Ember Gold',
    primary: '#ffb84d',
    secondary: '#ff3152',
    glow: 'rgba(255, 184, 77, 0.2)'
  }
];

function getDefaultChannelBrandTheme(): ChannelBrandTheme {
  return channelBrandThemes[0]!;
}

function getChannelBrandThemeByKey(key: string | null): ChannelBrandTheme {
  return channelBrandThemes.find((theme) => theme.key === key) ?? getDefaultChannelBrandTheme();
}

function getStoredChannelBrandTheme(channelId: string): ChannelBrandTheme {
  try {
    return getChannelBrandThemeByKey(
      window.localStorage.getItem('nami-profile-brand-theme-' + channelId)
    );
  } catch {
    return getDefaultChannelBrandTheme();
  }
}

function applyChannelBrandToDocument(theme: ChannelBrandTheme): void {
  document.documentElement.style.setProperty('--active-channel-brand-primary', theme.primary);
  document.documentElement.style.setProperty('--active-channel-brand-secondary', theme.secondary);
  document.documentElement.style.setProperty('--active-channel-brand-glow', theme.glow);
}

function ChannelProfile(props: {
  channel: NamiChannel;
  onNavigate: (page: NamiPage) => void;
  onOpenProfile?: (channel: NamiChannel) => void;
}): ReactElement {
  const profileModuleDefaults = [
    'Main Chat',
    'Timeline',
    'Guilds',
    'Events',
    'Patch Notes',
    'Support',
    'Esports',
    'Gated Rooms'
  ];

  const profilePanelDefaults = [
    'Channel Modules',
    'Official Announcements',
    'Official Links',
    'Official Badges',
    'Custom Badges',
    'Profile Customization',
    'Related Channels'
  ];

  const profileBrandThemes = [
    {
      key: 'nami',
      label: 'Nami Blue',
      primary: '#75d7ff',
      secondary: '#1f65ff',
      glow: 'rgba(117, 215, 255, 0.2)'
    },
    {
      key: 'fiends',
      label: 'Fiends Red',
      primary: '#ff3152',
      secondary: '#a01c30',
      glow: 'rgba(255, 49, 82, 0.2)'
    },
    {
      key: 'ocean',
      label: 'Ocean Mint',
      primary: '#43f5a7',
      secondary: '#0c7f65',
      glow: 'rgba(67, 245, 167, 0.2)'
    },
    {
      key: 'ember',
      label: 'Ember Gold',
      primary: '#ffb84d',
      secondary: '#ff3152',
      glow: 'rgba(255, 184, 77, 0.2)'
    }
  ];

  const [profileModules, setProfileModules] = useState(profileModuleDefaults);
  const [profilePanels, setProfilePanels] = useState(profilePanelDefaults);
  const [collapsedPanels, setCollapsedPanels] = useState<string[]>([]);
  const [draggedModule, setDraggedModule] = useState<string | null>(null);
  const [draggedPanel, setDraggedPanel] = useState<string | null>(null);
  const defaultBrandTheme = profileBrandThemes[0]!;

  const [brandKey, setBrandKey] = useState(defaultBrandTheme.key);
  const [moduleOrderSaved, setModuleOrderSaved] = useState(false);
  const [panelOrderSaved, setPanelOrderSaved] = useState(false);
  const [collapsedPanelsSaved, setCollapsedPanelsSaved] = useState(false);
  const [brandSaved, setBrandSaved] = useState(false);

  const relatedChannels = channels
    .filter((channel) => channel.id !== props.channel.id)
    .slice(0, 4);

  const officialBadgeIcons = [
    { icon: '✓', label: 'Verified Channel' },
    { icon: '◇', label: 'SuiNS Linked' },
    { icon: 'N', label: 'Nami Approved' },
    { icon: '!', label: 'Official Announcements' }
  ];

  const customBadgeIcons = [
    { icon: 'L', label: 'Launch Crew' },
    { icon: 'G', label: 'Guild Friendly' },
    { icon: 'E', label: 'Event Host' },
    { icon: '★', label: 'Creator Pick' }
  ];

  const verifiedLinks = [
    {
      icon: 'S',
      label: 'SuiNS',
      value: props.channel.handle + '.sui',
      status: 'Verified'
    },
    {
      icon: 'D',
      label: 'Developer',
      value: 'Owner proof linked',
      status: 'Verified'
    },
    {
      icon: 'W',
      label: 'Website',
      value: props.channel.name + ' profile hub',
      status: 'Verified'
    }
  ];

  const announcements = [
    {
      title: 'Official event board is live',
      body: 'The latest community event banner, guild schedule, and reward notes are now available from this profile.',
      tag: 'Official'
    },
    {
      title: 'Patch notes synced',
      body: 'Developer notes and support updates can be surfaced here without burying them inside main chat.',
      tag: 'Update'
    },
    {
      title: 'Custom banner slot available',
      body: 'Higher-tier channel owners can rotate profile banners, frames, and featured modules.',
      tag: 'Pro / Elite'
    }
  ];

  const moduleStorageKey = 'nami-profile-module-order-' + props.channel.id;
  const panelStorageKey = 'nami-profile-panel-order-' + props.channel.id;
  const collapsedStorageKey = 'nami-profile-collapsed-panels-' + props.channel.id;
  const brandStorageKey = 'nami-profile-brand-theme-' + props.channel.id;
  const layoutSaved = moduleOrderSaved && panelOrderSaved && collapsedPanelsSaved && brandSaved;

  const selectedBrandTheme =
    profileBrandThemes.find((theme) => theme.key === brandKey) ?? defaultBrandTheme;

  const profileBrandStyle = {
    '--profile-brand-primary': selectedBrandTheme.primary,
    '--profile-brand-secondary': selectedBrandTheme.secondary,
    '--profile-brand-glow': selectedBrandTheme.glow
  } as CSSProperties;

  useEffect(() => {
    applyChannelBrandToDocument(selectedBrandTheme);
  }, [brandKey, selectedBrandTheme]);

  const expandedPanels = profilePanels.filter((panelName) => {
    return !collapsedPanels.includes(panelName);
  });

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });

    function loadSavedOrder(
      savedValue: string | null,
      defaultItems: string[]
    ): {
      items: string[];
      saved: boolean;
    } {
      if (!savedValue) {
        return {
          items: [...defaultItems],
          saved: false
        };
      }

      try {
        const parsedValue = JSON.parse(savedValue);

        if (!Array.isArray(parsedValue)) {
          return {
            items: [...defaultItems],
            saved: false
          };
        }

        const validSavedItems = parsedValue.filter((item): item is string => {
          return typeof item === 'string' && defaultItems.includes(item);
        });

        const missingItems = defaultItems.filter((item) => {
          return !validSavedItems.includes(item);
        });

        return {
          items: [...validSavedItems, ...missingItems],
          saved: validSavedItems.length > 0
        };
      } catch {
        return {
          items: [...defaultItems],
          saved: false
        };
      }
    }

    function loadCollapsedPanels(savedValue: string | null): {
      items: string[];
      saved: boolean;
    } {
      if (!savedValue) {
        return {
          items: [],
          saved: false
        };
      }

      try {
        const parsedValue = JSON.parse(savedValue);

        if (!Array.isArray(parsedValue)) {
          return {
            items: [],
            saved: false
          };
        }

        return {
          items: parsedValue.filter((panelName): panelName is string => {
            return typeof panelName === 'string' && profilePanelDefaults.includes(panelName);
          }),
          saved: true
        };
      } catch {
        return {
          items: [],
          saved: false
        };
      }
    }

    const savedModules = loadSavedOrder(
      window.localStorage.getItem(moduleStorageKey),
      profileModuleDefaults
    );

    const savedPanels = loadSavedOrder(
      window.localStorage.getItem(panelStorageKey),
      profilePanelDefaults
    );

    const savedCollapsedPanels = loadCollapsedPanels(
      window.localStorage.getItem(collapsedStorageKey)
    );

    const savedBrandKey = window.localStorage.getItem(brandStorageKey);
    const savedBrandIsValid = profileBrandThemes.some((theme) => theme.key === savedBrandKey);

    setProfileModules(savedModules.items);
    setProfilePanels(savedPanels.items);
    setCollapsedPanels(savedCollapsedPanels.items);
    setBrandKey(savedBrandIsValid && savedBrandKey ? savedBrandKey : defaultBrandTheme.key);
    setModuleOrderSaved(savedModules.saved);
    setPanelOrderSaved(savedPanels.saved);
    setCollapsedPanelsSaved(savedCollapsedPanels.saved);
    setBrandSaved(savedBrandIsValid);
  }, [moduleStorageKey, panelStorageKey, collapsedStorageKey, brandStorageKey, props.channel.id]);

  function openModule(moduleName: string): void {
    if (moduleName === 'Main Chat') {
      props.onNavigate('chat');
      return;
    }

    if (moduleName === 'Events') {
      props.onNavigate('channelEvents');
    }
  }

  function dropModule(targetModule: string): void {
    const movingModule = draggedModule;

    if (!movingModule || movingModule === targetModule) {
      setDraggedModule(null);
      return;
    }

    setProfileModules((currentModules) => {
      const nextModules = currentModules.filter((moduleName) => moduleName !== movingModule);
      const targetIndex = nextModules.indexOf(targetModule);

      if (targetIndex === -1) {
        return currentModules;
      }

      nextModules.splice(targetIndex, 0, movingModule);
      return nextModules;
    });

    setDraggedModule(null);
    setModuleOrderSaved(false);
  }

  function dropPanel(targetPanel: string): void {
    const movingPanel = draggedPanel;

    if (!movingPanel || movingPanel === targetPanel) {
      setDraggedPanel(null);
      return;
    }

    setProfilePanels((currentPanels) => {
      const nextPanels = currentPanels.filter((panelName) => panelName !== movingPanel);
      const targetIndex = nextPanels.indexOf(targetPanel);

      if (targetIndex === -1) {
        return currentPanels;
      }

      nextPanels.splice(targetIndex, 0, movingPanel);
      return nextPanels;
    });

    setDraggedPanel(null);
    setPanelOrderSaved(false);
  }

  function togglePanel(panelName: string): void {
    setCollapsedPanels((currentPanels) => {
      if (currentPanels.includes(panelName)) {
        return currentPanels.filter((currentPanel) => currentPanel !== panelName);
      }

      return [...currentPanels, panelName];
    });

    setCollapsedPanelsSaved(false);
  }

  function saveProfileLayout(): void {
    window.localStorage.setItem(moduleStorageKey, JSON.stringify(profileModules));
    window.localStorage.setItem(panelStorageKey, JSON.stringify(profilePanels));
    window.localStorage.setItem(collapsedStorageKey, JSON.stringify(collapsedPanels));
    window.localStorage.setItem(brandStorageKey, brandKey);
    setModuleOrderSaved(true);
    setPanelOrderSaved(true);
    setCollapsedPanelsSaved(true);
    setBrandSaved(true);
  }

  function renderBadgeIcon(
    badge: {
      icon: string;
      label: string;
    },
    badgeType: 'official' | 'custom'
  ): ReactElement {
    return (
      <span
        className={'profile-badge-icon profile-badge-icon-' + badgeType}
        key={badge.label}
        title={badge.label}
      >
        {badge.icon}
      </span>
    );
  }

  function renderOfficialLinkIcon(link: {
    icon: string;
    label: string;
    value: string;
    status: string;
  }): ReactElement {
    return (
      <button
        className="profile-link-icon"
        key={link.label}
        title={link.label + ': ' + link.value}
        type="button"
      >
        <span>{link.icon}</span>
        <small>{link.label}</small>
      </button>
    );
  }

  function renderProfilePanel(panelName: string): ReactElement | null {
    if (panelName === 'Channel Modules') {
      return (
        <article className="panel profile-module-manager">
          <div className="profile-panel-heading">
            <h2>Channel Modules</h2>
            <p>Drag module tiles to personalize this channel layout.</p>
          </div>

          <div className="profile-module-grid is-reorderable">
            {profileModules.map((moduleName) => (
              <div
                className={
                  'profile-module-tile' +
                  (moduleName === draggedModule ? ' is-dragging-module' : '')
                }
                draggable
                key={moduleName}
                onDragEnd={() => setDraggedModule(null)}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => setDraggedModule(moduleName)}
                onDrop={() => dropModule(moduleName)}
              >
                <button
                  className={
                    moduleName === 'Main Chat'
                      ? 'profile-module-main-button is-primary-module'
                      : 'profile-module-main-button'
                  }
                  onClick={() => openModule(moduleName)}
                  type="button"
                >
                  <span className="profile-module-title-line">
                    <i className="module-dot-handle">⋮⋮</i>
                    <strong>{moduleName}</strong>
                  </span>

                  <span>
                    {moduleName === 'Main Chat'
                      ? 'Open live room'
                      : 'Module placeholder'}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </article>
      );
    }

    if (panelName === 'Official Announcements') {
      return (
        <article className="panel">
          <div className="profile-panel-heading">
            <h2>Official Announcements</h2>
            <p>Developer-owned updates remain separate from normal community chat.</p>
          </div>

          <div className="profile-announcement-stack">
            {announcements.map((announcement) => (
              <div className="announcement-card" key={announcement.title}>
                <span>{announcement.tag}</span>
                <strong>{announcement.title}</strong>
                <p>{announcement.body}</p>
              </div>
            ))}
          </div>
        </article>
      );
    }

    if (panelName === 'Official Links') {
      return (
        <article className="panel">
          <div className="profile-panel-heading">
            <h2>Official Links</h2>
            <p>Verified identity links displayed as clickable profile icons.</p>
          </div>

          <div className="verified-link-grid">
            {verifiedLinks.map((link) => (
              <button className="verified-link-card verified-link-button" key={link.label} type="button">
                <span>{link.label}</span>
                <strong>{link.value}</strong>
                <i>{link.status}</i>
              </button>
            ))}
          </div>
        </article>
      );
    }

    if (panelName === 'Official Badges') {
      return (
        <article className="panel">
          <div className="profile-panel-heading">
            <h2>Official Badges</h2>
            <p>Nami-issued badges are locked and cannot be faked.</p>
          </div>

          <div className="profile-badge-icon-grid">
            {officialBadgeIcons.map((badge) => (
              <div className="profile-badge-detail-card" key={badge.label}>
                {renderBadgeIcon(badge, 'official')}
                <strong>{badge.label}</strong>
              </div>
            ))}
          </div>
        </article>
      );
    }

    if (panelName === 'Custom Badges') {
      return (
        <article className="panel">
          <div className="profile-panel-heading">
            <h2>Custom Badges</h2>
            <p>Cosmetic badge slots for community flavor.</p>
          </div>

          <div className="profile-badge-icon-grid">
            {customBadgeIcons.map((badge) => (
              <div className="profile-badge-detail-card" key={badge.label}>
                {renderBadgeIcon(badge, 'custom')}
                <strong>{badge.label}</strong>
              </div>
            ))}
          </div>
        </article>
      );
    }

    if (panelName === 'Profile Customization') {
      return (
        <article className="panel">
          <div className="profile-panel-heading">
            <h2>Profile Customization</h2>
            <p>Paid upgrades add cosmetic control, not verification.</p>
          </div>

          <div className="customization-control-grid">
            <div className="locked-badge-card">
              <strong>Profile Frame</strong>
              <span>Pro / Elite</span>
            </div>

            <div className="locked-badge-card">
              <strong>Banner Rotation</strong>
              <span>Elite</span>
            </div>

            <div className="locked-badge-card">
              <strong>Badge Layout</strong>
              <span>Pro / Elite</span>
            </div>
          </div>
        </article>
      );
    }

    if (panelName === 'Related Channels') {
      return (
        <article className="panel">
          <div className="profile-panel-heading">
            <h2>Related Channels</h2>
            <p>Same network, genre, or community overlap.</p>
          </div>

          <div className="related-channel-stack">
            {relatedChannels.map((channel) => (
              <button
                className="related-channel-card"
                key={channel.id}
                onClick={() => props.onOpenProfile?.(channel)}
                type="button"
              >
                <ChannelAvatar channel={channel} size="sm" />
                <div>
                  <strong>{channel.name}</strong>
                  <span>{channel.genre}</span>
                </div>
                <i className={signalClass(channel.signal)}>{channel.signal}</i>
              </button>
            ))}
          </div>
        </article>
      );
    }

    return null;
  }

  return (
    <>
      <header className="page-title">
        <p>Contextual channel profile</p>
        <h1>Game Profile</h1>
      </header>

      <section className="channel-profile-page" style={profileBrandStyle}>
        <article className="profile-hero-panel">
          <div className="profile-hero-main">
            <ChannelAvatar channel={props.channel} size="lg" />

            <div className="profile-hero-copy">
              <div className="profile-signal-badge-row">
                <span className={'profile-signal-chip ' + signalClass(props.channel.signal)}>
                  <i />
                  {props.channel.signal} Signal
                </span>

                <div className="profile-badge-icon-row" aria-label="Channel badge icons">
                  {officialBadgeIcons.slice(0, 4).map((badge) => renderBadgeIcon(badge, 'official'))}
                  {customBadgeIcons.slice(0, 2).map((badge) => renderBadgeIcon(badge, 'custom'))}
                </div>
              </div>

              <h2>{props.channel.name}</h2>
              <p>{props.channel.tagline}</p>

              <div className="profile-meta-row">
                <span>{props.channel.handle}</span>
                <span>{props.channel.genre}</span>
                <span>{props.channel.platforms.join(' / ')}</span>
              </div>
            </div>
          </div>

          <div className="profile-hero-actions">
            <button className="primary-action" type="button">
              Subscribe
            </button>

            <button
              className="secondary-action"
              onClick={() => props.onNavigate('chat')}
              type="button"
            >
              Join Main Chat
            </button>

            <button className="secondary-action" type="button">
              Get Banners
            </button>
          </div>
        </article>

        <section className="profile-stat-grid">
          <article className="profile-stat-card">
            <span>Subscribers</span>
            <strong>{props.channel.subscribers.toLocaleString()}</strong>
          </article>

          <article className="profile-stat-card profile-link-stat-card">
            <span>Official Links</span>
            <div className="profile-link-icon-row">
              {verifiedLinks.map((link) => renderOfficialLinkIcon(link))}
            </div>
          </article>

          <article className="profile-stat-card">
            <span>Genre</span>
            <strong>{props.channel.genre}</strong>
          </article>

          <article className="profile-stat-card">
            <span>Platforms</span>
            <strong>{props.channel.platforms.length}</strong>
          </article>
        </section>

        <article className="panel game-banner-preview">
          <div>
            <span className="mini-badge">Customizable Banner</span>
            <h2>{props.channel.name} Channel Banner</h2>
            <p>
              This area becomes the developer-controlled game/channel banner with paid
              cosmetic slots, official artwork, and event callouts.
            </p>
          </div>

          <div className="banner-badge-row">
            <span>{props.channel.genre}</span>
            <span>{props.channel.signal}</span>
            <span>{props.channel.platforms[0] ?? 'Cross-platform'}</span>
          </div>
        </article>

        <section className="profile-layout-control-panel">
          <div>
            <span className="mini-badge">Personalized UX Layout</span>
            <h2>Profile Sections</h2>
            <p>Drag section tabs to reposition panels. Collapse panels into tabs for a cleaner profile.</p>
          </div>

          <div className="profile-module-save-row">
            <button
              className="module-save-button"
              onClick={saveProfileLayout}
              type="button"
            >
              Save Page Layout
            </button>
            <span>{layoutSaved ? 'Saved' : 'Unsaved changes'}</span>
          </div>
        </section>

        <section className="brand-control-panel">
          <div>
            <h2>Channel Brand Colors</h2>
            <p>Channel owners can theme the profile surface with branded colors.</p>
          </div>

          <div className="brand-choice-row">
            {profileBrandThemes.map((theme) => (
              <button
                className={theme.key === brandKey ? 'brand-choice is-selected-brand' : 'brand-choice'}
                key={theme.key}
                onClick={() => {
                  setBrandKey(theme.key);
                  window.localStorage.setItem(brandStorageKey, theme.key);
                  applyChannelBrandToDocument(theme);
                  setBrandSaved(true);
                }}
                style={{
                  '--brand-primary': theme.primary,
                  '--brand-secondary': theme.secondary
                } as CSSProperties}
                type="button"
              >
                <i />
                <span>{theme.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="profile-panel-tab-tray">
          {profilePanels.map((panelName) => {
            const isCollapsed = collapsedPanels.includes(panelName);

            return (
              <div
                className={
                  'profile-panel-tab' +
                  (isCollapsed ? ' is-collapsed-tab' : ' is-expanded-tab') +
                  (panelName === draggedPanel ? ' is-dragging-panel-tab' : '')
                }
                draggable
                key={panelName}
                onDragEnd={() => setDraggedPanel(null)}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => setDraggedPanel(panelName)}
                onDrop={() => dropPanel(panelName)}
              >
                <i>⋮⋮</i>
                <button onClick={() => togglePanel(panelName)} type="button">
                  <strong>{panelName}</strong>
                  <span>{isCollapsed ? 'Collapsed' : 'Expanded'}</span>
                </button>
              </div>
            );
          })}
        </section>

        <section className={expandedPanels.length === 0 ? 'profile-panel-workspace is-empty-workspace' : 'profile-panel-workspace'}>
          {expandedPanels.length === 0 && (
            <article className="panel profile-empty-panel-note">
              <h2>All panels collapsed</h2>
              <p>Your profile sections are now acting like a repositionable tab list above.</p>
            </article>
          )}

          {expandedPanels.map((panelName) => {
            const panel = renderProfilePanel(panelName);

            if (!panel) {
              return null;
            }

            return (
              <div
                className={
                  'profile-section-shell' +
                  (panelName === draggedPanel ? ' is-dragging-panel' : '')
                }
                key={panelName}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => dropPanel(panelName)}
              >
                <div
                  className="profile-section-drag-bar"
                  draggable
                  onDragEnd={() => setDraggedPanel(null)}
                  onDragStart={() => setDraggedPanel(panelName)}
                >
                  <span>Section</span>
                  <strong>{panelName}</strong>
                  <button onClick={() => togglePanel(panelName)} type="button">
                    Collapse
                  </button>
                  <i>⋮⋮</i>
                </div>

                {panel}
              </div>
            );
          })}
        </section>
      </section>
    </>
  );
}

type MemberPreferenceState = {
  muted: boolean;
  blocked: boolean;
};

type SafetyReport = {
  id: string;
  source: 'message' | 'member';
  targetId: string;
  targetName: string;
  reason: string;
  channelName: string;
  createdAt: string;
  status: 'Queued' | 'Reviewing' | 'Warned' | 'Timed Out' | 'Escalated' | 'Resolved';
};

type SafetyActionRecord = {
  id: string;
  reportId: string;
  targetId: string;
  targetName: string;
  action: 'Review' | 'Warn' | 'Timeout' | 'Escalate' | 'Resolve' | 'Signal Review';
  note: string;
  channelName: string;
  createdAt: string;
};

function readMemberSignalReviews(): Record<string, NamiChannel['signal']> {
  try {
    const savedReviews = window.localStorage.getItem('nami-member-signal-reviews');

    if (!savedReviews) {
      return {};
    }

    const parsedReviews = JSON.parse(savedReviews);

    if (typeof parsedReviews !== 'object' || parsedReviews === null) {
      return {};
    }

    return parsedReviews as Record<string, NamiChannel['signal']>;
  } catch {
    return {};
  }
}

function readMemberSignalReview(
  memberId: string,
  fallbackSignal: NamiChannel['signal']
): NamiChannel['signal'] {
  return readMemberSignalReviews()[memberId] ?? fallbackSignal;
}

function saveMemberSignalReview(memberId: string, signal: NamiChannel['signal']): void {
  const reviews = readMemberSignalReviews();

  window.localStorage.setItem(
    'nami-member-signal-reviews',
    JSON.stringify({
      ...reviews,
      [memberId]: signal
    })
  );
}

type AdultLanguageMode = 'censor' | 'filter' | 'show';

function isAdultLanguageMode(value: unknown): value is AdultLanguageMode {
  return value === 'censor' || value === 'filter' || value === 'show';
}

function readChannelAdultLanguageMode(channelId: string): AdultLanguageMode {
  try {
    const savedMode = window.localStorage.getItem('nami-channel-adult-language-mode-' + channelId);

    if (isAdultLanguageMode(savedMode)) {
      return savedMode;
    }

    return 'censor';
  } catch {
    return 'censor';
  }
}

function saveChannelAdultLanguageMode(channelId: string, mode: AdultLanguageMode): void {
  window.localStorage.setItem('nami-channel-adult-language-mode-' + channelId, mode);
}

const conductLanguageTerms = [
  'nsfw',
  'explicit',
  'adult-only',
  '18+',
  'xxx',
  'sexual',
  'harassment',
  'threat'
];

function hasAdultLanguage(content: string): boolean {
  const normalizedContent = content.toLowerCase();

  return conductLanguageTerms.some((term) => normalizedContent.includes(term));
}

function censorAdultLanguage(content: string): string {
  return conductLanguageTerms.reduce((censoredContent, term) => {
    const charactersToEscape = '\\^$.*+?()[]{}|';
    const escapedTerm = term
      .split('')
      .map((character) => (charactersToEscape.includes(character) ? '\\' + character : character))
      .join('');
    const termPattern = new RegExp(escapedTerm, 'gi');

    return censoredContent.replace(termPattern, (match) => '•'.repeat(Math.max(4, match.length)));
  }, content);
}

function readMemberPreference(memberId: string): MemberPreferenceState {
  try {
    const savedPreference = window.localStorage.getItem('nami-member-preferences-' + memberId);

    if (!savedPreference) {
      return {
        muted: false,
        blocked: false
      };
    }

    const parsedPreference = JSON.parse(savedPreference);

    return {
      muted: Boolean(parsedPreference.muted),
      blocked: Boolean(parsedPreference.blocked)
    };
  } catch {
    return {
      muted: false,
      blocked: false
    };
  }
}

function readSafetyReports(): SafetyReport[] {
  try {
    const savedReports = window.localStorage.getItem('nami-safety-reports');

    if (!savedReports) {
      return [];
    }

    const parsedReports = JSON.parse(savedReports);

    if (!Array.isArray(parsedReports)) {
      return [];
    }

    return parsedReports.filter((report): report is SafetyReport => {
      return (
        typeof report === 'object' &&
        report !== null &&
        typeof report.id === 'string' &&
        typeof report.targetId === 'string' &&
        typeof report.targetName === 'string'
      );
    });
  } catch {
    return [];
  }
}

function saveSafetyReports(reports: SafetyReport[]): void {
  window.localStorage.setItem('nami-safety-reports', JSON.stringify(reports));
}

function readSafetyActions(): SafetyActionRecord[] {
  try {
    const savedActions = window.localStorage.getItem('nami-safety-actions');

    if (!savedActions) {
      return [];
    }

    const parsedActions = JSON.parse(savedActions);

    if (!Array.isArray(parsedActions)) {
      return [];
    }

    return parsedActions.filter((action): action is SafetyActionRecord => {
      return (
        typeof action === 'object' &&
        action !== null &&
        typeof action.id === 'string' &&
        typeof action.reportId === 'string' &&
        typeof action.targetId === 'string'
      );
    });
  } catch {
    return [];
  }
}

function saveSafetyAction(action: Omit<SafetyActionRecord, 'id' | 'createdAt'>): void {
  const nextAction: SafetyActionRecord = {
    ...action,
    id: 'action-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2),
    createdAt: new Date().toLocaleString()
  };

  window.localStorage.setItem(
    'nami-safety-actions',
    JSON.stringify([nextAction, ...readSafetyActions()])
  );
}

function saveSafetyReport(report: Omit<SafetyReport, 'id' | 'createdAt' | 'status'>): void {
  const nextReport: SafetyReport = {
    ...report,
    id: 'report-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2),
    createdAt: new Date().toLocaleString(),
    status: 'Queued'
  };

  const reports = readSafetyReports();
  window.localStorage.setItem('nami-safety-reports', JSON.stringify([nextReport, ...reports]));
}

function GameChat(props: {
  channel: NamiChannel;
  onNavigate: (page: NamiPage) => void;
  onOpenMember: (member: (typeof members)[number]) => void;
}): ReactElement {
  const [hideNpc, setHideNpc] = useState(false);
  const [hideRed, setHideRed] = useState(false);
  const [proEliteOnly, setProEliteOnly] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [customizationCollapsed, setCustomizationCollapsed] = useState(false);
  const [reportPulse, setReportPulse] = useState('');
  const [adultLanguageMode, setAdultLanguageMode] = useState<'censor' | 'filter' | 'show'>('censor');

  const channelBrandTheme = useMemo(() => {
    return getStoredChannelBrandTheme(props.channel.id);
  }, [props.channel.id]);

  useEffect(() => {
    applyChannelBrandToDocument(channelBrandTheme);
  }, [channelBrandTheme, props.channel.id]);

  const chatEligibleMembers = members.filter((member) => member.signal !== 'Black');

  const visibleChatMembers = chatEligibleMembers.filter((member) => {
    return !readMemberPreference(member.id).blocked;
  });

  const memberByName = new Map(chatEligibleMembers.map((member) => [member.name, member]));

  const visibleMessages = chatMessages.filter((message) => {
    if (message.signal === 'Black') return false;
    if (adultLanguageMode === 'filter' && hasAdultLanguage(message.body)) return false;

    const member = memberByName.get(message.author);

    if (!member) return false;
    if (readMemberPreference(member.id).blocked) return false;
    if (hideNpc && member.tier === 'NPC') return false;
    if (hideRed && message.signal === 'Red') return false;
    if (proEliteOnly && member.tier !== 'Pro' && member.tier !== 'Elite') return false;

    return true;
  });

  const onlineMembers = visibleChatMembers.slice(0, 4);
  const offlineMembers = visibleChatMembers.slice(4);

  function reportMessage(member: (typeof members)[number], messageBody: string): void {
    saveSafetyReport({
      source: 'message',
      targetId: member.id,
      targetName: member.name,
      reason: messageBody,
      channelName: props.channel.name
    });

    setReportPulse('Report queued for ' + member.name);
  }

  return (
    <>
      <header className="page-title">
        <p>Live community room</p>
        <h1>Game Chat</h1>
      </header>

      <section className="chat-presence-rail">
        <div className="chat-presence-channel">
          <ChannelAvatar channel={props.channel} size="lg" />
          <div>
            <span className={'mini-badge signal-text-' + props.channel.signal.toLowerCase()}>
              {props.channel.signal} Channel
            </span>
            <h2>{props.channel.name}</h2>
            <p>{props.channel.tagline}</p>
          </div>
        </div>

        <div className="chat-member-strip">
          {onlineMembers.map((member) => {
            const preference = readMemberPreference(member.id);

            return (
              <button
                className={
                  'chat-member-card' +
                  (preference.muted ? ' is-muted-member-card' : '')
                }
                key={member.id}
                onClick={() => props.onOpenMember(member)}
                type="button"
              >
                <div className={'chat-member-avatar ' + signalClass(member.signal)}>
                  {member.name.slice(0, 2).toUpperCase()}
                </div>
                <strong>{member.name}</strong>
                <span>{preference.muted ? 'Muted' : member.tier}</span>
              </button>
            );
          })}

          {offlineMembers.map((member) => {
            const preference = readMemberPreference(member.id);

            return (
              <button
                className={
                  'chat-member-card is-offline' +
                  (preference.muted ? ' is-muted-member-card' : '')
                }
                key={member.id}
                onClick={() => props.onOpenMember(member)}
                type="button"
              >
                <div className={'chat-member-avatar ' + signalClass(member.signal)}>
                  {member.name.slice(0, 2).toUpperCase()}
                </div>
                <strong>{member.name}</strong>
                <span>{preference.muted ? 'Muted' : 'Offline'}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="chat-shell chat-shell-buildout">
        <div className="tab-row channel-tab-row">
          {[
            'Profile',
            'Timeline',
            'Guilds',
            'Events',
            'Main Chat',
            'Esports',
            'Party',
            'Patch Notes',
            'Gated',
            'Support'
          ].map((tab) => (
            <button
              className={tab === 'Main Chat' ? 'is-active-tab' : ''}
              key={tab}
              onClick={() => {
                if (tab === 'Profile') {
                  props.onNavigate('channelProfile');
                }

                if (tab === 'Events') {
                  props.onNavigate('channelEvents');
                }
              }}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        <div
          className={
            'chat-layout chat-layout-buildout' +
            (customizationCollapsed ? ' is-customization-collapsed' : '')
          }
        >
          <article className="chat-window chat-window-buildout chat-theme-channel-brand">
            <div className="chat-window-heading">
              <div>
                <h2>{props.channel.name} Main Chat</h2>
                <p>
                  {visibleMessages.length} visible messages · {visibleChatMembers.length} visible members
                </p>
              </div>

              <div className="chat-heading-actions">
                {reportPulse && <span className="report-pulse">{reportPulse}</span>}
                <button onClick={() => props.onNavigate('safetyCenter')} type="button">
                  Safety Center
                </button>
              </div>
            </div>

            <div className="message-stack">
              {visibleMessages.map((message) => {
                const member = memberByName.get(message.author);

                if (!member) {
                  return null;
                }

                const preference = readMemberPreference(member.id);

                return (
                  <div
                    className={
                      'chat-message-row' +
                      (preference.muted ? ' is-muted-chat-row' : '')
                    }
                    key={message.id}
                  >
                    <button
                      className={'message-avatar message-avatar-button ' + signalClass(message.signal)}
                      onClick={() => props.onOpenMember(member)}
                      type="button"
                    >
                      {message.author.slice(0, 2).toUpperCase()}
                    </button>

                    <div className="message-bubble">
                      <div className="message-meta">
                        <button
                          className={'message-author-button signal-text-' + message.signal.toLowerCase()}
                          onClick={() => props.onOpenMember(member)}
                          type="button"
                        >
                          {message.author}
                        </button>

                        <span>{message.time}</span>
                        <i>{preference.muted ? 'Muted' : member.tier}</i>
                        <i>{message.signal}</i>

                        <button
                          className="message-report-button"
                          onClick={() => reportMessage(member, message.body)}
                          type="button"
                        >
                          Report
                        </button>
                      </div>

                      <p>
                        {adultLanguageMode === 'censor'
                          ? censorAdultLanguage(message.body)
                          : message.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="chat-input-placeholder">
              <span>Message {props.channel.name}</span>
              <button type="button">Send</button>
            </div>
          </article>

          <aside className="chat-side-panel">
            <section className="chat-filter-panel">
              <button
                className="filter-collapse-button"
                onClick={() => setFiltersCollapsed((value) => !value)}
                type="button"
              >
                <span>Filter Options</span>
                <strong>{filtersCollapsed ? '+' : '−'}</strong>
              </button>

              {!filtersCollapsed && (
                <div className="filter-options-stack">
                  <label>
                    <input
                      checked={hideNpc}
                      onChange={(event) => setHideNpc(event.target.checked)}
                      type="checkbox"
                    />
                    Hide NPCs
                  </label>

                  <label>
                    <input
                      checked={hideRed}
                      onChange={(event) => setHideRed(event.target.checked)}
                      type="checkbox"
                    />
                    Hide Red Signal
                  </label>

                  <label>
                    <input
                      checked={proEliteOnly}
                      onChange={(event) => setProEliteOnly(event.target.checked)}
                      type="checkbox"
                    />
                    Pro / Elite only
                  </label>
                </div>
              )}
            </section>


            <section className="adult-language-settings-panel">
              <div className="profile-panel-heading">
                <h2>Adult Language Controls</h2>
                <p>Channel owner moderation setting. Default behavior is censoring.</p>
              </div>

              <div className="adult-language-control">
                <strong>Adult Language Mode</strong>

                <div className="adult-language-mode-row">
                  {(['censor', 'filter', 'show'] as const).map((mode) => (
                    <button
                      className={adultLanguageMode === mode ? 'is-active-adult-mode' : ''}
                      key={mode}
                      onClick={() => setAdultLanguageMode(mode)}
                      type="button"
                    >
                      {mode === 'censor' ? 'Censor' : mode === 'filter' ? 'Filter Out' : 'Show'}
                    </button>
                  ))}
                </div>

                <small>
                  Censor masks matching words. Filter Out removes matching messages.
                  Show displays original text.
                </small>
              </div>
            </section>

            <section
              className={
                'chat-customization-panel' +
                (customizationCollapsed ? ' is-collapsed-customization' : '')
              }
            >
              <button
                className="customization-collapse-button"
                onClick={() => setCustomizationCollapsed((value) => !value)}
                type="button"
              >
                <span>Chat Customization</span>
                <strong>{customizationCollapsed ? '+' : '−'}</strong>
              </button>

              {!customizationCollapsed && (
                <div className="chat-customization-body">
                  <div className="profile-panel-heading">
                    <h2>Inherited Channel Brand</h2>
                    <p>Chat colors are controlled from the Game Profile brand settings.</p>
                  </div>

                  <div className="chat-inherited-brand-card">
                    <span
                      style={{
                        background:
                          'linear-gradient(135deg, ' +
                          channelBrandTheme.primary +
                          ', ' +
                          channelBrandTheme.secondary +
                          ')'
                      }}
                    />
                    <div>
                      <strong>{channelBrandTheme.label}</strong>
                      <small>Managed from Game Profile</small>
                    </div>
                  </div>

                  <div className="customization-note">
                    Safety preferences now affect chat visibility. Blocked members are hidden,
                    while muted members stay visible but visually quieted.
                  </div>
                </div>
              )}
            </section>
          </aside>
        </div>
      </section>
    </>
  );
}

function MemberProfileScreen(props: {
  member: (typeof members)[number];
  onNavigate: (page: NamiPage) => void;
}): ReactElement {
  const preferenceStorageKey = 'nami-member-preferences-' + props.member.id;
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [reportQueued, setReportQueued] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const reviewedSignal = readMemberSignalReview(props.member.id, props.member.signal);
  const memberReports = useMemo(() => {
    return readSafetyReports().filter((report) => report.targetId === props.member.id);
  }, [props.member.id, refreshKey]);

  const memberActions = useMemo(() => {
    return readSafetyActions().filter((action) => action.targetId === props.member.id);
  }, [props.member.id, refreshKey]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });

    const savedPreference = readMemberPreference(props.member.id);

    setIsMuted(savedPreference.muted);
    setIsBlocked(savedPreference.blocked);
    setReportQueued(false);
    setRefreshKey((value) => value + 1);
  }, [preferenceStorageKey, props.member.id]);

  function savePreference(nextMuted: boolean, nextBlocked: boolean): void {
    setIsMuted(nextMuted);
    setIsBlocked(nextBlocked);

    window.localStorage.setItem(
      preferenceStorageKey,
      JSON.stringify({
        muted: nextMuted,
        blocked: nextBlocked
      })
    );
  }

  function reportMember(): void {
    saveSafetyReport({
      source: 'member',
      targetId: props.member.id,
      targetName: props.member.name,
      reason: 'Member profile report',
      channelName: 'Nami Chat'
    });

    setReportQueued(true);
    setRefreshKey((value) => value + 1);
  }

  return (
    <>
      <header className="page-title">
        <p>Member profile, history, and preference controls</p>
        <h1>{props.member.name}</h1>
      </header>

      <section className="member-profile-page">
        <article className="member-profile-hero panel">
          <div className={'member-profile-avatar ' + signalClass(reviewedSignal)}>
            {props.member.name.slice(0, 2).toUpperCase()}
          </div>

          <div className="member-profile-copy">
            <div className="profile-signal-badge-row">
              <span className={'profile-signal-chip ' + signalClass(reviewedSignal)}>
                <i />
                {reviewedSignal} Signal
              </span>

              <span className="profile-badge-icon profile-badge-icon-custom" title={props.member.tier}>
                {props.member.tier.slice(0, 1)}
              </span>
            </div>

            <h2>{props.member.name}</h2>
            <p>
              Member profile preview for chat discovery, preference controls, moderation
              history, and future passport-driven reputation surfaces.
            </p>

            <div className="member-profile-meta-row">
              <span>Tier</span>
              <strong>{props.member.tier}</strong>
              <span>Status</span>
              <strong>{isBlocked ? 'Blocked' : isMuted ? 'Muted' : 'Open'}</strong>
              <span>Reports</span>
              <strong>{memberReports.length}</strong>
              <span>Actions</span>
              <strong>{memberActions.length}</strong>
            </div>

            {reportQueued && <p className="report-pulse">Report added to moderation queue.</p>}
          </div>

          <div className="member-profile-actions">
            <button
              className={isMuted ? 'preference-button is-muted-active' : 'preference-button'}
              onClick={() => savePreference(!isMuted, isBlocked)}
              type="button"
            >
              {isMuted ? 'Muted' : 'Mute'}
            </button>

            <button
              className={isBlocked ? 'preference-button is-blocked-active' : 'preference-button danger-preference'}
              onClick={() => savePreference(isMuted, !isBlocked)}
              type="button"
            >
              {isBlocked ? 'Blocked' : 'Block'}
            </button>

            <button
              className="preference-button report-preference"
              onClick={reportMember}
              type="button"
            >
              Report
            </button>

            <button
              className="secondary-action"
              onClick={() => props.onNavigate('safetyCenter')}
              type="button"
            >
              Safety Center
            </button>

            <button
              className="secondary-action"
              onClick={() => props.onNavigate('chat')}
              type="button"
            >
              Back to Chat
            </button>
          </div>
        </article>

        <section className="member-profile-grid">
          <article className="panel">
            <div className="profile-panel-heading">
              <h2>Safety History</h2>
              <p>Reports and moderator actions connected to this member.</p>
            </div>

            <div className="member-history-stack">
              {memberReports.length === 0 && memberActions.length === 0 && (
                <span className="empty-safety-note">No safety history for this member.</span>
              )}

              {memberReports.map((report) => (
                <div className="member-history-card" key={report.id}>
                  <span className="mini-badge">{report.status}</span>
                  <strong>{report.source} report</strong>
                  <p>{report.reason}</p>
                  <small>{report.channelName} · {report.createdAt}</small>
                </div>
              ))}

              {memberActions.map((action) => (
                <div className="member-history-card" key={action.id}>
                  <span className="mini-badge">{action.action}</span>
                  <strong>{action.note}</strong>
                  <p>{action.channelName}</p>
                  <small>{action.createdAt}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="profile-panel-heading">
              <h2>Preference Notes</h2>
              <p>Mute, Block, and Report are user-owned preference controls in this UI mock.</p>
            </div>

            <div className="preference-note-stack">
              <div>
                <strong>Mute</strong>
                <span>Quiet this member’s messages and reduce future notifications.</span>
              </div>

              <div>
                <strong>Block</strong>
                <span>Hide this member from chat and reduce unwanted interaction.</span>
              </div>

              <div>
                <strong>Report</strong>
                <span>Adds this member or message to a moderation review queue.</span>
              </div>
            </div>
          </article>
        </section>
      </section>
    </>
  );
}

function SafetyCenterScreen(props: {
  onNavigate: (page: NamiPage) => void;
}): ReactElement {
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'All' | SafetyReport['status']>('All');
  const [moderationNotes, setModerationNotes] = useState<Record<string, string>>({});
  const [moderationRole, setModerationRole] = useState<
    'Member' | 'Channel Owner' | 'Nami Moderator' | 'Nami Dev'
  >('Channel Owner');
const reports = useMemo(() => readSafetyReports(), [refreshKey]);
  const actions = useMemo(() => readSafetyActions(), [refreshKey]);

  const mutedMembers = members.filter((member) => readMemberPreference(member.id).muted);
  const blockedMembers = members.filter((member) => readMemberPreference(member.id).blocked);

  const canManuallyReviewSignals =
    moderationRole === 'Nami Moderator' || moderationRole === 'Nami Dev';

  const filteredReports = reports.filter((report) => {
    return statusFilter === 'All' || report.status === statusFilter;
  });

  const reportStatusFilters: Array<'All' | SafetyReport['status']> = [
    'All',
    'Queued',
    'Reviewing',
    'Warned',
    'Timed Out',
    'Escalated',
    'Resolved'
  ];

  const moderationRoles = ['Member', 'Channel Owner', 'Nami Moderator', 'Nami Dev'] as const;

  function openMember(member: (typeof members)[number]): void {
    window.localStorage.setItem('nami-selected-member-id', member.id);
    props.onNavigate('memberProfile');
  }

  function noteFor(reportId: string): string {
    return moderationNotes[reportId] ?? '';
  }

  function updateReportStatus(
    report: SafetyReport,
    status: SafetyReport['status'],
    action: SafetyActionRecord['action'],
    fallbackNote: string
  ): void {
    const note = noteFor(report.id).trim() || fallbackNote;
    const nextReports = readSafetyReports().map((currentReport) => {
      if (currentReport.id !== report.id) {
        return currentReport;
      }

      return {
        ...currentReport,
        status
      };
    });

    saveSafetyReports(nextReports);

    saveSafetyAction({
      reportId: report.id,
      targetId: report.targetId,
      targetName: report.targetName,
      action,
      note,
      channelName: report.channelName
    });

    setModerationNotes((currentNotes) => ({
      ...currentNotes,
      [report.id]: ''
    }));

    setRefreshKey((value) => value + 1);
  }

  function reviewMemberSignal(member: (typeof members)[number], signal: NamiChannel['signal']): void {
    if (!canManuallyReviewSignals) {
      return;
    }

    saveMemberSignalReview(member.id, signal);

    saveSafetyAction({
      reportId: 'signal-review-' + member.id,
      targetId: member.id,
      targetName: member.name,
      action: 'Signal Review',
      note: 'Signal manually reviewed as ' + signal + ' by ' + moderationRole,
      channelName: 'Nami Conduct Review'
    });

    setRefreshKey((value) => value + 1);
  }

  function clearReports(): void {
    window.localStorage.setItem('nami-safety-reports', JSON.stringify([]));
    setRefreshKey((value) => value + 1);
  }

  function clearActions(): void {
    window.localStorage.setItem('nami-safety-actions', JSON.stringify([]));
    setRefreshKey((value) => value + 1);
  }

  return (
    <>
      <header className="page-title">
        <p>Safety preferences and moderation</p>
        <h1>Safety Center</h1>
      </header>

      <section className={canManuallyReviewSignals ? 'safety-center-page has-signal-review-access' : 'safety-center-page'}>
        <article className="panel safety-hero-panel">
          <div>
            <span className="mini-badge">UI-A8B Moderation Layer</span>
            <h2>Conduct-based Color Signals</h2>
            <p>
              Color Signals are primarily determined by conduct and language safety. Manual
              signal changes are restricted to Nami Devs and Nami Moderators.
            </p>
          </div>

          <button
            className="secondary-action"
            onClick={() => props.onNavigate('settings')}
            type="button"
          >
            Back to Settings
          </button>
        </article>

        <article className="panel conduct-policy-panel">
          <div className="profile-panel-heading">
            <h2>Conduct Signal Policy</h2>
            <p>
              Channel owners can review reports and take moderation actions, but they cannot
              manually change Color Signals. Adult language and conduct violations are filtered
              from chat and routed toward safety review.
            </p>
          </div>

          <div className="conduct-policy-grid">
            <span>Auto conduct filter</span>
            <strong>Adult language removed from chat surfaces</strong>

            <span>Signal authority</span>
            <strong>Nami Devs / Nami Moderators only</strong>

            <span>Channel owner role</span>
            <strong>Review, warn, timeout, escalate</strong>

            <span>User controls</span>
            <strong>Mute, block, report</strong>
          </div>
        </article>

        <article className="panel moderation-role-panel">
          <div className="profile-panel-heading">
            <h2>Mock Access Role</h2>
            <p>Switch roles to preview who can manually review Color Signals.</p>
          </div>

          <div className="moderation-role-row">
            {moderationRoles.map((role) => (
              <button
                className={role === moderationRole ? 'is-selected-role' : ''}
                key={role}
                onClick={() => setModerationRole(role)}
                type="button"
              >
                {role}
              </button>
            ))}
          </div>

          <p className={canManuallyReviewSignals ? 'signal-access-note is-unlocked' : 'signal-access-note'}>
            {canManuallyReviewSignals
              ? 'Manual Color Signal review is unlocked for this role.'
              : 'Nami Moderator Signal Review is hidden for this role.'}
          </p>
        </article>

        <section className="safety-grid">
          <article className="panel safety-list-panel">
            <div className="profile-panel-heading">
              <h2>Muted Members</h2>
              <p>Muted members stay visible, but appear quieter in Game Chat.</p>
            </div>

            <div className="safety-member-list">
              {mutedMembers.length === 0 && <span className="empty-safety-note">No muted members yet.</span>}

              {mutedMembers.map((member) => (
                <button
                  className="safety-member-row"
                  key={member.id}
                  onClick={() => openMember(member)}
                  type="button"
                >
                  <div className={'chat-member-avatar ' + signalClass(readMemberSignalReview(member.id, member.signal))}>
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong>{member.name}</strong>
                    <span>{member.tier} · {readMemberSignalReview(member.id, member.signal)}</span>
                  </div>
                  <i>Muted</i>
                </button>
              ))}
            </div>
          </article>

          <article className="panel safety-list-panel">
            <div className="profile-panel-heading">
              <h2>Blocked Members</h2>
              <p>Blocked members are hidden from Game Chat surfaces.</p>
            </div>

            <div className="safety-member-list">
              {blockedMembers.length === 0 && <span className="empty-safety-note">No blocked members yet.</span>}

              {blockedMembers.map((member) => (
                <button
                  className="safety-member-row is-blocked-safety-row"
                  key={member.id}
                  onClick={() => openMember(member)}
                  type="button"
                >
                  <div className={'chat-member-avatar ' + signalClass(readMemberSignalReview(member.id, member.signal))}>
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong>{member.name}</strong>
                    <span>{member.tier} · {readMemberSignalReview(member.id, member.signal)}</span>
                  </div>
                  <i>Blocked</i>
                </button>
              ))}
            </div>
          </article>
        </section>

        <section className="moderation-queue-grid">
          <article className="panel moderation-queue-panel">
            <div className="profile-panel-heading">
              <h2>Report Queue</h2>
              <p>Channel owners can review reports, but signal changes remain Nami-controlled.</p>
            </div>

            <div className="moderation-status-filter-row">
              {reportStatusFilters.map((filter) => (
                <button
                  className={filter === statusFilter ? 'is-active-filter' : ''}
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  type="button"
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="moderation-report-stack">
              {filteredReports.length === 0 && <span className="empty-safety-note">No reports match this filter.</span>}

              {filteredReports.map((report) => {
                const reportActions = actions.filter((action) => action.reportId === report.id);

                return (
                  <div className="moderation-report-card is-expanded-report-card" key={report.id}>
                    <div>
                      <span className="mini-badge">{report.status}</span>
                      <strong>{report.targetName}</strong>
                      <p>{report.reason}</p>
                      <small>{report.channelName} · {report.createdAt}</small>

                      <textarea
                        onChange={(event) => {
                          setModerationNotes((currentNotes) => ({
                            ...currentNotes,
                            [report.id]: event.target.value
                          }));
                        }}
                        placeholder="Add moderator note..."
                        value={noteFor(report.id)}
                      />

                      <div className="report-action-history">
                        {reportActions.length === 0 && <span>No action history yet.</span>}

                        {reportActions.map((action) => (
                          <small key={action.id}>
                            {action.action}: {action.note} · {action.createdAt}
                          </small>
                        ))}
                      </div>
                    </div>

                    <div className="moderation-action-row">
                      <button
                        onClick={() => updateReportStatus(report, 'Reviewing', 'Review', 'Report moved to review.')}
                        type="button"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => updateReportStatus(report, 'Warned', 'Warn', 'Warning issued.')}
                        type="button"
                      >
                        Warn
                      </button>
                      <button
                        onClick={() => updateReportStatus(report, 'Timed Out', 'Timeout', 'Temporary timeout applied.')}
                        type="button"
                      >
                        Timeout
                      </button>
                      <button
                        onClick={() => updateReportStatus(report, 'Escalated', 'Escalate', 'Report escalated to Nami review.')}
                        type="button"
                      >
                        Escalate
                      </button>
                      <button
                        onClick={() => updateReportStatus(report, 'Resolved', 'Resolve', 'Report resolved.')}
                        type="button"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {reports.length > 0 && (
              <button className="profile-secondary-link" onClick={clearReports} type="button">
                Clear mock queue
              </button>
            )}
          </article>

          {canManuallyReviewSignals && (
            <article className="panel moderation-queue-panel">
            <div className="profile-panel-heading">
              <h2>Nami Moderator Signal Review</h2>
              <p>Manual Color Signal changes are locked unless the active role is Nami Moderator or Nami Dev.</p>
            </div>

            <div className="signal-review-stack">
              {members
                .filter((member) => member.signal !== 'Black')
                .map((member) => {
                  const reviewedSignal = readMemberSignalReview(member.id, member.signal);

                  return (
                    <div className="signal-review-card" key={member.id}>
                      <button
                        className="signal-review-member-button"
                        onClick={() => openMember(member)}
                        type="button"
                      >
                        <div className={'chat-member-avatar ' + signalClass(reviewedSignal)}>
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong>{member.name}</strong>
                          <span>{member.tier} · {reviewedSignal}</span>
                        </div>
                      </button>

                      <div className="signal-review-action-row">
                        {(['Green', 'Orange', 'Red'] as Array<NamiChannel['signal']>).map((signal) => (
                          <button
                            className={
                              signal === reviewedSignal
                                ? 'is-selected-signal-review'
                                : canManuallyReviewSignals
                                  ? ''
                                  : 'is-locked-signal-review'
                            }
                            disabled={!canManuallyReviewSignals}
                            key={signal}
                            onClick={() => reviewMemberSignal(member, signal)}
                            type="button"
                          >
                            {signal}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="owner-tool-grid">
              <button type="button">Lock Thread</button>
              <button type="button">Open Audit Log</button>
              <button type="button">Review Guild</button>
              <button type="button">Escalate to Nami</button>
            </div>
          </article>
          )}
        </section>

        <article className="panel moderation-queue-panel">
          <div className="profile-panel-heading">
            <h2>Action History</h2>
            <p>Moderator actions are kept separate from payment, verification, and subscriptions.</p>
          </div>

          <div className="moderation-report-stack">
            {actions.length === 0 && <span className="empty-safety-note">No moderation actions yet.</span>}

            {actions.map((action) => (
              <div className="moderation-report-card" key={action.id}>
                <div>
                  <span className="mini-badge">{action.action}</span>
                  <strong>{action.targetName}</strong>
                  <p>{action.note}</p>
                  <small>{action.channelName} · {action.createdAt}</small>
                </div>
              </div>
            ))}
          </div>

          {actions.length > 0 && (
            <button className="profile-secondary-link" onClick={clearActions} type="button">
              Clear mock action history
            </button>
          )}
        </article>
      </section>
    </>
  );
}

function Subscriptions(props: {
  selectedChannel: NamiChannel;
  onSelect: (channel: NamiChannel) => void;
  onOpenProfile: (channel: NamiChannel) => void;
}): ReactElement {
  const subscribedChannels = channels.slice(0, 4);
  const recommendedChannels = channels.slice(2);

  return (
    <>
      <header className="page-title">
        <p>Account subscriptions</p>
        <h1>My Subscriptions</h1>
      </header>

      <section className="subscriptions-page">
        <article className="panel subscription-hero-panel">
          <div>
            <span className="mini-badge">Subscription Manager</span>
            <h2>Manage your channel access</h2>
            <p>
              Subscriptions add convenience, personalization, and expanded platform features.
              They do not replace trust, verification, or reputation.
            </p>
          </div>

          <div className="subscription-cap-card">
            <span>Current Plan</span>
            <strong>Free Explorer</strong>
            <p>{subscribedChannels.length}/5 followed channels</p>
          </div>
        </article>

        <section className="subscription-layout">
          <article className="panel">
            <div className="profile-panel-heading">
              <h2>Subscribed Channels</h2>
              <p>Your active game and community subscriptions.</p>
            </div>

            <div className="subscription-channel-stack">
              {subscribedChannels.map((channel) => (
                <button
                  className={
                    channel.id === props.selectedChannel.id
                      ? 'subscription-channel-card is-selected-subscription'
                      : 'subscription-channel-card'
                  }
                  key={channel.id}
                  onClick={() => {
                    props.onSelect(channel);
                    props.onOpenProfile(channel);
                  }}
                  type="button"
                >
                  <ChannelAvatar channel={channel} size="sm" />
                  <div>
                    <strong>{channel.name}</strong>
                    <span>{channel.genre} · {channel.platforms.join(' / ')}</span>
                  </div>
                  <i className={signalClass(channel.signal)}>{channel.signal}</i>
                </button>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="profile-panel-heading">
              <h2>Recommended Channels</h2>
              <p>Discover channels that match your current interests.</p>
            </div>

            <div className="subscription-recommendation-grid">
              {recommendedChannels.map((channel) => (
                <button
                  className="subscription-recommendation-card"
                  key={channel.id}
                  onClick={() => {
                    props.onSelect(channel);
                    props.onOpenProfile(channel);
                  }}
                  type="button"
                >
                  <ChannelAvatar channel={channel} size="sm" />
                  <strong>{channel.name}</strong>
                  <span>{channel.tagline}</span>
                  <i>{channel.subscribers.toLocaleString()} members</i>
                </button>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="profile-panel-heading">
              <h2>Subscription Features</h2>
              <p>Paid tiers expand features without buying trust status.</p>
            </div>

            <div className="subscription-feature-list">
              <span>More followed channels</span>
              <span>Profile cosmetics</span>
              <span>Banner slots</span>
              <span>Layout presets</span>
              <span>Advanced filters</span>
              <span>Premium reactions</span>
            </div>
          </article>
        </section>
      </section>
    </>
  );
}

function UserProfileScreen(props: {
  onOpenProfile?: (channel: NamiChannel) => void;
  onNavigate?: (page: NamiPage) => void;
} = {}): ReactElement {
  const profileMember = members[0]!;
  const mySubscriptions = channels.slice(0, 4);
const myGuilds = [
    {
      name: 'Wave Raiders',
      role: 'Guild Ally',
      signal: 'Green',
      members: 128
    },
    {
      name: 'Night Market PvP',
      role: 'Event Squad',
      signal: 'Orange',
      members: 84
    },
    {
      name: 'Creator Circle',
      role: 'Cosmetic Crew',
      signal: 'Green',
      members: 42
    }
  ];

  return (
    <>
      <header className="page-title">
        <p>Member identity and passport</p>
        <h1>My Profile</h1>
      </header>

      <section className="user-profile-page">
        <article className="user-profile-card user-profile-card-expanded">
          <div className={'user-avatar-large ' + signalClass(profileMember.signal)}>
            {profileMember.name.slice(0, 2).toUpperCase()}
          </div>

          <div>
            <div className="profile-signal-badge-row">
              <span className={'profile-signal-chip ' + signalClass(profileMember.signal)}>
                <i />
                {profileMember.signal}
              </span>

              <span className="profile-badge-icon profile-badge-icon-custom" title="Adventurer">
                A
              </span>

              <span className="profile-badge-icon profile-badge-icon-custom" title="Gamester">
                G
              </span>
            </div>

            <h2>{profileMember.name}</h2>
            <p>
              Portable gamer identity powered by Sui. This is the user-owned profile area,
              separate from channel/game profiles.
            </p>

            <div className="passport-detail-grid">
              <span>Handle</span>
              <strong>@npcgamer</strong>
              <span>Wallet</span>
              <strong>0xUSER</strong>
              <span>Passport</span>
              <strong>0xPASSPORT</strong>
              <span>Profile Status</span>
              <strong>Public Passport</strong>
            </div>
          </div>
        </article>

        <section className="profile-quick-grid">
          <article className="panel profile-embedded-card">
            <div className="profile-panel-heading">
              <h2>My Subscriptions</h2>
              <p>Your subscribed channels now live inside your profile hub.</p>
            </div>

            <div className="profile-subscription-mini-grid">
              {mySubscriptions.map((channel) => (
                <button
                  className="profile-mini-channel-card"
                  key={channel.id}
                  onClick={() => props.onOpenProfile?.(channel)}
                  type="button"
                >
                  <ChannelAvatar channel={channel} size="sm" />
                  <div>
                    <strong>{channel.name}</strong>
                    <span>{channel.genre}</span>
                  </div>
                  <i className={signalClass(channel.signal)}>{channel.signal}</i>
                </button>
              ))}
            </div>

            <button
              className="profile-secondary-link"
              onClick={() => props.onNavigate?.('subscriptions')}
              type="button"
            >
              Open full subscription manager
            </button>
          </article>

          <article className="panel profile-embedded-card">
            <div className="profile-panel-heading">
              <h2>My Guilds</h2>
              <p>Guild memberships and social groups connected to your passport.</p>
            </div>

            <div className="profile-guild-mini-grid">
              {myGuilds.map((guild) => (
                <button className="profile-mini-guild-card" key={guild.name} type="button">
                  <span className={'legend-dot ' + signalClass(guild.signal as NamiChannel['signal'])} />
                  <div>
                    <strong>{guild.name}</strong>
                    <small>{guild.role} · {guild.members} members</small>
                  </div>
                </button>
              ))}
            </div>

            <button
              className="profile-secondary-link"
              onClick={() => props.onNavigate?.('guilds')}
              type="button"
            >
              Open full guild manager
            </button>
          </article>

          <article className="panel">
            <div className="profile-panel-heading">
              <h2>Titles & Cosmetics</h2>
              <p>Equipped identity visuals, titles, frames, and premium personalization.</p>
            </div>

            <div className="subscription-feature-list">
              <span>Gamester</span>
              <span>Goblin</span>
              <span>Guild Ally</span>
              <span>Genesis Frame</span>
              <span>Wave Passport Theme</span>
              <span>Signal Ring</span>
            </div>
          </article>
        </section>
      </section>
    </>
  );
}

function GuildsScreen(): ReactElement {
  return (
    <>
      <header className="page-title">
        <p>Squads and guild spaces</p>
        <h1>My Guilds</h1>
      </header>

      <section className="account-grid uniform-card-grid">
        {channels.slice(0, 4).map((channel) => (
          <article className="profile-panel account-card fixed-card guild-card" key={channel.id}>
            <div className="fixed-card-body">
              <div className={'guild-card-icon guild-icon-' + channel.signal.toLowerCase()}>
                {channel.name.slice(0, 2).toUpperCase()}
              </div>

              <div className="fixed-card-copy">
                <h2>{channel.name} Guild</h2>
                <p>{channel.genre}</p>
              </div>
            </div>

            <div className="fixed-card-footer">
              <span className={'guild-signal-pill guild-signal-' + channel.signal.toLowerCase()}>
                {channel.signal}
              </span>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

function MessagesScreen(): ReactElement {
  return (
    <>
      <header className="page-title">
        <p>Member conversations</p>
        <h1>Messages</h1>
      </header>

      <section className="account-grid">
        {members.map((member) => (
          <article className="profile-panel account-card" key={member.id}>
            <div className={'member-dot ' + signalClass(member.signal)}>
              <span>{member.name.slice(0, 2).toUpperCase()}</span>
            </div>
            <h2>{member.name}</h2>
            <p>{member.badge} · {member.tier}</p>
            <span className={'mini-badge signal-text-' + member.signal.toLowerCase()}>
              {member.signal}
            </span>
          </article>
        ))}
      </section>
    </>
  );
}

function ChannelEventsScreen(props: {
  channel: NamiChannel;
  onNavigate: (page: NamiPage) => void;
}): ReactElement {
  const channelBrandTheme = useMemo(() => {
    return getStoredChannelBrandTheme(props.channel.id);
  }, [props.channel.id]);

  useEffect(() => {
    applyChannelBrandToDocument(channelBrandTheme);

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [channelBrandTheme, props.channel.id]);

  const gameEvents = [
    {
      title: props.channel.name + ' Launch Tournament',
      status: 'Registration open',
      date: 'Tonight · 8:00 PM',
      type: 'Competitive',
      seats: '42/64'
    },
    {
      title: 'Guild Recruitment Night',
      status: 'Live lobby',
      date: 'Tomorrow · 7:30 PM',
      type: 'Social',
      seats: '18/40'
    },
    {
      title: 'Developer AMA',
      status: 'Official',
      date: 'Friday · 6:00 PM',
      type: 'Announcement',
      seats: 'Unlimited'
    },
    {
      title: 'Patch Notes Watch Party',
      status: 'Scheduled',
      date: 'Saturday · 4:00 PM',
      type: 'Community',
      seats: '26/100'
    }
  ];

  return (
    <>
      <header className="page-title">
        <p>Selected game events</p>
        <h1>{props.channel.name} Events</h1>
      </header>

      <section className="channel-events-page channel-subsection-surface">
        <article className="channel-events-hero panel">
          <div className="chat-presence-channel">
            <ChannelAvatar channel={props.channel} size="lg" />
            <div>
              <span className="mini-badge">Channel Events</span>
              <h2>{props.channel.name}</h2>
              <p>
                Events shown here belong to this selected game/channel, not your account-level
                My Events page.
              </p>
            </div>
          </div>

          <div className="profile-hero-actions">
            <button
              className="secondary-action"
              onClick={() => props.onNavigate('channelProfile')}
              type="button"
            >
              Back to Game Profile
            </button>

            <button
              className="primary-action"
              onClick={() => props.onNavigate('chat')}
              type="button"
            >
              Open Main Chat
            </button>
          </div>
        </article>

        <section className="channel-event-grid">
          {gameEvents.map((event) => (
            <article className="channel-event-card panel" key={event.title}>
              <div>
                <span className="mini-badge">{event.type}</span>
                <h2>{event.title}</h2>
                <p>{event.date}</p>
              </div>

              <div className="channel-event-meta-row">
                <span>{event.status}</span>
                <strong>{event.seats}</strong>
              </div>

              <button type="button">View Event</button>
            </article>
          ))}
        </section>
      </section>
    </>
  );
}

function EventsScreen(): ReactElement {
  const events = [
    {
      label: 'Event 1',
      title: 'Guild Run',
      description: 'Saved event placeholder connected to subscribed channels.'
    },
    {
      label: 'Event 2',
      title: 'PvP Bracket',
      description: 'Saved event placeholder connected to subscribed channels.'
    },
    {
      label: 'Event 3',
      title: 'Builder Showcase',
      description: 'Saved event placeholder connected to subscribed channels.'
    },
    {
      label: 'Event 4',
      title: 'Cozy Night',
      description: 'Saved event placeholder connected to subscribed channels.'
    }
  ];

  return (
    <>
      <header className="page-title">
        <p>Saved and subscribed activity</p>
        <h1>My Events</h1>
      </header>

      <section className="account-grid uniform-card-grid">
        {events.map((eventItem) => (
          <article className="profile-panel account-card fixed-card event-card" key={eventItem.label}>
            <div className="fixed-card-body">
              <span className="feature-label">{eventItem.label}</span>

              <div className="fixed-card-copy">
                <h2>{eventItem.title}</h2>
                <p>{eventItem.description}</p>
              </div>
            </div>

            <div className="fixed-card-footer">
              <button type="button">View Event</button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

function SettingsScreen(props: {
  onNavigate?: (page: NamiPage) => void;
} = {}): ReactElement {
  const mutedMembers = members.filter((member) => readMemberPreference(member.id).muted);
  const blockedMembers = members.filter((member) => readMemberPreference(member.id).blocked);
  const reportCount = readSafetyReports().length;

  return (
    <>
      <header className="page-title">
        <p>Account preferences and controls</p>
        <h1>Settings</h1>
      </header>

      <section className="settings-page">
        <article className="panel settings-hero-panel">
          <div>
            <span className="mini-badge">Account Settings</span>
            <h2>Control your Nami experience</h2>
            <p>
              Settings is the home for safety preferences, notifications, privacy,
              accessibility, and account-level controls.
            </p>
          </div>
        </article>

        <section className="settings-grid">
          <article className="panel settings-card safety-settings-card">
            <div className="profile-panel-heading">
              <h2>Safety Center</h2>
              <p>
                Manage muted members, blocked members, reports, moderation history,
                and conduct-based Color Signal review.
              </p>
            </div>

            <div className="safety-summary-row">
              <span>{mutedMembers.length} muted</span>
              <span>{blockedMembers.length} blocked</span>
              <span>{reportCount} reports</span>
            </div>

            <button
              className="profile-secondary-link"
              onClick={() => props.onNavigate?.('safetyCenter')}
              type="button"
            >
              Open Safety Center
            </button>
          </article>

          <article className="panel settings-card">
            <div className="profile-panel-heading">
              <h2>Privacy</h2>
              <p>Control profile visibility, message permissions, and discovery surfaces.</p>
            </div>

            <div className="settings-toggle-list">
              <span>Public profile enabled</span>
              <span>Allow channel recommendations</span>
              <span>Hide wallet details by default</span>
            </div>
          </article>

          <article className="panel settings-card">
            <div className="profile-panel-heading">
              <h2>Notifications</h2>
              <p>Manage event alerts, guild updates, and channel announcements.</p>
            </div>

            <div className="settings-toggle-list">
              <span>Game event reminders</span>
              <span>Guild announcements</span>
              <span>Moderation status updates</span>
            </div>
          </article>

          <article className="panel settings-card">
            <div className="profile-panel-heading">
              <h2>Accessibility</h2>
              <p>Customize animation intensity, contrast, and compact layout preferences.</p>
            </div>

            <div className="settings-toggle-list">
              <span>Reduced motion mode</span>
              <span>High contrast signal badges</span>
              <span>Compact chat density</span>
            </div>
          </article>
        </section>
      </section>
    </>
  );
}



export function App(): ReactElement {
  const [activePage, setActivePage] = useState<NamiPage>('hub');
  const [selectedChannel, setSelectedChannel] = useState<NamiChannel>(() => {
    const defaultChannel = channels[0];
    if (!defaultChannel) {
      throw new Error('Nami mock channels must include at least one channel.');
    }

    return defaultChannel;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const openChannelProfile = (channel: NamiChannel): void => {
    setSelectedChannel(channel);
    setActivePage('channelProfile');
  };

  const screen = useMemo(() => {
    if (activePage === 'hub') {
      return <NamiHub
          selectedChannel={selectedChannel}
          onSelect={setSelectedChannel}
          onOpenProfile={openChannelProfile}
        />;
    }

    if (activePage === 'gamehub') {
      return (
        <GameHub
          selectedChannel={selectedChannel}
          onSelect={setSelectedChannel}
          onOpenProfile={openChannelProfile}
        />
      );
    }

    if (activePage === 'subscriptions') {
      return (
        <Subscriptions
          selectedChannel={selectedChannel}
          onSelect={setSelectedChannel}
          onOpenProfile={openChannelProfile}
        />
      );
    }

    if (activePage === 'channelProfile') {
      return (
        <ChannelProfile
          channel={selectedChannel}
          onNavigate={setActivePage}
          onOpenProfile={openChannelProfile}
        />
      );
    }

    if (activePage === 'chat') {
    return <GameChat
        channel={selectedChannel}
        onNavigate={setActivePage}
        onOpenMember={(member) => {
          window.localStorage.setItem('nami-selected-member-id', member.id);
          setActivePage('memberProfile');
        }}
      />;
  }

  if (activePage === 'channelEvents') {
    return <ChannelEventsScreen channel={selectedChannel} onNavigate={setActivePage} />;
  }

  if (activePage === 'safetyCenter') {
    return <SafetyCenterScreen onNavigate={setActivePage} />;
  }

  if (activePage === 'memberProfile') {
    return <MemberProfileScreen
      member={
        members.find((member) => {
          return member.id === window.localStorage.getItem('nami-selected-member-id');
        }) ?? members[0]!
      }
      onNavigate={setActivePage}
    />;
  }

if (activePage === 'userProfile') {
      return <UserProfileScreen
          onOpenProfile={openChannelProfile}
          onNavigate={setActivePage}
        />;
    }

    if (activePage === 'guilds') {
      return <GuildsScreen />;
    }

    if (activePage === 'messages') {
      return <MessagesScreen />;
    }

    if (activePage === 'events') {
      return <EventsScreen />;
    }

    if (activePage === 'settings') {
      return <SettingsScreen onNavigate={setActivePage} />;
    }

    return <NamiHub
          selectedChannel={selectedChannel}
          onSelect={setSelectedChannel}
          onOpenProfile={openChannelProfile}
        />;
  }, [activePage, selectedChannel]);

  return (
    <main className="nami-app">
      <Sidebar
        activePage={activePage}
        collapsed={sidebarCollapsed}
        onNavigate={setActivePage}
        onToggle={() => setSidebarCollapsed((value) => !value)}
      />

      <section className="main-stage">{screen}</section>
    </main>
  );
}
