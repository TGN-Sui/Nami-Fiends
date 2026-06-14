import { useMemo, useState, type CSSProperties, type ReactElement } from 'react';

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

function ChannelProfile(props: {
  channel: NamiChannel;
  onNavigate: (page: NamiPage) => void;
  onOpenProfile: (channel: NamiChannel) => void;
}): ReactElement {
  return (
    <>
      <header className="page-title">
        <p>Official community landing page</p>
        <h1>Game Profile</h1>
      </header>

      <FeaturedRail
        title="Same Genre / Related Channels"
        selectedChannel={props.channel}
        onSelect={props.onOpenProfile}
      />

      <section className="channel-profile-buildout">
        <aside className="profile-left-stack">
          <ChannelInfoCard
            channel={props.channel}
            onSubscribe={() => props.onNavigate('subscriptions')}
            onJoinChat={() => props.onNavigate('chat')}
            onGetBanners={() => props.onNavigate('subscriptions')}
          />

          <article className="profile-panel verified-links-panel">
            <div className="profile-panel-heading">
              <h2>Verified Links</h2>
              <p>Official destinations connected to this channel.</p>
            </div>

            <div className="verified-link-list">
              {props.channel.verifiedLinks.map((link) => (
                <button key={link.label} type="button">
                  <strong>{link.label}</strong>
                  <span>{link.verified ? 'Verified' : 'Pending verification'}</span>
                </button>
              ))}
            </div>
          </article>

          <article className="profile-panel badge-zone">
            <div className="profile-panel-heading">
              <h2>Badges</h2>
              <p>Official Nami badges are locked. Channel badges are customizable.</p>
            </div>

            <div className="badge-columns">
              <div>
                <h3>Official Nami</h3>
                {props.channel.officialBadges.map((badge) => (
                  <span className="profile-badge official-badge" key={badge}>
                    {badge}
                  </span>
                ))}
              </div>

              <div>
                <h3>Channel Custom</h3>
                {props.channel.customBadges.map((badge) => (
                  <span className="profile-badge custom-badge" key={badge}>
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </article>
        </aside>

        <section className="profile-main-stack">
          <article className="channel-hero-buildout">
            <div>
              <span className={'mini-badge signal-text-' + props.channel.signal.toLowerCase()}>
                {props.channel.signal} Channel Signal
              </span>
              <h2>{props.channel.banner}</h2>
              <p>
                Customizable channel banner area for tone, featured art, event
                campaigns, and Pro / Elite visual personalization.
              </p>
            </div>

            <ChannelAvatar channel={props.channel} size="lg" />
          </article>

          <article className="profile-panel official-announcements-buildout">
            <div className="profile-panel-heading">
              <h2>Official Announcements</h2>
              <p>Verified posts from channel owners, developers, or approved moderators.</p>
            </div>

            <div className="announcement-list">
              {props.channel.announcements.map((announcement, index) => (
                <button key={announcement} type="button">
                  <span>Announcement {index + 1}</span>
                  <strong>{announcement}</strong>
                </button>
              ))}
            </div>
          </article>

          <article className="profile-panel profile-module-panel">
            <div className="profile-panel-heading">
              <h2>Channel Sections</h2>
              <p>Curated tabs and deeper spaces for this game or community.</p>
            </div>

            <ModuleGrid channel={props.channel} onNavigate={props.onNavigate} />
          </article>
        </section>
      </section>
    </>
  );
}

function GameChat(props: {
  channel: NamiChannel;
  onNavigate: (page: NamiPage) => void;
}): ReactElement {
  const [hideNpc, setHideNpc] = useState(false);
  const [hideRed, setHideRed] = useState(false);

  const visibleMessages = chatMessages.filter((message) => {
    if (hideRed && message.signal === 'Red') return false;
    return true;
  });

  return (
    <>
      <header className="page-title">
        <p>Live community room</p>
        <h1>Game Chat</h1>
      </header>

      <section className="member-rail">
        <ChannelAvatar channel={props.channel} size="lg" />
        {members.map((member) => (
          <div className={'member-dot ' + signalClass(member.signal)} key={member.id}>
            <span>{member.name.slice(0, 2).toUpperCase()}</span>
            <small>{member.name}</small>
          </div>
        ))}
      </section>

      <section className="chat-shell">
        <div className="tab-row">
          {['Profile', 'Timeline', 'Guilds', 'Events', 'Esports', 'Party', 'Notes', 'Gated', 'Badges', 'Support'].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => {
                  if (tab === 'Profile') {
                    props.onNavigate('channelProfile');
                  }
                }}
                type="button"
              >
                {tab}
              </button>
            )
          )}
        </div>

        <div className="chat-layout">
          <article className="chat-window">
            <h2>{props.channel.name} Chat</h2>
            {visibleMessages.map((message) => (
              <div className="chat-message" key={message.id}>
                <span>{message.time}</span>
                <strong className={'signal-text-' + message.signal.toLowerCase()}>
                  {message.author}
                </strong>
                <p>{message.body}</p>
              </div>
            ))}
          </article>

          <aside className="chat-filters">
            <h3>Filter Options</h3>

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

            <button type="button">Save Preset</button>
            <button type="button">Customize Chat</button>
          </aside>
        </div>
      </section>
    </>
  );
}

function Subscriptions(props: {
  selectedChannel: NamiChannel;
  onSelect: (channel: NamiChannel) => void;
  onNavigate: (page: NamiPage) => void;
}): ReactElement {
  return (
    <>
      <header className="page-title">
        <p>Personal channel library</p>
        <h1>My Subscriptions</h1>
      </header>

      <FeaturedRail
        title="Subscribed Channels"
        selectedChannel={props.selectedChannel}
        onSelect={props.onSelect}
        onlySubscribed
      />

      <section className="profile-layout">
        <div>
          <ChannelInfoCard
            channel={props.selectedChannel}
            onSubscribe={() => props.onSelect(props.selectedChannel)}
            onJoinChat={() => props.onNavigate('chat')}
            onGetBanners={() => undefined}
          />
          <article className="panel announcement-panel">
            <h2>Official Announcements</h2>
            <p>Unread banners, followed channel updates, and subscribed alerts live here.</p>
          </article>
        </div>

        <ModuleGrid channel={props.selectedChannel} onNavigate={props.onNavigate} />
      </section>
    </>
  );
}


function UserProfileScreen(): ReactElement {
  return (
    <>
      <header className="page-title">
        <p>Member identity and Passport</p>
        <h1>My Profile</h1>
      </header>

      <section className="account-layout">
        <article className="profile-panel user-profile-card">
          <div className={'user-avatar-large ' + signalClass(userProfile.conductSignal)}>
            {userProfile.displayName.slice(0, 2).toUpperCase()}
          </div>

          <div>
            <div className="badge-row">
              <span className={'mini-badge signal-text-' + userProfile.conductSignal.toLowerCase()}>
                {userProfile.conductSignal}
              </span>
              <span className="mini-badge">{userProfile.tier}</span>
              <span className="mini-badge">{userProfile.reputation}</span>
            </div>

            <h2>{userProfile.displayName}</h2>
            <p>{userProfile.bio}</p>

            <dl>
              <div>
                <dt>Handle</dt>
                <dd>{userProfile.handle}</dd>
              </div>
              <div>
                <dt>Wallet</dt>
                <dd>{userProfile.wallet}</dd>
              </div>
              <div>
                <dt>Passport</dt>
                <dd>{userProfile.passportId}</dd>
              </div>
              <div>
                <dt>Level / XP</dt>
                <dd>{userProfile.level} / {userProfile.xp}</dd>
              </div>
            </dl>
          </div>
        </article>

        <article className="profile-panel">
          <div className="profile-panel-heading">
            <h2>My Badges</h2>
            <p>Owned user badges from Passport progression and community activity.</p>
          </div>
          <div className="interest-tags">
            {userProfile.ownedBadges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
        </article>

        <article className="profile-panel">
          <div className="profile-panel-heading">
            <h2>Titles & Cosmetics</h2>
            <p>Equipped identity visuals, titles, frames, and premium personalization.</p>
          </div>
          <div className="interest-tags">
            {userProfile.titles.concat(userProfile.cosmetics).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </article>
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

function SettingsScreen(): ReactElement {
  const settings = [
    {
      title: 'Profile Privacy',
      description: 'Control public profile visibility and Passport display.'
    },
    {
      title: 'Chat Preferences',
      description: 'Manage filters, muted signals, and message visibility.'
    },
    {
      title: 'Theme Customization',
      description: 'Pro / Elite fonts, colors, backgrounds, and animations.'
    },
    {
      title: 'Recovery & Security',
      description: 'Recovery keys, connected wallets, and account safety.'
    }
  ];

  return (
    <>
      <header className="page-title">
        <p>Account controls and personalization</p>
        <h1>Settings</h1>
      </header>

      <section className="account-grid uniform-card-grid">
        {settings.map((setting) => (
          <article className="profile-panel account-card fixed-card settings-card" key={setting.title}>
            <div className="fixed-card-body">
              <div className="fixed-card-copy">
                <h2>{setting.title}</h2>
                <p>{setting.description}</p>
              </div>
            </div>

            <div className="fixed-card-footer">
              <button type="button">Open</button>
            </div>
          </article>
        ))}
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
          onNavigate={setActivePage}
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
      return <GameChat channel={selectedChannel} onNavigate={setActivePage} />;
    }

    if (activePage === 'userProfile') {
      return <UserProfileScreen />;
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
      return <SettingsScreen />;
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
