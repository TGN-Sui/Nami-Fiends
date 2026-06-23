import type { ReactElement } from 'react';

import { ProtocolPanelShell } from './protocol-panel.js';
import {
  ProtocolQueryStatus,
  useDiscoveryChannelsQuery,
  useDiscoveryGuildsQuery,
} from './protocol-query.js';
import { useProtocolOwner } from './wallet.js';

export function ProtocolDiscoveryPanel(): ReactElement {
  const { owner } = useProtocolOwner();
  const { data: channelDiscovery, loadState: channelLoadState, context } =
    useDiscoveryChannelsQuery(12);
  const { data: guildDiscovery, loadState: guildLoadState } = useDiscoveryGuildsQuery(8);

  const channels = channelDiscovery?.channels ?? [];
  const guilds = guildDiscovery?.guilds ?? [];
  const weekId = channelDiscovery?.cycle.week_id ?? guildDiscovery?.cycle.week_id;

  return (
    <ProtocolPanelShell
      context={context}
      description="Off-chain discovery rankings anchored by boosts, verification, badge quality, guild activity, and moderation health."
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

      {weekId !== undefined ? (
        <p className="protocol-hint">
          Cycle week {weekId}
          {channelDiscovery?.cycle.engine_version
            ? ` · engine ${channelDiscovery.cycle.engine_version}`
            : ''}
          .
        </p>
      ) : null}

      <div className="protocol-moderation-grid">
        <section>
          <h3>Top Channels ({channels.length})</h3>
          {channels.length === 0 ? (
            <p className="protocol-hint">No public channels ranked for this cycle yet.</p>
          ) : (
            <ul className="protocol-timeline-list">
              {channels.map((channel) => (
                <li className="protocol-timeline-item" key={channel.channel_id}>
                  <strong>
                    #{channel.rank} · {channel.channel_id.slice(0, 10)}…
                  </strong>
                  <p>
                    Score {channel.score} · boost {channel.boost_power} · badges{' '}
                    {channel.score_components?.badges ?? 0} · moderation{' '}
                    {channel.score_components?.moderation ?? 0} ·{' '}
                    {channel.is_verified ? 'verified' : 'unverified'}
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
                    Score {guild.score} · {guild.member_count} members · badges{' '}
                    {guild.score_components?.badges ?? 0} · moderation{' '}
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