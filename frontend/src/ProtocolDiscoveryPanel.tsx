import { useState, type ReactElement } from 'react';

import { ProtocolPanelShell } from './protocol-panel.js';
import {
  ProtocolQueryStatus,
  useDiscoveryCategoriesQuery,
  useDiscoveryChannelsQuery,
  useDiscoveryGuildsQuery,
} from './protocol-query.js';
import type { DiscoveryChannelCategoryId } from './protocol.js';
import { useProtocolOwner } from './wallet.js';

const FALLBACK_CATEGORIES: Array<{
  id: DiscoveryChannelCategoryId;
  label: string;
  description: string;
}> = [
  { id: 'featured', label: 'Featured', description: 'Balanced weekly score.' },
  { id: 'top_boosted', label: 'Top Boosted', description: 'Strongest boost power.' },
  { id: 'rising', label: 'Rising', description: 'Week-over-week momentum.' },
  { id: 'verified', label: 'Verified Games', description: 'Verified developer channels.' },
];

export function ProtocolDiscoveryPanel(): ReactElement {
  const { owner } = useProtocolOwner();
  const [category, setCategory] = useState<DiscoveryChannelCategoryId>('featured');
  const { data: categoriesData } = useDiscoveryCategoriesQuery();
  const { data: channelDiscovery, loadState: channelLoadState, context } =
    useDiscoveryChannelsQuery(12, category);
  const { data: guildDiscovery, loadState: guildLoadState } = useDiscoveryGuildsQuery(8);

  const categories = categoriesData?.categories ?? FALLBACK_CATEGORIES;
  const channels = channelDiscovery?.channels ?? [];
  const guilds = guildDiscovery?.guilds ?? [];
  const weekId = channelDiscovery?.cycle.week_id ?? guildDiscovery?.cycle.week_id;
  const activeCategory = categories.find((entry) => entry.id === category);

  return (
    <ProtocolPanelShell
      context={context}
      description="Off-chain discovery rankings anchored by reputation-weighted boosts, conduct health, squad activity, and moderation signals."
      owner={owner}
      requiresIndexer
      requiresOwner={false}
      title="Discovery Cycle"
    >
      <ProtocolQueryStatus
        errorMessage="Could not load discovery rankings."
        loadState={channelLoadState === 'error' || guildLoadState === 'error' ? 'error' : channelLoadState}
        loadingMessage="Loading discovery rankings…"
      />

      <div className="protocol-discovery-category-tabs" role="tablist" aria-label="Discovery categories">
        {categories.map((entry) => (
          <button
            className={
              'protocol-discovery-category-tab' +
              (entry.id === category ? ' is-active' : '')
            }
            key={entry.id}
            onClick={() => setCategory(entry.id)}
            role="tab"
            type="button"
            aria-selected={entry.id === category}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {activeCategory ? (
        <p className="protocol-hint">{activeCategory.description}</p>
      ) : null}

      {weekId !== undefined ? (
        <p className="protocol-hint">
          Cycle week {weekId}
          {channelDiscovery?.cycle.engine_version
            ? ` · engine ${channelDiscovery.cycle.engine_version}`
            : ''}
          {channelDiscovery?.cycle.category ? ` · ${channelDiscovery.cycle.category}` : ''}.
        </p>
      ) : null}

      <div className="protocol-moderation-grid">
        <section>
          <h3>
            {activeCategory?.label ?? 'Channels'} ({channels.length})
          </h3>
          {channels.length === 0 ? (
            <p className="protocol-hint">No public channels ranked for this category yet.</p>
          ) : (
            <ul className="protocol-timeline-list">
              {channels.map((channel) => (
                <li className="protocol-timeline-item" key={channel.channel_id}>
                  <strong>
                    #{channel.rank} · {channel.channel_id.slice(0, 10)}…
                  </strong>
                  <p>
                    Score {channel.score} · boost {channel.boost_power}
                    {channel.rising_delta > 0 ? ` · rising +${channel.rising_delta}` : ''} · rep{' '}
                    {channel.score_components?.reputation ?? 0} · squad{' '}
                    {channel.score_components?.squad ?? 0} · moderation{' '}
                    {channel.score_components?.moderation ?? 0}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3>Top Guilds ({guilds.length})</h3>
          {guilds.length === 0 ? (
            <p className="protocol-hint">No public guilds ranked yet.</p>
          ) : (
            <ul className="protocol-timeline-list">
              {guilds.map((guild) => (
                <li className="protocol-timeline-item" key={guild.guild_id}>
                  <strong>
                    #{guild.rank} · {guild.guild_id.slice(0, 10)}…
                  </strong>
                  <p>
                    Score {guild.score} · {guild.member_count} members · squad{' '}
                    {guild.score_components?.squad ?? 0} · moderation{' '}
                    {guild.score_components?.moderation ?? 0}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ProtocolPanelShell>
  );
}