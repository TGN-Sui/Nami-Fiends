import { useMemo } from 'react';

import {
  resolveMemberGuildAffiliations,
  resolveMemberSquadAffiliations,
} from './affiliation-provider.js';
import { getCreatedGuildRecords } from './guild-creation-store.js';
import { namiGuilds } from './nami-affiliations.js';
import { getCreatedSquadRecords } from './squad-creation-store.js';
import { useGuildCardsQuery, useSquadCardsQuery } from './protocol-query.js';
import { useProtocolOwner } from './wallet.js';

export function useProfileGroupAffiliations(memberId: string) {
  const { owner: protocolOwner, context } = useProtocolOwner();
  const { data: guildCards, loadState: guildLoadState } = useGuildCardsQuery();
  const { data: squadCards, loadState: squadLoadState } = useSquadCardsQuery();
  const guildLiveQueryEnabled = context.indexer !== null && protocolOwner !== null;
  const squadLiveQueryEnabled = context.chain !== null && protocolOwner !== null;

  const guildAffiliations = useMemo(
    () =>
      resolveMemberGuildAffiliations({
        liveCards: guildCards ?? [],
        loadState: guildLoadState,
        liveQueryEnabled: guildLiveQueryEnabled,
        memberId,
        createdGuilds: getCreatedGuildRecords(),
        fixtureGuilds: namiGuilds,
      }),
    [guildCards, guildLoadState, guildLiveQueryEnabled, memberId]
  );

  const squadAffiliations = useMemo(
    () =>
      resolveMemberSquadAffiliations({
        liveCards: squadCards ?? [],
        loadState: squadLoadState,
        liveQueryEnabled: squadLiveQueryEnabled,
        memberId,
        protocolOwner,
        createdSquads: getCreatedSquadRecords(),
      }),
    [memberId, protocolOwner, squadCards, squadLoadState, squadLiveQueryEnabled]
  );

  return { guildAffiliations, squadAffiliations };
}