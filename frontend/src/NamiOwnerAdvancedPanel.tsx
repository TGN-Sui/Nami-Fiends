import { useState, type ReactElement } from 'react';

import { HackathonDemoPanel } from './HackathonDemoPanel.js';
import { IndexedDataPanel } from './IndexedDataPanel.js';
import { LaunchOpsPanel } from './LaunchOpsPanel.js';
import { NamiOwnerAssetEditPanel } from './NamiOwnerAssetEditPanel.js';
import { NamiOwnerEmojiPanel } from './NamiOwnerEmojiPanel.js';
import { NamiOwnerGiftCatalogPanel } from './NamiOwnerGiftCatalogPanel.js';
import { NamiOfficialsSubmissionsPanel } from './NamiOfficialsSubmissionsPanel.js';
import { OfficialsRewardStudioPanel } from './OfficialsRewardStudioPanel.js';
import { NamiOwnerSettingsPanel } from './NamiOwnerSettingsPanel.js';
import { isOfficialOwner } from './nami-capabilities.js';
import {
  consumeOwnerAdvancedTabFocus,
  type OwnerAdvancedTabId,
} from './settings-navigation.js';
import type { NamiChannel } from './uiMockData.js';
import { useProtocolOwner } from './wallet.js';

const ADVANCED_TABS = [
  {
    id: 'demo',
    label: 'Hackathon demo',
    hint: 'Judge walkthrough, readiness checks, and Walrus BA-14 status.',
  },
  {
    id: 'assets',
    label: 'Visual Assets',
    hint: 'Badges, logos, button accents, and default portraits.',
  },
  {
    id: 'emojis',
    label: 'Chat Emojis',
    hint: 'Upload custom emojis for every member chat picker.',
  },
  {
    id: 'gifts',
    label: 'Gifts',
    hint: 'Edit gift icons, titles, and $GOON prices for profiles and live streams.',
  },
  {
    id: 'borders',
    label: 'Border Art',
    hint: 'Upload scalable chat border cosmetics and define reward conditions.',
  },
  {
    id: 'submissions',
    label: 'Submissions',
    hint: 'User suggestions, new game tickets, and partner banner requests.',
  },
  {
    id: 'security',
    label: 'Security',
    hint: 'Nodename claims, moderators, bans, and enforcement.',
  },
  {
    id: 'data',
    label: 'Indexed Data',
    hint: 'Synced profile, channel, safety protocol reads, and discovery rankings.',
  },
  {
    id: 'launch',
    label: 'Launch Ops',
    hint: 'Testnet policy, officials queue depth, and discovery cycle health.',
  },
] as const satisfies ReadonlyArray<{ id: OwnerAdvancedTabId; label: string; hint: string }>;

export function NamiOwnerAdvancedPanel(props: {
  onEnterEditMode: () => void;
  onOpenChannel?: (channel: NamiChannel) => void;
}): ReactElement | null {
  const { owner } = useProtocolOwner();
  const [activeTab, setActiveTab] = useState<OwnerAdvancedTabId>(
    () => consumeOwnerAdvancedTabFocus() ?? 'demo'
  );

  if (!isOfficialOwner(owner)) {
    return null;
  }

  const activeTabMeta = ADVANCED_TABS.find((tab) => tab.id === activeTab) ?? ADVANCED_TABS[0];

  return (
    <article className="panel nami-owner-advanced-dashboard settings-section-wide">
      <div className="nami-owner-advanced-heading">
        <span className="mini-badge">Nami Official Owner</span>
        <h2>Advanced platform controls</h2>
        <p>
          Manage artwork, border cosmetics, shared chat emojis, security enforcement, and indexed
          protocol data from one console.
        </p>
      </div>

      <div
        aria-label="Owner advanced settings"
        className="nami-owner-advanced-tab-row tab-row nami-owner-advanced-tab-row-scroll"
        role="tablist"
      >
        {ADVANCED_TABS.map((tab) => (
          <button
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? 'is-active-tab' : ''}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="nami-owner-advanced-tab-hint">{activeTabMeta.hint}</p>

      <div className="nami-owner-advanced-body">
        {activeTab === 'demo' ? <HackathonDemoPanel embedded /> : null}
        {activeTab === 'assets' ? (
          <NamiOwnerAssetEditPanel embedded onEnterEditMode={props.onEnterEditMode} />
        ) : null}
        {activeTab === 'emojis' ? <NamiOwnerEmojiPanel embedded /> : null}
        {activeTab === 'gifts' ? <NamiOwnerGiftCatalogPanel embedded /> : null}
        {activeTab === 'borders' ? <OfficialsRewardStudioPanel embedded /> : null}
        {activeTab === 'submissions' ? <NamiOfficialsSubmissionsPanel embedded /> : null}
        {activeTab === 'security' ? (
          <NamiOwnerSettingsPanel
            embedded
            {...(props.onOpenChannel ? { onOpenChannel: props.onOpenChannel } : {})}
          />
        ) : null}
        {activeTab === 'data' ? <IndexedDataPanel embedded /> : null}
        {activeTab === 'launch' ? <LaunchOpsPanel embedded /> : null}
      </div>
    </article>
  );
}