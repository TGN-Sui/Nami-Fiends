import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement
} from 'react';

import {
  channels,
  chatMessages,
  developers,
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

function channelDeveloper(channel: NamiChannel): (typeof developers)[number] {
  return developers.find((developer) => developer.id === channel.developerId) ?? developers[0]!;
}

function developerGameChannels(developer: (typeof developers)[number]): NamiChannel[] {
  return channels.filter((channel) => developer.gameIds.includes(channel.id));
}

function gameVerificationLabel(channel: NamiChannel): string {
  return channel.verifiedGame ? 'Verified Game' : 'Community Game';
}

type GameVerificationTier = 'verified-game' | 'studio-approved' | 'community-game';

function gameVerificationTier(channel: NamiChannel): GameVerificationTier {
  const developerProfile = channelDeveloper(channel);

  if (channel.verifiedGame) return 'verified-game';
  if (developerProfile.approved) return 'studio-approved';

  return 'community-game';
}

function gameVerificationClass(channel: NamiChannel): string {
  const tier = gameVerificationTier(channel);

  if (tier === 'verified-game') return 'is-verified-game-surface';
  if (tier === 'studio-approved') return 'is-studio-approved-surface';

  return 'is-community-game-surface';
}

function gameVerificationShortLabel(channel: NamiChannel): string {
  const tier = gameVerificationTier(channel);

  if (tier === 'verified-game') return 'VG';
  if (tier === 'studio-approved') return 'ST';

  return 'CM';
}

function gameVerificationBadgeLabel(channel: NamiChannel): string {
  const tier = gameVerificationTier(channel);

  if (tier === 'verified-game') return 'Verified game proof';
  if (tier === 'studio-approved') return 'Studio approved';

  return 'Community listed';
}

function developerVerificationClass(developer: (typeof developers)[number]): string {
  if (developer.proofStatus === 'Verified Studio') return 'is-verified-studio-logo';
  if (developer.approved) return 'is-approved-studio-logo';

  return 'is-community-studio-logo';
}

function developerShortProofLabel(developer: (typeof developers)[number]): string {
  if (developer.proofStatus === 'Verified Studio') return 'VS';
  if (developer.approved) return 'AP';

  return 'CS';
}

function isMemberFoilEligible(member: (typeof members)[number], reviewedSignal: ConductSignal): boolean {
  if (reviewedSignal !== 'Green') return false;
  if (member.tier === 'NPC') return false;
  if (/sponsor|sponsored|squad/i.test(member.badge)) return false;

  return true;
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

type NamiProgressionSnapshot = {
  level: number;
  levelPercent: number;
  currentXp: number;
  nextLevelXp: number;
  seasonXp: number;
  guilds: string[];
  squads: string[];
};

const namiSeasonLevelMarkers = [1, 15, 30, 45, 60, 75, 90, 100] as const;

function memberInitials(member: (typeof members)[number]): string {
  return member.name.slice(0, 2).toUpperCase();
}

function percentForNamiLevel(level: number, currentXp = 0, nextLevelXp = 1000): number {
  const safeLevel = Math.min(100, Math.max(1, level));
  const safeXpPercent = Math.min(1, Math.max(0, currentXp / nextLevelXp));
  const preciseLevel = safeLevel - 1 + safeXpPercent;

  return Math.min(100, Math.max(0, (preciseLevel / 99) * 100));
}

function getNamiProgression(member: (typeof members)[number], tick = Date.now()): NamiProgressionSnapshot {
  const memberIndex = Math.max(0, members.findIndex((currentMember) => currentMember.id === member.id));
  const baseLevel = Math.min(100, 18 + memberIndex * 9 + (member.name.length % 8));
  const nextLevelXp = 1000;
  const liveXpPulse = Math.floor((tick / 1000) % 120);
  const currentXp = Math.min(nextLevelXp - 1, 420 + memberIndex * 73 + liveXpPulse);
  const levelPercent = percentForNamiLevel(baseLevel, currentXp, nextLevelXp);

  const guildSets = [
    ['Wave Raiders', 'Creator Circle'],
    ['Night Market PvP', 'Retro Arena'],
    ['Builder League', 'Sui Creators'],
    ['Ocean Mint Crew', 'Signal Watch']
  ];

  const squadSets = [
    ['Alpha Squad', 'Mint Watch'],
    ['Raid Team', 'Patch Crew'],
    ['Builder Squad', 'Event Ops'],
    ['Support Squad', 'Lore Team']
  ];

  return {
    level: baseLevel,
    levelPercent,
    currentXp,
    nextLevelXp,
    seasonXp: baseLevel * nextLevelXp + currentXp,
    guilds: guildSets[memberIndex % guildSets.length] ?? guildSets[0]!,
    squads: squadSets[memberIndex % squadSets.length] ?? squadSets[0]!
  };
}

function NamiSeasonProgressBar(props: {
  member: (typeof members)[number];
}): ReactElement {
  const [progressTick, setProgressTick] = useState(() => Date.now());
  const progression = getNamiProgression(props.member, progressTick);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setProgressTick(Date.now());
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className="nami-season-progress" aria-label="Nami seasonal reputation progress">
      <div className="nami-season-progress-copy">
        <span>Season Reputation</span>
        <strong>Level {progression.level}</strong>
        <small>{progression.currentXp} / {progression.nextLevelXp} XP</small>
      </div>

      <div className="nami-season-track">
        <div
          className="nami-season-fill"
          style={{ width: progression.levelPercent + '%' }}
        />

        {namiSeasonLevelMarkers.map((level) => (
          <span
            className="nami-season-marker"
            key={level}
            style={{ left: percentForNamiLevel(level) + '%' }}
          >
            <i>{level}</i>
          </span>
        ))}

        <div
          className="nami-season-avatar-marker"
          style={{ left: progression.levelPercent + '%' }}
        >
          <span className={'nami-season-avatar ' + signalClass(props.member.signal)}>
            {memberInitials(props.member)}
          </span>
          <strong>{progression.level}</strong>
        </div>
      </div>
    </section>
  );
}

function namiReturnLabelForPage(page: NamiPage): string {
  if (page === 'hub') return 'Back to Nami Hub';
  if (page === 'gamehub') return 'Back to Game Hub';
  if (page === 'chat') return 'Back to Chat';
  if (page === 'settings') return 'Back to Settings';
  if (page === 'userProfile') return 'Back to My Profile';
  if (page === 'subscriptions') return 'Back to Subscriptions';
  if (page === 'guilds') return 'Back to Guilds';

  return 'Back to Nami Hub';
}

function Sidebar(props: {
  activePage: NamiPage;
  collapsed: boolean;
  onNavigate: (page: NamiPage) => void;
  onToggle: () => void;
}): ReactElement {
  const sidebarMember = members[0]!;
  const sidebarProgression = getNamiProgression(sidebarMember);
  const [sidebarProfileMenuOpen, setSidebarProfileMenuOpen] = useState(false);

  function updateSidebarProfileFoil(event: { currentTarget: HTMLElement; clientX: number; clientY: number }): void {
    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const pointerY = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
    const tiltX = ((0.5 - pointerY) * 8).toFixed(2) + 'deg';
    const tiltY = ((pointerX - 0.5) * 8).toFixed(2) + 'deg';

    event.currentTarget.style.setProperty('--sidebar-profile-x', (pointerX * 100).toFixed(2) + '%');
    event.currentTarget.style.setProperty('--sidebar-profile-y', (pointerY * 100).toFixed(2) + '%');
    event.currentTarget.style.setProperty('--sidebar-profile-tilt-x', tiltX);
    event.currentTarget.style.setProperty('--sidebar-profile-tilt-y', tiltY);
  }

  function resetSidebarProfileFoil(event: { currentTarget: HTMLElement }): void {
    event.currentTarget.style.setProperty('--sidebar-profile-x', '50%');
    event.currentTarget.style.setProperty('--sidebar-profile-y', '18%');
    event.currentTarget.style.setProperty('--sidebar-profile-tilt-x', '0deg');
    event.currentTarget.style.setProperty('--sidebar-profile-tilt-y', '0deg');
  }

  return (
    <aside className={'sidebar ' + (props.collapsed ? 'is-collapsed' : '')}>

      <div className="sidebar-profile-shell">
        <button
          className="sidebar-player-progress sidebar-player-progress-button"
          onClick={() => setSidebarProfileMenuOpen((value) => !value)}
          onPointerLeave={resetSidebarProfileFoil}
          onPointerMove={updateSidebarProfileFoil}
          type="button"
        >
        <div className={'sidebar-player-avatar ' + signalClass(sidebarMember.signal)}>
          {memberInitials(sidebarMember)}
          <strong>{sidebarProgression.level}</strong>
        </div>

        {!props.collapsed && (
          <div className="sidebar-player-copy">
            <span>{sidebarMember.name}</span>
            <small>Lv {sidebarProgression.level} · {sidebarProgression.currentXp} XP</small>
            <div className="sidebar-xp-track">
              <i style={{ width: (sidebarProgression.currentXp / sidebarProgression.nextLevelXp) * 100 + '%' }} />
            </div>
          </div>
        )}
        </button>

        {sidebarProfileMenuOpen && (
          <div className="sidebar-profile-menu">
            <button onClick={() => props.onNavigate('userProfile')} type="button">
              Edit Avatar
            </button>
            <button onClick={() => props.onNavigate('passport')} type="button">
              Share Passport
            </button>
            <button onClick={() => setSidebarProfileMenuOpen(false)} type="button">
              Sign Out
            </button>
          </div>
        )}
      </div>

      <button className={'sidebar-brand' + (props.activePage === 'hub' ? ' is-active-sidebar-brand' : '')}
        onClick={() => props.onNavigate('hub')}
        type="button"
      >
        <div className="diamond-mark">N</div>
        {!props.collapsed && <span>Nami Hub</span>}
      </button>

      <button className="sidebar-toggle" onClick={props.onToggle} type="button">
        {props.collapsed ? '→' : '←'}
      </button>

      
        <button
          className={
            'sidebar-gamehub-shortcut' +
            (props.activePage === 'gamehub' ? ' is-active-gamehub-shortcut' : '')
          }
          onClick={() => props.onNavigate('gamehub')}
          type="button"
        >
          <span className="nav-icon">G</span>
          {!props.collapsed && <span>Game Hub</span>}
        </button>

        <nav className="sidebar-nav">
        {navItems.filter((item) => item.page !== 'hub').map((item) => (
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
    <article className="featured-partner-banner-card channel-info-card">
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

type BubbleChannelEntry = {
  channel: NamiChannel;
  slotId: string;
};

type BubbleNode = {
  id: string;
  channel: NamiChannel;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  radius: number;
  baseRadius: number;
  scale: number;
  mass: number;
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 999.91) * 43758.5453123;
  return x - Math.floor(x);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/* UI-A11C.14 loose crypto marble helpers */

type NamiCryptoBubbleEntry = {
  channel: NamiChannel;
  slotId: string;
};

type NamiCryptoBubbleNode = {
  id: string;
  channel: NamiChannel;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  radius: number;
  baseRadius: number;
  scale: number;
  mass: number;
  collisionStress: number;
};

function namiSeededRandom(seed: number): number {
  const value = Math.sin(seed * 999.91) * 43758.5453123;

  return value - Math.floor(value);
}

function namiClamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function namiSmoothFalloff(value: number): number {
  const clampedValue = namiClamp(value, 0, 1);

  return clampedValue * clampedValue * (3 - 2 * clampedValue);
}

function namiReadableBubbleRadius(
  node: Pick<NamiCryptoBubbleNode, 'radius' | 'baseRadius' | 'scale'>
): number {
  const visualRadius = node.radius * node.scale;
  const softMoat = node.baseRadius >= 50 ? 6 : node.baseRadius >= 40 ? 5 : 4;

  return visualRadius * 0.82 + softMoat;
}

function buildNamiCryptoBubbleNodes(entries: NamiCryptoBubbleEntry[]): NamiCryptoBubbleNode[] {
  const virtualWidth = 1160;
  const virtualHeight = 720;
  const placedNodes: NamiCryptoBubbleNode[] = [];

  return entries.map((entry, index) => {
    const rank = index + 1;
    const randomScale = namiSeededRandom(index + 211);
    const randomMass = namiSeededRandom(index + 311);

    const baseRadius =
      rank <= 5
        ? 56 + randomScale * 12
        : rank <= 12
          ? 47 + randomScale * 10
          : rank <= 24
            ? 37 + randomScale * 9
            : 27 + randomScale * 8;

    const scale = 0.88 + randomScale * 0.3;
    const visualRadius = baseRadius * scale;
    const softMoat = baseRadius >= 50 ? 6 : baseRadius >= 40 ? 5 : 4;
    const candidateRadius = visualRadius * 0.82 + softMoat;
    const padX = candidateRadius / virtualWidth;
    const padY = candidateRadius / virtualHeight;

    let bestX = 0.5;
    let bestY = 0.5;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let attempt = 0; attempt < 72; attempt += 1) {
      const randomX = namiSeededRandom(index * 101 + attempt * 17 + 3);
      const randomY = namiSeededRandom(index * 137 + attempt * 19 + 7);

      const candidateX = namiClamp(0.04 + randomX * 0.92, padX, 1 - padX);
      const candidateY = namiClamp(0.06 + randomY * 0.88, padY, 1 - padY);
      const candidatePixelX = candidateX * virtualWidth;
      const candidatePixelY = candidateY * virtualHeight;

      let closestGap = Number.POSITIVE_INFINITY;

      for (const placedNode of placedNodes) {
        const dx = candidatePixelX - placedNode.x * virtualWidth;
        const dy = candidatePixelY - placedNode.y * virtualHeight;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const minimumDistance = candidateRadius + namiReadableBubbleRadius(placedNode);

        closestGap = Math.min(closestGap, distance - minimumDistance);
      }

      const edgeComfort =
        Math.min(candidateX, 1 - candidateX) * 0.35 +
        Math.min(candidateY, 1 - candidateY) * 0.45;

      const score =
        (placedNodes.length === 0 ? 80 : closestGap * 0.55) +
        edgeComfort * 54 +
        namiSeededRandom(index * 197 + attempt * 23) * 22;

      if (score > bestScore) {
        bestScore = score;
        bestX = candidateX;
        bestY = candidateY;
      }
    }

    const node: NamiCryptoBubbleNode = {
      id: entry.slotId,
      channel: entry.channel,
      x: bestX,
      y: bestY,
      vx: 0,
      vy: 0,
      baseX: bestX,
      baseY: bestY,
      radius: baseRadius,
      baseRadius,
      scale,
      mass: 0.9 + randomMass * 1.8,
      collisionStress: 0
    };

    placedNodes.push(node);

    return node;
  });
}

function CryptoBubbleBoard(props: {
  entries: NamiCryptoBubbleEntry[];
  activeChannelId: string;
  onOpenChannel: (channel: NamiChannel) => void;
  onHoverChannel: (channelId: string | null) => void;
}): ReactElement {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const pointerRef = useRef({
    x: 0.5,
    y: 0.5,
    inside: false
  });

  const [renderTick, setRenderTick] = useState(0);
  const entriesSignature = props.entries.map((entry) => entry.slotId).join('|');
  const nodesRef = useRef<NamiCryptoBubbleNode[]>(buildNamiCryptoBubbleNodes(props.entries));
  const maxSubscribers = Math.max(1, ...props.entries.map((entry) => entry.channel.subscribers));

  useEffect(() => {
    nodesRef.current = buildNamiCryptoBubbleNodes(props.entries);
  }, [entriesSignature]);

  useEffect(() => {
    let lastRenderTime = 0;
    let lastFrameTime = 0;

    function effectiveMass(node: NamiCryptoBubbleNode): number {
      return node.mass * Math.max(0.85, node.baseRadius / 42);
    }

    function limitVelocity(node: NamiCryptoBubbleNode, maxVelocity: number): void {
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);

      if (speed > maxVelocity) {
        const ratio = maxVelocity / speed;

        node.vx *= ratio;
        node.vy *= ratio;
      }
    }

    const step = (time: number) => {
      const board = boardRef.current;
      const nodes = nodesRef.current;

      if (!board || nodes.length === 0) {
        animationRef.current = window.requestAnimationFrame(step);
        return;
      }

      const frameDelta = lastFrameTime === 0 ? 1 : namiClamp((time - lastFrameTime) / 16.67, 0.55, 1.55);
      lastFrameTime = time;

      const rect = board.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      const cursorX = pointerRef.current.x * width;
      const cursorY = pointerRef.current.y * height;
      const pointerInside = pointerRef.current.inside;
      const influenceRadius = Math.min(width, height) * 0.35;

      for (const node of nodes) {
        node.collisionStress = 0;

        const px = node.x * width;
        const py = node.y * height;
        const anchorX = node.baseX * width;
        const anchorY = node.baseY * height;

        node.vx += (anchorX - px) * 0.00085 * frameDelta;
        node.vy += (anchorY - py) * 0.00085 * frameDelta;

        if (pointerInside) {
          const dx = px - cursorX;
          const dy = py - cursorY;
          const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;

          if (distance < influenceRadius) {
            const normalized = 1 - distance / influenceRadius;
            const falloff = namiSmoothFalloff(normalized);
            const nx = dx / distance;
            const ny = dy / distance;
            const isLargeBubble = node.baseRadius * node.scale >= 48;
            const proximityForce = isLargeBubble ? 0.23 * falloff : -0.105 * falloff;

            node.vx += nx * proximityForce * frameDelta;
            node.vy += ny * proximityForce * frameDelta;

            const radiusTarget =
              node.baseRadius * (isLargeBubble ? 1 + falloff * 0.045 : 1 + falloff * 0.09);

            node.radius += (radiusTarget - node.radius) * 0.09;
          } else {
            node.radius += (node.baseRadius - node.radius) * 0.065;
          }
        } else {
          node.radius += (node.baseRadius - node.radius) * 0.065;
        }
      }

      for (let solverPass = 0; solverPass < 2; solverPass += 1) {
        for (let index = 0; index < nodes.length; index += 1) {
          for (let nextIndex = index + 1; nextIndex < nodes.length; nextIndex += 1) {
            const left = nodes[index]!;
            const right = nodes[nextIndex]!;
            const leftX = left.x * width;
            const leftY = left.y * height;
            const rightX = right.x * width;
            const rightY = right.y * height;
            const dx = rightX - leftX;
            const dy = rightY - leftY;
            const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;
            const nx = dx / distance;
            const ny = dy / distance;

            const contactDistance = namiReadableBubbleRadius(left) + namiReadableBubbleRadius(right);
            const nearFieldDistance = contactDistance * 1.16;
            const leftMass = effectiveMass(left);
            const rightMass = effectiveMass(right);
            const inverseLeftMass = 1 / leftMass;
            const inverseRightMass = 1 / rightMass;
            const inverseMassTotal = inverseLeftMass + inverseRightMass;

            if (distance < nearFieldDistance && distance > contactDistance) {
              const normalized = 1 - (distance - contactDistance) / (nearFieldDistance - contactDistance);
              const falloff = namiSmoothFalloff(normalized);
              const softForce = falloff * 0.0045 * frameDelta;

              left.vx -= nx * softForce * (inverseLeftMass / inverseMassTotal);
              left.vy -= ny * softForce * (inverseLeftMass / inverseMassTotal);
              right.vx += nx * softForce * (inverseRightMass / inverseMassTotal);
              right.vy += ny * softForce * (inverseRightMass / inverseMassTotal);
            }

            if (distance < contactDistance) {
              const overlap = contactDistance - distance;
              const contactSlop = 8;

              if (overlap > contactSlop) {
                const correction = (overlap - contactSlop) * (solverPass === 0 ? 0.16 : 0.08);

                left.x -= (nx * correction * inverseLeftMass) / inverseMassTotal / width;
                left.y -= (ny * correction * inverseLeftMass) / inverseMassTotal / height;
                right.x += (nx * correction * inverseRightMass) / inverseMassTotal / width;
                right.y += (ny * correction * inverseRightMass) / inverseMassTotal / height;
              }

              const relativeVelocityX = right.vx - left.vx;
              const relativeVelocityY = right.vy - left.vy;
              const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;

              if (velocityAlongNormal < -0.12) {
                const restitution = 0.36;
                const impulseMagnitude =
                  (-(1 + restitution) * velocityAlongNormal) / inverseMassTotal;

                const impulseX = impulseMagnitude * nx;
                const impulseY = impulseMagnitude * ny;

                left.vx -= impulseX * inverseLeftMass;
                left.vy -= impulseY * inverseLeftMass;
                right.vx += impulseX * inverseRightMass;
                right.vy += impulseY * inverseRightMass;
              } else if (overlap > contactSlop) {
                const separationImpulse = (overlap - contactSlop) * 0.0018;

                left.vx -= nx * separationImpulse * inverseLeftMass;
                left.vy -= ny * separationImpulse * inverseLeftMass;
                right.vx += nx * separationImpulse * inverseRightMass;
                right.vy += ny * separationImpulse * inverseRightMass;
              }

              left.collisionStress += Math.max(0, overlap - contactSlop);
              right.collisionStress += Math.max(0, overlap - contactSlop);
            }
          }
        }
      }

      for (const node of nodes) {
        if (node.collisionStress > node.baseRadius * 1.05) {
          const awayFromCenterX = node.x - 0.5;
          const awayFromCenterY = node.y - 0.5;
          const awayDistance =
            Math.sqrt(awayFromCenterX * awayFromCenterX + awayFromCenterY * awayFromCenterY) || 0.0001;
          const stressMove = Math.min(node.collisionStress / 12000, 0.0017);

          node.baseX = namiClamp(
            node.baseX + (awayFromCenterX / awayDistance) * stressMove,
            0.07,
            0.93
          );
          node.baseY = namiClamp(
            node.baseY + (awayFromCenterY / awayDistance) * stressMove,
            0.09,
            0.91
          );
        }

        node.vx *= 0.925;
        node.vy *= 0.925;

        if (Math.abs(node.vx) < 0.012) node.vx *= 0.35;
        if (Math.abs(node.vy) < 0.012) node.vy *= 0.35;

        limitVelocity(node, 18);

        node.x += (node.vx / width) * frameDelta;
        node.y += (node.vy / height) * frameDelta;

        const padX = namiReadableBubbleRadius(node) / width;
        const padY = namiReadableBubbleRadius(node) / height;

        if (node.x < padX) {
          node.x = padX;
          node.vx = Math.abs(node.vx) * 0.42;
        }

        if (node.x > 1 - padX) {
          node.x = 1 - padX;
          node.vx = -Math.abs(node.vx) * 0.42;
        }

        if (node.y < padY) {
          node.y = padY;
          node.vy = Math.abs(node.vy) * 0.42;
        }

        if (node.y > 1 - padY) {
          node.y = 1 - padY;
          node.vy = -Math.abs(node.vy) * 0.42;
        }
      }

      if (time - lastRenderTime > 22) {
        lastRenderTime = time;
        setRenderTick((value) => (value + 1) % 100000);
      }

      animationRef.current = window.requestAnimationFrame(step);
    };

    animationRef.current = window.requestAnimationFrame(step);

    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <section className="panel nami-hub-top50-panel crypto-bubbles-panel">
      <div className="browser-heading">
        <div>
          <h2>Top 50 Communities</h2>
          <p>Live community board with loose marble physics and smooth cursor falloff.</p>
        </div>
        <span>Top 50 board</span>
      </div>

      <div
        className="crypto-bubbles-board"
        data-physics-tick={renderTick}
        onPointerLeave={() => {
          pointerRef.current.inside = false;
          props.onHoverChannel(null);
        }}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();

          pointerRef.current.inside = true;
          pointerRef.current.x = namiClamp((event.clientX - rect.left) / rect.width, 0, 1);
          pointerRef.current.y = namiClamp((event.clientY - rect.top) / rect.height, 0, 1);

          event.currentTarget.style.setProperty('--crypto-cursor-x', pointerRef.current.x * 100 + '%');
          event.currentTarget.style.setProperty('--crypto-cursor-y', pointerRef.current.y * 100 + '%');
        }}
        ref={boardRef}
      >
        {nodesRef.current.map((node, index) => {
          const growthPercent = Math.max(
            8,
            Math.min(100, (node.channel.subscribers / maxSubscribers) * 100)
          );

          return (
            <button
              className={
                'crypto-community-bubble' +
                (node.channel.id === props.activeChannelId ? ' is-active-crypto-bubble' : '')
              }
              key={node.id}
              onClick={() => props.onOpenChannel(node.channel)}
              onMouseEnter={() => props.onHoverChannel(node.channel.id)}
              onMouseLeave={() => props.onHoverChannel(null)}
              style={
                {
                  '--bubble-size': node.radius * 2 + 'px',
                  '--bubble-x': node.x * 100 + '%',
                  '--bubble-y': node.y * 100 + '%',
                  '--bubble-scale': node.scale.toFixed(3),
                  '--bubble-growth': growthPercent + '%'
                } as CSSProperties
              }
              type="button"
            >
              <span className="crypto-bubble-rank">#{index + 1}</span>
              <strong>{node.channel.name}</strong>
              <small>{node.channel.genre}</small>
              <em>{node.channel.subscribers.toLocaleString()}</em>
              <i>
                <b style={{ width: growthPercent + '%' }} />
              </i>
            </button>
          );
        })}
      </div>
    </section>
  );
}


function NamiHub(props: {
  selectedChannel: NamiChannel;
  onSelect: (channel: NamiChannel) => void;
  onOpenProfile: (channel: NamiChannel) => void;

  onOpenMember: (member: (typeof members)[number]) => void;
}): ReactElement {
  const featuredShowcaseChannels = channels.slice(0, 8);
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);
  const [hoveredShowcaseChannelId, setHoveredShowcaseChannelId] = useState<string | null>(null);

  const activeFeaturedChannel =
    hoveredShowcaseChannelId !== null
      ? featuredShowcaseChannels.find((channel) => channel.id === hoveredShowcaseChannelId) ??
        featuredShowcaseChannels[activeShowcaseIndex] ??
        props.selectedChannel
      : featuredShowcaseChannels[activeShowcaseIndex] ?? props.selectedChannel;

  const sortedGrowthChannels = [...channels].sort((left, right) => {
    return right.subscribers - left.subscribers;
  });

  const growthChannels = Array.from({ length: 14 }, (_, index) => {
    return sortedGrowthChannels[index % sortedGrowthChannels.length]!;
  });

  const maxCommunitySubscribers = Math.max(
    1,
    ...growthChannels.map((channel) => channel.subscribers)
  );

  const topCommunityBubbles = Array.from({ length: 50 }, (_, index) => {
    const channel = sortedGrowthChannels[index % sortedGrowthChannels.length]!;

    return {
      channel,
      slotId: channel.id + '-top-community-' + index
    };
  });

  const verifiedSpotlightSource = members.filter((member) => member.signal === 'Green');
  const spotlightSource = verifiedSpotlightSource.length > 0 ? verifiedSpotlightSource : members;
  const spotlightDayOffset =
    spotlightSource.length > 0 ? Math.floor(Date.now() / 86400000) % spotlightSource.length : 0;

  const spotlightMembers =
    spotlightSource.length > 0
      ? Array.from({ length: 18 }, (_, index) => {
          const member = spotlightSource[(index + spotlightDayOffset) % spotlightSource.length]!;

          return {
            member,
            slotId: member.id + '-spotlight-' + index
          };
        })
      : [];

  useEffect(() => {
    if (hoveredShowcaseChannelId !== null || featuredShowcaseChannels.length === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveShowcaseIndex((value) => (value + 1) % featuredShowcaseChannels.length);
    }, 2600);

    return () => window.clearInterval(intervalId);
  }, [featuredShowcaseChannels.length, hoveredShowcaseChannelId]);

  function openFeaturedChannel(channel: NamiChannel): void {
    props.onSelect(channel);
    props.onOpenProfile(channel);
  }

  function channelHandle(channel: NamiChannel): string {
    return channel.handle.startsWith('@') ? channel.handle : '@' + channel.handle;
  }

  return (
    <>
      <header className="page-title">
        <p>Signed-in dashboard</p>
        <h1>Nami Hub</h1>
      </header>

      <button
        className="banner-panel featured-banner-carousel nami-hub-rotating-banner"
        onClick={() => openFeaturedChannel(activeFeaturedChannel)}
        onMouseEnter={() => setHoveredShowcaseChannelId(activeFeaturedChannel.id)}
        onMouseLeave={() => setHoveredShowcaseChannelId(null)}
        type="button"
      >
        <span>Featured Partner Banner Carousel</span>
        <strong>{activeFeaturedChannel.name}</strong>
        <small>{activeFeaturedChannel.genre}</small>
      </button>

      <CryptoBubbleBoard
        activeChannelId={activeFeaturedChannel.id}
        entries={topCommunityBubbles}
        onHoverChannel={setHoveredShowcaseChannelId}
        onOpenChannel={openFeaturedChannel}
      />



      <section className="nami-hub-lower-grid">
        <article className="panel community-growth-panel">
          <div className="profile-panel-heading">
            <h2>Community Growth</h2>
            <p>Clickable channel growth rows with subscriber momentum.</p>
          </div>

          <div className="community-growth-list">
            {growthChannels.map((channel, index) => {
              const growthPercent = Math.max(
                8,
                (channel.subscribers / maxCommunitySubscribers) * 100
              );

              return (
                <button
                  className="community-growth-row"
                  key={channel.id + '-growth-' + index}
                  onClick={() => openFeaturedChannel(channel)}
                  type="button"
                >
                  <span className="community-growth-handle">{channelHandle(channel)}</span>

                  <div className="community-growth-bar-shell">
                    <div
                      className="community-growth-bar"
                      style={{ width: growthPercent + '%' }}
                    />
                  </div>

                  <strong className="community-growth-value">
                    {channel.subscribers.toLocaleString()}
                  </strong>
                </button>
              );
            })}
          </div>
        </article>

        <article className="panel member-spotlight-panel">
          <div className="profile-panel-heading member-spotlight-header">
            <h2>Member Spotlight</h2>
            <p>Verified members cycle daily with their highlight badge and current level.</p>
          </div>

          <div className="member-spotlight-grid">
            {spotlightMembers.map(({ member, slotId }) => {
              const progression = getNamiProgression(member);

              return (
                <button
                  className="member-spotlight-card"
                  key={slotId}
                  onClick={() => props.onOpenMember(member)}
                  type="button"
                >
                  <div className="member-spotlight-left">
                    <div className={'member-spotlight-avatar ' + signalClass(member.signal)}>
                      {memberInitials(member)}
                      <span className="member-spotlight-level">{progression.level}</span>
                    </div>

                    <div className="member-spotlight-copy">
                      <strong>{member.name}</strong>
                      <span>{member.tier} · Lv {progression.level}</span>
                    </div>
                  </div>

                  <span className="member-spotlight-verified">Verified</span>
                </button>
              );
            })}
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

  const randomizedBrowserEntries = useMemo(() => {
    return channels
      .concat(channels, channels)
      .map((channel, copyIndex) => ({
        channel,
        copyIndex,
        sortKey: Math.random()
      }))
      .sort((left, right) => left.sortKey - right.sortKey);
  }, []);

  const browserFilters = [
    'All',
    'Games',
    'IRL',
    'Music & DJs',
    'Creative',
    'Esports',
    'Verified',
    'PC',
    'Console',
    'Mobile'
  ] as const;

  type BrowserFilter = (typeof browserFilters)[number];

  const [selectedBrowserFilter, setSelectedBrowserFilter] = useState<BrowserFilter>('All');
  const [browserViewMode, setBrowserViewMode] = useState<'tiles' | 'swipe'>('tiles');
  const [swipeIndex, setSwipeIndex] = useState(0);

  const filteredBrowserEntries = randomizedBrowserEntries.filter(({ channel }) => {
    const genre = channel.genre.toLowerCase();
    const platforms = channel.platforms.map((platform) => platform.toLowerCase());

    if (selectedBrowserFilter === 'All') return true;
    if (selectedBrowserFilter === 'Games') {
      return (
        genre.includes('gaming') ||
        genre.includes('adventure') ||
        genre.includes('casual') ||
        genre.includes('arcade') ||
        genre.includes('pvp')
      );
    }
    if (selectedBrowserFilter === 'IRL') return genre.includes('irl');
    if (selectedBrowserFilter === 'Music & DJs') return genre.includes('music') || genre.includes('dj');
    if (selectedBrowserFilter === 'Creative') return genre.includes('creative') || genre.includes('builder');
    if (selectedBrowserFilter === 'Esports') return genre.includes('esports');
    if (selectedBrowserFilter === 'Verified') return channel.verifiedGame;
    if (selectedBrowserFilter === 'PC') return platforms.includes('pc');
    if (selectedBrowserFilter === 'Console') return platforms.includes('console');
    if (selectedBrowserFilter === 'Mobile') return platforms.includes('mobile');

    return true;
  });

  const filteredBrowserChannels = filteredBrowserEntries.map(({ channel }) => channel);
  const activeSwipeChannel =
    filteredBrowserChannels[swipeIndex % Math.max(1, filteredBrowserChannels.length)] ?? props.selectedChannel;
  const nextSwipeChannel =
    filteredBrowserChannels.length > 1
      ? filteredBrowserChannels[(swipeIndex + 1) % filteredBrowserChannels.length]!
      : activeSwipeChannel;
  const thirdSwipeChannel =
    filteredBrowserChannels.length > 2
      ? filteredBrowserChannels[(swipeIndex + 2) % filteredBrowserChannels.length]!
      : nextSwipeChannel;
  const activeSwipeDeveloper = channelDeveloper(activeSwipeChannel);

  useEffect(() => {
    setSwipeIndex(0);
  }, [selectedBrowserFilter, browserViewMode]);

  function moveSwipeDeck(direction: 'previous' | 'next'): void {
    if (filteredBrowserChannels.length === 0) return;

    setSwipeIndex((value) => {
      const nextValue = direction === 'previous' ? value - 1 : value + 1;
      return (nextValue + filteredBrowserChannels.length) % filteredBrowserChannels.length;
    });
  }

  function updateFoilCardTilt(element: HTMLElement, clientX: number, clientY: number): void {
    const rect = element.getBoundingClientRect();
    const pointerX = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const pointerY = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);

    element.style.setProperty('--game-card-tilt-x', ((pointerX - 0.5) * 12).toFixed(2) + 'deg');
    element.style.setProperty('--game-card-tilt-y', ((0.5 - pointerY) * 10).toFixed(2) + 'deg');
    element.style.setProperty('--game-card-foil-x', (pointerX * 100).toFixed(2) + '%');
    element.style.setProperty('--game-card-foil-y', (pointerY * 100).toFixed(2) + '%');
  }

  function resetFoilCardTilt(element: HTMLElement): void {
    element.style.setProperty('--game-card-tilt-x', '0deg');
    element.style.setProperty('--game-card-tilt-y', '0deg');
    element.style.setProperty('--game-card-foil-x', '50%');
    element.style.setProperty('--game-card-foil-y', '18%');
  }

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
            className="gamehub-themed-action"
            onClick={() => props.onOpenProfile(props.selectedChannel)}
            type="button"
          >
            View selected channel
          </button>
        </article>
      </section>

      <section className="panel gamehub-browser">
        <div className="browser-heading gamehub-browser-heading">
          <div>
            <h2>Channel Browser</h2>
            <p>Randomized game cover cards with dev marks, badges, and verified foil grading.</p>
          </div>

          <div className="gamehub-browser-controls">
            <div className="gamehub-view-toggle" aria-label="Channel browser view mode">
              <button
                className={browserViewMode === 'tiles' ? 'is-active-view' : ''}
                onClick={() => setBrowserViewMode('tiles')}
                type="button"
              >
                Tile Grid
              </button>
              <button
                className={browserViewMode === 'swipe' ? 'is-active-view' : ''}
                onClick={() => setBrowserViewMode('swipe')}
                type="button"
              >
                Swipe Deck
              </button>
            </div>
          </div>
        </div>

        <div className="filter-row gamehub-filter-row" role="tablist" aria-label="Game Hub browser filters">
          {browserFilters.map((filter) => (
            <button
              aria-pressed={selectedBrowserFilter === filter}
              className={selectedBrowserFilter === filter ? 'is-active-filter' : ''}
              key={filter}
              onClick={() => setSelectedBrowserFilter(filter)}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>

        {browserViewMode === 'tiles' ? (
          <div className="discovery-grid gamehub-discovery-grid">
            {filteredBrowserEntries.map(({ channel, copyIndex }) => {
              const channelTheme = getStoredChannelBrandTheme(channel.id);
              const developerProfile = channelDeveloper(channel);

              return (
                <button
                  className={
                    'discovery-card discovery-card-expanded gamehub-discovery-card gamehub-cover-card ' +
                    gameVerificationClass(channel) +
                    (channel.verifiedGame ? ' is-verified-foil-card' : ' is-static-card')
                  }
                  key={channel.id + '-' + copyIndex}
                  onClick={() => props.onOpenProfile(channel)}
                  onPointerLeave={(event) => {
                    if (channel.verifiedGame) resetFoilCardTilt(event.currentTarget);
                  }}
                  onPointerMove={(event) => {
                    if (channel.verifiedGame) {
                      updateFoilCardTilt(event.currentTarget, event.clientX, event.clientY);
                    }
                  }}
                  style={
                    {
                      '--game-card-brand': channelTheme.primary,
                      '--game-card-brand-soft': channelTheme.secondary
                    } as CSSProperties
                  }
                  type="button"
                >
                  <div className="gamehub-cover-art" aria-hidden="true">
                    <span className="gamehub-cover-monogram">{channel.name.slice(0, 2).toUpperCase()}</span>
                    <span className="gamehub-cover-surface-chip">GAME</span>
                    <span
                      className={'gamehub-cover-verification-chip ' + gameVerificationClass(channel)}
                      title={gameVerificationBadgeLabel(channel)}
                    >
                      {gameVerificationShortLabel(channel)}
                    </span>
                  </div>

                  <div className="gamehub-cover-overlay">
                    <div className="gamehub-cover-topline">
                      <span className="gamehub-dev-logo" title={developerProfile.name + ' developer mark'}>
                        {developerProfile.logoSeed}
                      </span>

                      <span className="gamehub-cover-icons">
                        {channel.verifiedGame && <i className="gamehub-grade-icon" title="Verified">◆</i>}
                        {channel.partner && <i className="gamehub-partner-icon" title="Partner">✦</i>}
                        <i className={'gamehub-signal-dot signal-text-' + channel.signal.toLowerCase()} title={channel.signal} />
                      </span>
                    </div>

                    <strong>{channel.name}</strong>
                    <small>{channel.platforms.slice(0, 2).join(' / ')} · {channel.genre.split('/')[0]}</small>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <section className="gamehub-swipe-stage" aria-label="Swipe deck channel browser">
            <div className="gamehub-swipe-copy">
              <span className="feature-label">Swipe Discovery</span>
              <h3>Browse game covers like a deck</h3>
              <p>
                Game channels use full-card cover art. Verified game channels receive the graded foil sleeve.
              </p>
              <strong>
                {filteredBrowserChannels.length === 0
                  ? '0 / 0'
                  : (swipeIndex + 1).toLocaleString() + ' / ' + filteredBrowserChannels.length.toLocaleString()}
              </strong>
            </div>

            <div className="gamehub-swipe-deck">
              <div className="gamehub-swipe-shadow-card is-third">
                <strong>{thirdSwipeChannel.name}</strong>
              </div>
              <div className="gamehub-swipe-shadow-card is-second">
                <strong>{nextSwipeChannel.name}</strong>
              </div>

              <article
                className={
                  'gamehub-swipe-card gamehub-swipe-cover-card ' +
                  gameVerificationClass(activeSwipeChannel) +
                  (activeSwipeChannel.verifiedGame ? ' is-verified-foil' : '')
                }
                onPointerLeave={(event) => {
                  if (activeSwipeChannel.verifiedGame) resetFoilCardTilt(event.currentTarget);
                }}
                onPointerMove={(event) => {
                  if (activeSwipeChannel.verifiedGame) {
                    updateFoilCardTilt(event.currentTarget, event.clientX, event.clientY);
                  }
                }}
                style={
                  {
                    '--game-card-brand': getStoredChannelBrandTheme(activeSwipeChannel.id).primary,
                    '--game-card-brand-soft': getStoredChannelBrandTheme(activeSwipeChannel.id).secondary
                  } as CSSProperties
                }
              >
                <div className="gamehub-swipe-cover-art" aria-hidden="true">
                  <span>{activeSwipeChannel.name.slice(0, 2).toUpperCase()}</span>
                </div>

                <div className="gamehub-swipe-cover-overlay">
                  <div className="gamehub-swipe-card-top">
                    <span
                      className={'gamehub-dev-logo ' + developerVerificationClass(activeSwipeDeveloper)}
                      title={activeSwipeDeveloper.name + ' · ' + activeSwipeDeveloper.proofStatus}
                    >
                      {activeSwipeDeveloper.logoSeed}
                    </span>

                    <span className="gamehub-cover-icons">
                      <i
                        className={'gamehub-proof-icon ' + gameVerificationClass(activeSwipeChannel)}
                        title={gameVerificationBadgeLabel(activeSwipeChannel)}
                      >
                        {gameVerificationShortLabel(activeSwipeChannel)}
                      </i>
                      <i
                        className={'gamehub-studio-proof-icon ' + developerVerificationClass(activeSwipeDeveloper)}
                        title={activeSwipeDeveloper.proofStatus}
                      >
                        {developerShortProofLabel(activeSwipeDeveloper)}
                      </i>
                      <i className={'gamehub-signal-dot signal-text-' + activeSwipeChannel.signal.toLowerCase()} title={activeSwipeChannel.signal} />
                    </span>
                  </div>

                  <div className="gamehub-swipe-card-copy">
                    <div className="gamehub-swipe-taxonomy-row">
                      <span>GAME</span>
                      <i className={gameVerificationClass(activeSwipeChannel)}>
                        {gameVerificationShortLabel(activeSwipeChannel)}
                      </i>
                      <em>{developerShortProofLabel(activeSwipeDeveloper)}</em>
                    </div>

                    <h3>{activeSwipeChannel.name}</h3>
                    <p>{activeSwipeChannel.genre} · {activeSwipeChannel.platforms.join(' / ')}</p>
                  </div>

                  <div className="gamehub-swipe-meta">
                    <span>{activeSwipeChannel.subscribers.toLocaleString()}</span>
                    <span>{activeSwipeChannel.handle}</span>
                    <span>{gameVerificationBadgeLabel(activeSwipeChannel)}</span>
                  </div>
                </div>
              </article>
            </div>

            <div className="gamehub-swipe-actions">
              <button onClick={() => moveSwipeDeck('previous')} type="button">
                Swipe Left
              </button>
              <button
                className="is-open-swipe-card"
                onClick={() => props.onOpenProfile(activeSwipeChannel)}
                type="button"
              >
                View Profile
              </button>
              <button onClick={() => moveSwipeDeck('next')} type="button">
                Swipe Right
              </button>
            </div>
          </section>
        )}

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

          <button className="add-module-button gamehub-add-module-button" type="button">
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

function StudioProfileScreen(props: {
  developer: (typeof developers)[number];
  onNavigate: (page: NamiPage) => void;
  onOpenProfile: (channel: NamiChannel) => void;
  returnPage: NamiPage;
  returnLabel: string;
}): ReactElement {
  const studioGames = developerGameChannels(props.developer);
  const leadGame = studioGames[0] ?? channels[0]!;
  const studioTheme = useMemo(() => getStoredChannelBrandTheme(leadGame.id), [leadGame.id]);
  const proofClass = developerVerificationClass(props.developer);
  const totalReach = studioGames.reduce((sum, channel) => sum + channel.subscribers, 0);

  const studioProofs = [
    {
      label: 'Studio Surface',
      value: 'Developer profile',
      detail: 'Separate from game and member profiles.'
    },
    {
      label: 'Proof Status',
      value: props.developer.proofStatus,
      detail: props.developer.approved
        ? 'Studio identity has approval signals.'
        : 'Community maintainer surface without verified studio status.'
    },
    {
      label: 'Trust Rule',
      value: 'Proofs, not payment',
      detail: 'Paid placement never creates verification or trust.'
    }
  ];

  useEffect(() => {
    applyChannelBrandToDocument(studioTheme);

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [studioTheme]);

  return (
    <>
      <header className="page-title">
        <p>Developer identity and approved game directory</p>
        <h1>{props.developer.name}</h1>
      </header>

      <section className="studio-profile-page">
        <article className={'panel studio-hero-card ' + proofClass}>
          <div className="studio-hero-topbar">
            <button
              className="profile-return-button studio-return-button"
              onClick={() => props.onNavigate(props.returnPage)}
              type="button"
            >
              ← {props.returnLabel}
            </button>

            <span className={'studio-proof-pill ' + proofClass}>
              {developerShortProofLabel(props.developer)} · {props.developer.proofStatus}
            </span>
          </div>

          <div className="studio-hero-main">
            <div className={'studio-logo-mark ' + proofClass}>
              {props.developer.logoSeed}
            </div>

            <div className="studio-hero-copy">
              <div className="surface-separation-row studio-surface-row">
                <span>Studio Profile</span>
                <span>{props.developer.handle}</span>
                <i>{props.developer.approved ? 'Approved developer surface' : 'Community maintainer surface'}</i>
              </div>

              <h2>{props.developer.name}</h2>
              <p>
                Studio profiles hold developer identity, proof status, and the approved game directory.
                Game profiles keep game-specific community content, and member profiles keep levels and passport progression.
              </p>

              <div className="studio-stat-row">
                <span>
                  <strong>{studioGames.length}</strong>
                  Games
                </span>
                <span>
                  <strong>{totalReach.toLocaleString()}</strong>
                  Reach
                </span>
                <span>
                  <strong>{props.developer.studioSignal}</strong>
                  Signal
                </span>
              </div>
            </div>
          </div>
        </article>

        <section className="studio-profile-grid">
          <article className="panel studio-directory-panel">
            <div className="profile-panel-heading">
              <h2>Approved Game Directory</h2>
              <p>Games linked to this developer/studio surface.</p>
            </div>

            <div className="studio-game-directory">
              {studioGames.map((channel) => (
                <button
                  className={'studio-game-card ' + gameVerificationClass(channel)}
                  key={channel.id}
                  onClick={() => props.onOpenProfile(channel)}
                  type="button"
                >
                  <span className="studio-game-cover">{channel.name.slice(0, 2).toUpperCase()}</span>

                  <div>
                    <strong>{channel.name}</strong>
                    <small>{channel.genre} · {channel.platforms.join(' / ')}</small>
                  </div>

                  <i>{gameVerificationShortLabel(channel)}</i>
                </button>
              ))}
            </div>
          </article>

          <article className="panel studio-proof-panel">
            <div className="profile-panel-heading">
              <h2>Developer Trust Proofs</h2>
              <p>Studio verification remains separate from paid visibility.</p>
            </div>

            <div className="studio-proof-grid">
              {studioProofs.map((proof) => (
                <div className="studio-proof-card" key={proof.label}>
                  <span>{proof.label}</span>
                  <strong>{proof.value}</strong>
                  <p>{proof.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel studio-boundary-panel">
            <div className="profile-panel-heading">
              <h2>Surface Boundaries</h2>
              <p>Each profile type owns different identity signals.</p>
            </div>

            <div className="studio-boundary-stack">
              <div>
                <span>Game</span>
                <strong>Cover art, game verification, channel modules</strong>
              </div>
              <div>
                <span>Studio</span>
                <strong>Developer proof, logo, approved games</strong>
              </div>
              <div>
                <span>Member</span>
                <strong>Avatar, level, passport, squads, guilds</strong>
              </div>
            </div>
          </article>
        </section>
      </section>
    </>
  );
}


function ChannelProfile(props: {
  channel: NamiChannel;
  onNavigate: (page: NamiPage) => void;
  onOpenProfile?: (channel: NamiChannel) => void;
  onOpenStudioProfile?: (developer: (typeof developers)[number]) => void;
  returnPage: NamiPage;
  returnLabel: string;
}): ReactElement {
  const developerProfile = channelDeveloper(props.channel);

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
    'Nami Badges',
    'Channel Badges',
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

  const [channelBrandPalette, setChannelBrandPalette] = useState<string[]>(() => {
    return readChannelBrandPalette();
  });
  const [selectedChannelBrandColor, setSelectedChannelBrandColor] = useState(() => {
    const savedColor = readSelectedChannelBrandColor();
    const palette = readChannelBrandPalette();

    return palette.includes(savedColor) ? savedColor : palette[0] ?? '#4da3ff';
  });

  function updateChannelBrandColor(index: number, color: string): void {
    const nextPalette = channelBrandPalette.map((currentColor, currentIndex) => {
      return currentIndex === index ? color : currentColor;
    }).slice(0, 4);

    setChannelBrandPalette(nextPalette);
    saveChannelBrandPalette(nextPalette);

    if (!nextPalette.includes(selectedChannelBrandColor)) {
      const nextSelectedColor = nextPalette[0] ?? color;

      setSelectedChannelBrandColor(nextSelectedColor);
      saveSelectedChannelBrandColor(nextSelectedColor);
    }
  }

  function chooseChannelBrandColor(color: string): void {
    setSelectedChannelBrandColor(color);
    saveSelectedChannelBrandColor(color);
  }

  return (
    <>
      <header className="page-title">
        <p>Contextual channel profile</p>
        <h1>Game Profile</h1>
      </header>

      <section className="channel-profile-page" style={profileBrandStyle}>
                  
            <article data-channel-hero="true" className="profile-hero-panel">
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

                <div className="surface-separation-row game-surface-row">
                  <span>Game Channel</span>
                  <span>{developerProfile.name}</span>
                  <i className={gameVerificationClass(props.channel)}>{gameVerificationLabel(props.channel)}</i>
                  <button
                    className="surface-studio-link"
                    onClick={(event) => {
                      event.stopPropagation();
                      props.onOpenStudioProfile?.(developerProfile);
                    }}
                    type="button"
                  >
                    Open Studio
                  </button>
                </div>

              <div className="profile-meta-row">
                <span>{props.channel.handle}</span>
                <span>{props.channel.genre}</span>
                <span>{props.channel.platforms.join(' / ')}</span>
              </div>
            </div>
          </div>

          <div className="profile-hero-actions">
              <button
                className="secondary-action profile-return-button"
                onClick={() => props.onNavigate(props.returnPage)}
                type="button"
              >
                {props.returnLabel}
              </button>
            <button className="primary-action" type="button">
              Subscribe
            </button>

            <button
              className="secondary-action"
              onClick={() => props.onNavigate('chat')}
              type="button"
            >
              Join Chat
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
            <span>Platforms</span>
            <strong>{props.channel.platforms.length}</strong>
          </article>
        

            <article className="profile-stat-card channel-colors-stat-card">
              <span>Channel Colors</span>
              <div className="channel-member-brand-strip channel-member-brand-strip-compact">
                {channelBrandPalette.slice(0, 4).map((color: string) => (
                  <button
                    aria-label={'Use channel brand color ' + color}
                    className={
                      'channel-member-brand-dot' +
                      (selectedChannelBrandColor === color ? ' is-selected-channel-brand-color' : '')
                    }
                    key={color}
                    onClick={() => chooseChannelBrandColor(color)}
                    type="button"
                  >
                    <span style={{ backgroundColor: color }} />
                  </button>
                ))}
              </div>
            </article></section>

                  

          <section className="profile-section-grid">
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
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [customizationCollapsed, setCustomizationCollapsed] = useState(true);
  const [gatedAccessCollapsed, setGatedAccessCollapsed] = useState(true);
  const [adultLanguageCollapsed, setAdultLanguageCollapsed] = useState(true);
  const [reportPulse, setReportPulse] = useState('');
  const [adultLanguageMode, setAdultLanguageMode] = useState<'censor' | 'filter' | 'show'>('censor');

  const channelBrandTheme = useMemo(() => {
    return getStoredChannelBrandTheme(props.channel.id);
  }, [props.channel.id]);

  useEffect(() => {
    applyChannelBrandToDocument(channelBrandTheme);
  }, [channelBrandTheme, props.channel.id]);

  // UI-A13B force collapse on channel entry
  useEffect(() => {
    setFiltersCollapsed(true);
    setCustomizationCollapsed(true);
    setGatedAccessCollapsed(true);
    setAdultLanguageCollapsed(true);
  }, [props.channel.id]);

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
          className="chat-layout chat-layout-buildout"
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

                    <aside className="chat-side-panel chat-side-panel-collapsible">
            <section
              className={
                'gated-access-panel chat-rail-collapsible-panel' +
                (gatedAccessCollapsed ? ' is-chat-rail-collapsed' : '')
              }
            >
              <button
                className="chat-rail-collapse-button"
                onClick={() => setGatedAccessCollapsed((value) => !value)}
                type="button"
              >
                <span>Gated Access</span>
                <strong>{gatedAccessCollapsed ? '+' : '−'}</strong>
              </button>

              {!gatedAccessCollapsed && (
                <div className="chat-rail-panel-body">
                  <div className="profile-panel-heading">
                    <h2>Passport Gates</h2>
                    <p>Proof-based access for verified rooms, holder chats, and guild areas.</p>
                  </div>

                  <div className="gated-access-mini-list">
                    <span>Wallet linked</span>
                    <span>SuiNS verified</span>
                    <span>Guild standing clear</span>
                  </div>

                  <button
                    className="profile-secondary-link chat-rail-action-button"
                    onClick={() => props.onNavigate('passport')}
                    type="button"
                  >
                    Passport
                  </button>
                </div>
              )}
            </section>

            <section
              className={
                'chat-filter-panel chat-rail-collapsible-panel' +
                (filtersCollapsed ? ' is-chat-rail-collapsed' : '')
              }
            >
              <button
                className="chat-rail-collapse-button"
                onClick={() => setFiltersCollapsed((value) => !value)}
                type="button"
              >
                <span>Filters</span>
                <strong>{filtersCollapsed ? '+' : '−'}</strong>
              </button>

              {!filtersCollapsed && (
                <div className="chat-rail-panel-body filter-options-stack">
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

            <section
              className={
                'adult-language-settings-panel chat-rail-collapsible-panel' +
                (adultLanguageCollapsed ? ' is-chat-rail-collapsed' : '')
              }
            >
              <button
                className="chat-rail-collapse-button"
                onClick={() => setAdultLanguageCollapsed((value) => !value)}
                type="button"
              >
                <span>Language</span>
                <strong>{adultLanguageCollapsed ? '+' : '−'}</strong>
              </button>

              {!adultLanguageCollapsed && (
                <div className="chat-rail-panel-body">
                  <div className="profile-panel-heading">
                    <h2>Adult Language</h2>
                    <p>Channel owner moderation setting. Default behavior is censoring.</p>
                  </div>

                  <div className="adult-language-control">
                    <strong>Mode</strong>

                    <div className="adult-language-mode-row">
                      {(['censor', 'filter', 'show'] as const).map((mode) => (
                        <button
                          className={adultLanguageMode === mode ? 'is-active-adult-mode' : ''}
                          key={mode}
                          onClick={() => setAdultLanguageMode(mode)}
                          type="button"
                        >
                          {mode === 'censor' ? 'Censor' : mode === 'filter' ? 'Filter' : 'Show'}
                        </button>
                      ))}
                    </div>

                    <small>
                      Censor masks matching words. Filter removes matching messages.
                    </small>
                  </div>
                </div>
              )}
            </section>

            <section
              className={
                'chat-customization-panel chat-rail-collapsible-panel' +
                (customizationCollapsed ? ' is-chat-rail-collapsed is-collapsed-customization' : '')
              }
            >
              <button
                className="chat-rail-collapse-button"
                onClick={() => setCustomizationCollapsed((value) => !value)}
                type="button"
              >
                <span>Chat Style</span>
                <strong>{customizationCollapsed ? '+' : '−'}</strong>
              </button>

              {!customizationCollapsed && (
                <div className="chat-rail-panel-body chat-customization-body chat-style-body">
                  <div className="profile-panel-heading">
                    <h2>Chat Box Style</h2>
                    <p>Use channel-approved accents and future earned cosmetic rewards.</p>
                  </div>

                  <div className="chat-style-brand-card">
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
                      <small>Channel-approved accent</small>
                    </div>
                  </div>

                  <div className="chat-style-reward-grid">
                    <span>Default Bubble</span>
                    <span>Wave Frame</span>
                    <span>Signal Glow</span>
                  </div>

                  <div className="customization-note">
                    Cosmetic rewards will unlock fonts, overlays, message skins, and animation
                    intensity. Owner brand colors stay in Settings.
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
  returnPage: NamiPage;
  returnLabel: string;
}): ReactElement {
  const preferenceStorageKey = 'nami-member-preferences-' + props.member.id;
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [reportQueued, setReportQueued] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const reviewedSignal = readMemberSignalReview(props.member.id, props.member.signal);
  const memberProgression = getNamiProgression(props.member);
  const memberVerificationStatus =
    reviewedSignal === 'Green' ? 'Verified' : reviewedSignal + ' Review';
  const memberFoilEligible = isMemberFoilEligible(props.member, reviewedSignal);
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
  function updateMemberHeroFoil(event: { currentTarget: HTMLElement; clientX: number; clientY: number }): void {
    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const pointerY = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);

    event.currentTarget.style.setProperty('--member-hero-foil-x', (pointerX * 100).toFixed(2) + '%');
    event.currentTarget.style.setProperty('--member-hero-foil-y', (pointerY * 100).toFixed(2) + '%');
    event.currentTarget.style.setProperty('--member-hero-light-x', ((pointerX - 0.5) * 18).toFixed(2) + 'px');
    event.currentTarget.style.setProperty('--member-hero-light-y', ((pointerY - 0.5) * 18).toFixed(2) + 'px');
  }

  function resetMemberHeroFoil(event: { currentTarget: HTMLElement }): void {
    event.currentTarget.style.setProperty('--member-hero-foil-x', '50%');
    event.currentTarget.style.setProperty('--member-hero-foil-y', '18%');
    event.currentTarget.style.setProperty('--member-hero-light-x', '0px');
    event.currentTarget.style.setProperty('--member-hero-light-y', '0px');
  }

  return (
    <>
      <header className="page-title">
        <p>Member profile, history, and preference controls</p>
        <h1>{props.member.name}</h1>
      </header>

      <section className="member-profile-page">
        <article
            className={
              'member-profile-hero panel ' +
              (memberFoilEligible ? 'is-member-foil-eligible' : 'is-member-foil-disabled')
            }
            data-member-hero="true"
            onPointerLeave={(event) => {
              if (memberFoilEligible) resetMemberHeroFoil(event);
            }}
            onPointerMove={(event) => {
              if (memberFoilEligible) updateMemberHeroFoil(event);
            }}
          >
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

              <div className="surface-separation-row member-surface-row">
                <span>Member Profile</span>
                <span>{props.member.tier}</span>
                <i>Level-enabled passport surface</i>
              </div>
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
                className="secondary-action member-return-button"
                onClick={() => props.onNavigate(props.returnPage)}
                type="button"
              >
                {props.returnLabel}
              </button>
          </div>
        </article>

        <section className="member-profile-grid">
            <article className="panel member-affiliation-panel">
              <div className="profile-panel-heading">
                <h2>Guilds & Squads</h2>
                <p>Current guild standing, squad identity, and seasonal level.</p>
              </div>

              <div className="nami-affiliation-grid">
                <div>
                  <span>Guilds</span>
                  {memberProgression.guilds.map((guild) => (
                    <strong key={guild}>{guild}</strong>
                  ))}
                </div>

                <div>
                  <span>Squads</span>
                  {memberProgression.squads.map((squad) => (
                    <strong key={squad}>{squad}</strong>
                  ))}
                </div>

                <div>
                  <span>Season XP</span>
                  <strong>{memberProgression.seasonXp.toLocaleString()}</strong>
                  <small>Lv {memberProgression.level} Nami Reputation</small>
                </div>
              </div>
            </article>
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

function readWalletPublicDisplay(): boolean {
  try {
    return window.localStorage.getItem('nami-wallet-public-display') === 'true';
  } catch {
    return false;
  }
}

function saveWalletPublicDisplay(isPublic: boolean): void {
  window.localStorage.setItem('nami-wallet-public-display', isPublic ? 'true' : 'false');
}

function readSuiNsPublicDisplay(): boolean {
  try {
    return window.localStorage.getItem('nami-suins-public-display') === 'true';
  } catch {
    return false;
  }
}

function saveSuiNsPublicDisplay(isPublic: boolean): void {
  window.localStorage.setItem('nami-suins-public-display', isPublic ? 'true' : 'false');
}

function PassportScreen(props: {
  onNavigate: (page: NamiPage) => void;
  onOpenProfile: (channel: NamiChannel) => void;
}): ReactElement {
  const profileMember = members[0]!;
  const passportProgression = getNamiProgression(profileMember);
  const [suiNsPublic, setSuiNsPublic] = useState(() => readSuiNsPublicDisplay());

  const passportProofs = [
    {
      title: 'Wallet Linked',
      status: 'Verified',
      detail: 'Wallet remains an owner-only identity anchor by default.',
      category: 'Identity'
    },
    {
      title: 'SuiNS / Subname',
      status: 'Verified',
      detail: 'npcgamer.sui is connected, but hidden publicly until enabled.',
      category: 'Name Proof'
    },
    {
      title: 'Developer Approval',
      status: 'Not Requested',
      detail: 'Developer trust is approval-based and never purchased by subscription.',
      category: 'Developer Trust'
    },
    {
      title: 'Game Ownership',
      status: 'Pending',
      detail: 'Future Sui object, NFT, or license proof for gated rooms.',
      category: 'Access'
    },
    {
      title: 'Guild Standing',
      status: 'Verified',
      detail: 'Guild participation and channel conduct are in good standing.',
      category: 'Social'
    },
    {
      title: 'Moderation Standing',
      status: 'Clear',
      detail: 'No unresolved enforcement actions on this mock passport.',
      category: 'Safety'
    }
  ];

  return (
    <>
      <header className="page-title">
        <p>Wallet identity, proofs, and gated access</p>
        <h1>Nami Passport</h1>
      </header>

      <section className="passport-page">
        <article className="panel passport-hero-card passport-hero-card-refined">
          <div className="passport-owner-block">
            <div className={'member-profile-avatar ' + signalClass(profileMember.signal)}>
                {memberInitials(profileMember)}
                <span className="profile-level-badge">Lv {passportProgression.level}</span>
              </div>

            <div className="passport-owner-copy">
              <span className="mini-badge">Sui Identity Layer</span>
              <h2>{profileMember.name} Passport</h2>
              <p>
                Nami Passport connects SuiNS identity, wallet ownership, developer approvals,
                guild standing, conduct reputation, and access-gated community surfaces.
              </p>

              <div className="passport-wallet-grid passport-wallet-grid-refined">
                <span>Owner Wallet</span>
                <strong>Private identity anchor</strong>
                <span>SuiNS</span>
                <strong>{suiNsPublic ? 'npcgamer.sui visible publicly' : 'Hidden publicly'}</strong>
                <span>Signal</span>
                <strong>{profileMember.signal}</strong>
                <span>Trust Source</span>
                <strong>Proofs + conduct, not payment</strong>
              </div>
            </div>
          </div>

          <aside className="passport-privacy-card">
            <span className="mini-badge">Privacy</span>
            <h3>SuiNS Visibility</h3>
            <p>
              SuiNS is a readable wallet identity. It stays hidden publicly unless you
              choose to display it.
            </p>

            <button
              className={suiNsPublic ? 'is-wallet-public' : ''}
              onClick={() => {
                const nextValue = !suiNsPublic;
                setSuiNsPublic(nextValue);
                saveSuiNsPublicDisplay(nextValue);
              }}
              type="button"
            >
              {suiNsPublic ? 'Hide SuiNS Publicly' : 'Display SuiNS Publicly'}
            </button>

            <button onClick={() => props.onNavigate('userProfile')} type="button">
              Back to My Profile
            </button>
          </aside>
        </article>

        <section className="passport-grid">
            <article className="panel passport-affiliation-panel">
              <div className="profile-panel-heading">
                <h2>Guilds & Squads</h2>
                <p>Passport social standing across guilds, squads, and seasonal reputation.</p>
              </div>

              <div className="nami-affiliation-grid">
                <div>
                  <span>Guilds</span>
                  {passportProgression.guilds.map((guild) => (
                    <strong key={guild}>{guild}</strong>
                  ))}
                </div>

                <div>
                  <span>Squads</span>
                  {passportProgression.squads.map((squad) => (
                    <strong key={squad}>{squad}</strong>
                  ))}
                </div>

                <div>
                  <span>Season XP</span>
                  <strong>{passportProgression.seasonXp.toLocaleString()}</strong>
                  <small>Level {passportProgression.level} reputation marker</small>
                </div>
              </div>
            </article>
          <article className="panel passport-proof-panel">
            <div className="profile-panel-heading">
              <h2>Verification Proofs</h2>
              <p>Trust and verification are based on proofs, reputation, and approval.</p>
            </div>

            <div className="passport-proof-grid">
              {passportProofs.map((proof) => (
                <div className="passport-proof-card" key={proof.title}>
                  <span className="mini-badge">{proof.category}</span>
                  <strong>{proof.title}</strong>
                  <i>{proof.status}</i>
                  <p>{proof.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel passport-access-panel">
            <div className="profile-panel-heading">
              <h2>Access-Gated Surfaces</h2>
              <p>Future channel rooms unlocked by wallet and proof checks.</p>
            </div>

            <div className="passport-access-stack">
              {channels.slice(0, 3).map((channel, index) => (
                <div className="passport-access-card" key={channel.id}>
                  <div className="passport-access-title-row">
                    <ChannelAvatar channel={channel} size="sm" />
                    <div>
                      <strong>
                        {index === 0
                          ? 'Verified Holder Chat'
                          : index === 1
                            ? 'Developer Alpha Room'
                            : 'Guild Strategy Room'}
                      </strong>
                      <span>{channel.name}</span>
                    </div>
                  </div>

                  <p>
                    {index === 0
                      ? 'Requires wallet plus SuiNS proof.'
                      : index === 1
                        ? 'Requires developer approval badge.'
                        : 'Requires guild standing plus channel subscription.'}
                  </p>

                  <button
                    className={index === 0 ? 'is-unlocked-gate' : ''}
                    onClick={() => props.onOpenProfile(channel)}
                    type="button"
                  >
                    {index === 0 ? 'Unlocked' : index === 1 ? 'Locked' : 'Pending'}
                  </button>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </>
  );
}






type ProfileCardLayout = 'vertical' | 'horizontal';

function readProfileCardLayout(): ProfileCardLayout {
  try {
    const savedLayout = window.localStorage.getItem('nami-profile-card-layout');

    return savedLayout === 'horizontal' ? 'horizontal' : 'vertical';
  } catch {
    return 'vertical';
  }
}

function saveProfileCardLayout(layout: ProfileCardLayout): void {
  window.localStorage.setItem('nami-profile-card-layout', layout);
}

function readChannelBrandPalette(): string[] {
  try {
    const savedPalette = window.localStorage.getItem('nami-channel-brand-palette');

    if (!savedPalette) {
      return ['#4da3ff', '#e11d48', '#34d399', '#f97316'];
    }

    const parsedPalette = JSON.parse(savedPalette);

    if (!Array.isArray(parsedPalette)) {
      return ['#4da3ff', '#e11d48', '#34d399', '#f97316'];
    }

    return parsedPalette
      .filter((color): color is string => typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color))
      .slice(0, 4);
  } catch {
    return ['#4da3ff', '#e11d48', '#34d399', '#f97316'];
  }
}

function saveChannelBrandPalette(palette: string[]): void {
  window.localStorage.setItem('nami-channel-brand-palette', JSON.stringify(palette.slice(0, 4)));
}

function readSelectedChannelBrandColor(): string {
  try {
    return window.localStorage.getItem('nami-selected-channel-brand-color') ?? '#4da3ff';
  } catch {
    return '#4da3ff';
  }
}

function saveSelectedChannelBrandColor(color: string): void {
  window.localStorage.setItem('nami-selected-channel-brand-color', color);
}

function UserProfileScreen(props: {
  onOpenProfile?: (channel: NamiChannel) => void;
  onNavigate?: (page: NamiPage) => void;
} = {}): ReactElement {
  const profileMember = members[0]!;
  const profileProgression = getNamiProgression(profileMember);
  const profileVerificationStatus =
    profileMember.signal === 'Green' ? 'Verified' : profileMember.signal + ' Review';
  const suiNsPublic = readSuiNsPublicDisplay();
  const profileCardFrameRef = useRef<HTMLDivElement | null>(null);
  const foilFrameRef = useRef<number | null>(null);
  const foilStateRef = useRef({
    current: {
      foilX: 50,
      foilY: 18,
      cardTiltX: 0,
      cardTiltY: 0,
      lightX: 0,
      lightY: 0,
      cardOpacity: 0.36,
      passportLightX: 0,
      passportLightY: 0,
      passportOpacity: 0.22
    },
    target: {
      foilX: 50,
      foilY: 18,
      cardTiltX: 0,
      cardTiltY: 0,
      lightX: 0,
      lightY: 0,
      cardOpacity: 0.36,
      passportLightX: 0,
      passportLightY: 0,
      passportOpacity: 0.22
    }
  });
  const [profileCardLayout, setProfileCardLayout] = useState<ProfileCardLayout>(() => {
    return readProfileCardLayout();
  });
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

  function writeFoilStyles(card: HTMLElement): void {
    const current = foilStateRef.current.current;

    card.style.setProperty('--card-foil-x', current.foilX.toFixed(2) + '%');
    card.style.setProperty('--card-foil-y', current.foilY.toFixed(2) + '%');
    card.style.setProperty('--card-body-tilt-x', current.cardTiltX.toFixed(3) + 'deg');
    card.style.setProperty('--card-body-tilt-y', current.cardTiltY.toFixed(3) + 'deg');
    card.style.setProperty('--card-light-x', current.lightX.toFixed(2) + 'px');
    card.style.setProperty('--card-light-y', current.lightY.toFixed(2) + 'px');
    card.style.setProperty('--card-foil-opacity', current.cardOpacity.toFixed(3));
    card.style.setProperty('--passport-light-x', current.passportLightX.toFixed(2) + 'px');
    card.style.setProperty('--passport-light-y', current.passportLightY.toFixed(2) + 'px');
    card.style.setProperty('--passport-foil-opacity', current.passportOpacity.toFixed(3));
  }

  function animateFoil(card: HTMLElement): void {
    const state = foilStateRef.current;
    const current = state.current;
    const target = state.target;
    const smoothing = 0.105;

    current.foilX += (target.foilX - current.foilX) * smoothing;
    current.foilY += (target.foilY - current.foilY) * smoothing;
    current.cardTiltX += (target.cardTiltX - current.cardTiltX) * smoothing;
    current.cardTiltY += (target.cardTiltY - current.cardTiltY) * smoothing;
    current.lightX += (target.lightX - current.lightX) * smoothing;
    current.lightY += (target.lightY - current.lightY) * smoothing;
    current.cardOpacity += (target.cardOpacity - current.cardOpacity) * smoothing;
    current.passportLightX += (target.passportLightX - current.passportLightX) * smoothing;
    current.passportLightY += (target.passportLightY - current.passportLightY) * smoothing;
    current.passportOpacity += (target.passportOpacity - current.passportOpacity) * smoothing;

    writeFoilStyles(card);

    const remaining = Math.max(
      Math.abs(target.foilX - current.foilX),
      Math.abs(target.foilY - current.foilY),
      Math.abs(target.cardTiltX - current.cardTiltX),
      Math.abs(target.cardTiltY - current.cardTiltY),
      Math.abs(target.lightX - current.lightX),
      Math.abs(target.lightY - current.lightY),
      Math.abs(target.cardOpacity - current.cardOpacity),
      Math.abs(target.passportLightX - current.passportLightX),
      Math.abs(target.passportLightY - current.passportLightY),
      Math.abs(target.passportOpacity - current.passportOpacity)
    );

    if (remaining > 0.01) {
      foilFrameRef.current = window.requestAnimationFrame(() => animateFoil(card));
      return;
    }

    Object.assign(current, target);
    writeFoilStyles(card);
    foilFrameRef.current = null;
  }

  function startFoilAnimation(card: HTMLElement): void {
    if (foilFrameRef.current !== null) {
      return;
    }

    foilFrameRef.current = window.requestAnimationFrame(() => animateFoil(card));
  }

  function updateCardFoil(event: { currentTarget: HTMLElement; clientX: number; clientY: number }): void {
    const card = profileCardFrameRef.current;

    if (!card) {
      return;
    }

    const shell = event.currentTarget;
    const rect = shell.getBoundingClientRect();

    const pointerX = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const pointerY = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);

    const fromCenterX = pointerX - 0.5;
    const fromCenterY = pointerY - 0.5;
    const deadZone = 0.08;

    const easedX =
      Math.sign(fromCenterX) *
      Math.max(0, Math.abs(fromCenterX) - deadZone) /
      (0.5 - deadZone);

    const easedY =
      Math.sign(fromCenterY) *
      Math.max(0, Math.abs(fromCenterY) - deadZone) /
      (0.5 - deadZone);

    const clampedX = Math.max(-1, Math.min(1, easedX));
    const clampedY = Math.max(-1, Math.min(1, easedY));

    const tiltStrength = 1.55;
    const lightStrength = 13;

    foilStateRef.current.target = {
      foilX: pointerX * 100,
      foilY: pointerY * 100,
      cardTiltX: -clampedY * tiltStrength,
      cardTiltY: clampedX * tiltStrength,
      lightX: clampedX * lightStrength,
      lightY: clampedY * lightStrength,
      cardOpacity: 0.58,
      passportLightX: clampedX * 9,
      passportLightY: clampedY * 9,
      passportOpacity: 0.34
    };

    startFoilAnimation(card);
  }

  function resetCardFoil(): void {
    const card = profileCardFrameRef.current;

    if (!card) {
      return;
    }

    foilStateRef.current.target = {
      foilX: 50,
      foilY: 18,
      cardTiltX: 0,
      cardTiltY: 0,
      lightX: 0,
      lightY: 0,
      cardOpacity: 0.36,
      passportLightX: 0,
      passportLightY: 0,
      passportOpacity: 0.22
    };

    startFoilAnimation(card);
  }

  function chooseProfileCardLayout(layout: ProfileCardLayout): void {
    setProfileCardLayout(layout);
    saveProfileCardLayout(layout);
  }

  return (
    <>
      <header className="page-title">
        <p>Member identity and passport</p>
        <h1>My Profile</h1>
      </header>

      <section className="user-profile-page">
        <div className={'nami-profile-stable-controls nami-profile-stable-controls-' + profileCardLayout}>
          <div className="nami-profile-toolbar-actions">
            <div className="nami-profile-layout-switch nami-profile-stable-layout-switch">
              {(['vertical', 'horizontal'] as ProfileCardLayout[]).map((layout) => (
                <button
                  className={profileCardLayout === layout ? 'is-selected-profile-layout' : ''}
                  key={layout}
                  onClick={() => chooseProfileCardLayout(layout)}
                  type="button"
                >
                  {layout === 'vertical' ? 'Vertical' : 'Horizontal'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <article
          aria-label="Open Nami Passport"
          className={
            'nami-profile-card-shell ' +
            (profileCardLayout === 'horizontal'
              ? 'nami-profile-card-shell-horizontal'
              : 'nami-profile-card-shell-vertical')
          }
          onClick={() => props.onNavigate?.('passport')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              props.onNavigate?.('passport');
            }
          }}
          onPointerLeave={resetCardFoil}
          onPointerMove={updateCardFoil}
          role="button"
          tabIndex={0}
        >
          <div
            className={
              'nami-profile-card-frame ' +
              (profileCardLayout === 'horizontal'
                ? 'nami-profile-card-frame-horizontal'
                : 'nami-profile-card-frame-vertical')
            }
            ref={profileCardFrameRef}
          >
            <div className="nami-profile-card-header">
              <span className="mini-badge">Nami Passport</span>
              <strong>Identity Card</strong>
            </div>

            <div className={'nami-profile-card-avatar ' + signalClass(profileMember.signal)}>
              {profileMember.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="nami-profile-card-nameplate">
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
                Portable gamer identity powered by Sui. Your Nami Passport connects
                SuiNS identity, proofs, guild standing, and gated-access readiness.
              </p>
            </div>

            <div className="nami-profile-card-stats">
              <div>
                <span>Signal</span>
                <strong>{profileMember.signal}</strong>
              </div>

              <div>
                <span>Tier</span>
                <strong>Adventurer</strong>
              </div>

              <div>
                <span>Rep</span>
                <strong>Gamester</strong>
              </div>
            </div>

            <div className="nami-profile-card-details">
              <div>
                <span>Handle</span>
                <strong>@npcgamer</strong>
              </div>

              <div>
                <span>SuiNS</span>
                <strong>{suiNsPublic ? 'npcgamer.sui' : 'Hidden publicly'}</strong>
              </div>

              <div>
                <span>Verification</span>
                <strong>{profileVerificationStatus}</strong>
                <span>Passport</span>
                <strong>Proof-based, not payment-based</strong>
              </div>

              <div>
                <span>Public Identity</span>
                <strong>{suiNsPublic ? 'SuiNS visible' : 'SuiNS hidden by default'}</strong>
              </div>
            </div>

            <div className="nami-profile-passport-surface">
              <span className="mini-badge">Privacy</span>
              <strong>SuiNS stays private by default.</strong>
              <p>
                You decide whether your readable identity is visible on public-facing
                profile surfaces.
              </p>

              <span className="nami-profile-passport-action-note">
                Click the foil card to open Nami Passport.
              </span>
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
                  onClick={(event) => {
                    event.stopPropagation();
                    props.onOpenProfile?.(channel);
                  }}
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
              Manage Subs
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
              Manage Guilds
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

  const [settingsChannelBrandPalette, setSettingsChannelBrandPalette] = useState<string[]>(() => {
    return readChannelBrandPalette();
  });

  function updateSettingsChannelBrandColor(index: number, color: string): void {
    const nextPalette = settingsChannelBrandPalette.map((currentColor, currentIndex) => {
      return currentIndex === index ? color : currentColor;
    }).slice(0, 4);

    setSettingsChannelBrandPalette(nextPalette);
    saveChannelBrandPalette(nextPalette);

    const selectedColor = readSelectedChannelBrandColor();

    if (!nextPalette.includes(selectedColor)) {
      saveSelectedChannelBrandColor(nextPalette[0] ?? color);
    }
  }

  function resetSettingsChannelBrandPalette(): void {
    const defaultPalette = ['#4da3ff', '#e11d48', '#34d399', '#f97316'];

    setSettingsChannelBrandPalette(defaultPalette);
    saveChannelBrandPalette(defaultPalette);
    saveSelectedChannelBrandColor(defaultPalette[0]!);
  }

  return (
    <>
      <header className="page-title">
        <p>Account preferences and controls</p>
        <h1>Settings</h1>
      </header>

              <section className="panel settings-channel-brand-palette settings-channel-owner-controls">
          <div className="settings-brand-header">
            <div>
              <span className="mini-badge">Channel Owner Controls</span>
              <h2>Brand Palette</h2>
              <p>
                Set up to four approved colors for this channel. Members only see
                these choices on the public Game Profile.
              </p>
            </div>

            <button
              className="profile-secondary-link settings-brand-reset-button"
              onClick={resetSettingsChannelBrandPalette}
              type="button"
            >
              Reset
            </button>
          </div>

          <div className="settings-brand-preview-row" aria-label="Approved brand color preview">
            {settingsChannelBrandPalette.slice(0, 4).map((color: string) => (
              <span
                className="settings-brand-preview-dot"
                key={color}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="settings-brand-color-grid settings-brand-color-grid-polished">
            {settingsChannelBrandPalette.slice(0, 4).map((color: string, index: number) => (
              <label className="settings-brand-color-chip settings-brand-color-chip-polished" key={index}>
                <span className="settings-brand-color-number">Color {index + 1}</span>
                <span className="settings-brand-color-preview" style={{ backgroundColor: color }} />
                <input
                  aria-label={'Approved channel brand color ' + (index + 1)}
                  onChange={(event) => updateSettingsChannelBrandColor(index, event.target.value)}
                  type="color"
                  value={color}
                />
                <small>{color.toUpperCase()}</small>
              </label>
            ))}
          </div>

          <p className="settings-brand-footnote">
            Public Game Profile keeps this simple by showing members only the approved color dots.
          </p>
        </section>

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

  const [selectedMember, setSelectedMember] = useState<(typeof members)[number]>(members[0]!);
  const [selectedDeveloper, setSelectedDeveloper] = useState<(typeof developers)[number]>(() => channelDeveloper(channels[0]!));
  const [studioReturnPage, setStudioReturnPage] = useState<NamiPage>('hub');
  const [contextReturnPage, setContextReturnPage] = useState<NamiPage>('hub');

  function profileReturnLabel(page: NamiPage): string {
    if (page === 'hub') return 'Back to Nami Hub';
    if (page === 'gamehub') return 'Back to Game Hub';
    if (page === 'channelProfile') return 'Back to Game Profile';
    if (page === 'studioProfile') return 'Back to Studio';
    if (page === 'memberProfile') return 'Back to Member Profile';
    if (page === 'chat') return 'Back to Chat';

    return 'Back';
  }

  const openMemberProfile = (member: (typeof members)[number]): void => {
    setSelectedMember(member);
    setContextReturnPage(activePage === 'memberProfile' ? contextReturnPage : activePage);
    window.localStorage.setItem('nami-selected-member-id', member.id);
    setActivePage('memberProfile');
  };


  const openChannelProfile = (channel: NamiChannel): void => {
    setSelectedChannel(channel);
    setSelectedDeveloper(channelDeveloper(channel));
    setContextReturnPage(activePage === 'channelProfile' ? contextReturnPage : activePage);
    setActivePage('channelProfile');
  };


  const openStudioProfile = (developer: (typeof developers)[number]): void => {
    setSelectedDeveloper(developer);
    setStudioReturnPage(activePage === 'studioProfile' ? studioReturnPage : activePage);
    setActivePage('studioProfile');
  };

  const navigateFromCurrentPage = (page: NamiPage): void => {
    if ((page === 'channelProfile' || page === 'memberProfile' || page === 'studioProfile') && page !== activePage) {
      setContextReturnPage(activePage);
    }

    setActivePage(page);
  };

  const screen = useMemo(() => {
    if (activePage === 'hub') {
      return <NamiHub
          selectedChannel={selectedChannel}
          onSelect={setSelectedChannel}
          onOpenProfile={openChannelProfile}
          onOpenMember={openMemberProfile}
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

    if (activePage === 'studioProfile') {
      return (
        <StudioProfileScreen
          developer={selectedDeveloper}
          onNavigate={(page) => setActivePage(page)}
          onOpenProfile={openChannelProfile}
          returnLabel={profileReturnLabel(studioReturnPage)}
          returnPage={studioReturnPage}
        />
      );
    }

    if (activePage === 'channelProfile') {
      return (
        <ChannelProfile
            channel={selectedChannel}
            onNavigate={navigateFromCurrentPage}
            onOpenProfile={openChannelProfile}
            onOpenStudioProfile={openStudioProfile}
            returnPage={contextReturnPage}
            returnLabel={profileReturnLabel(contextReturnPage)}
          />
      );
    }

    if (activePage === 'chat') {
    return <GameChat
        channel={selectedChannel}
        onNavigate={navigateFromCurrentPage}
        onOpenMember={openMemberProfile}
      />;
  }

  if (activePage === 'channelEvents') {
    return <ChannelEventsScreen channel={selectedChannel} onNavigate={navigateFromCurrentPage} />;
  }

  if (activePage === 'safetyCenter') {
    return <SafetyCenterScreen onNavigate={navigateFromCurrentPage} />;
  }

  if (activePage === 'memberProfile') {
    return <MemberProfileScreen
        member={selectedMember}
        onNavigate={navigateFromCurrentPage}
        returnPage={contextReturnPage}
        returnLabel={profileReturnLabel(contextReturnPage)}
      />;
  }

  if (activePage === 'passport') {
    return (
      <PassportScreen
        onNavigate={navigateFromCurrentPage}
        onOpenProfile={(channel) => {
          setSelectedChannel(channel);
          setActivePage('channelProfile');
        }}
      />
    );
  }

if (activePage === 'userProfile') {
      return <UserProfileScreen
          onOpenProfile={openChannelProfile}
          onNavigate={navigateFromCurrentPage}
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
      return <SettingsScreen onNavigate={navigateFromCurrentPage} />;
    }

    return <NamiHub
          selectedChannel={selectedChannel}
          onSelect={setSelectedChannel}
          onOpenProfile={openChannelProfile}
          onOpenMember={openMemberProfile}
        />;
  }, [activePage, selectedChannel, selectedMember, selectedDeveloper, studioReturnPage, contextReturnPage]);

  return (
    <main className="nami-app">
      <Sidebar
        activePage={activePage}
        collapsed={sidebarCollapsed}
        onNavigate={navigateFromCurrentPage}
        onToggle={() => setSidebarCollapsed((value) => !value)}
      />

      <section className="main-stage"><NamiSeasonProgressBar member={members[0]!} />
        {screen}</section>
    </main>
  );
}
