import { useState, type ReactElement } from 'react';

import { IndexedDataPanel } from './IndexedDataPanel.js';
import { NamiOwnerAssetEditPanel } from './NamiOwnerAssetEditPanel.js';
import { NamiOwnerEmojiPanel } from './NamiOwnerEmojiPanel.js';
import { NamiOfficialsSubmissionsPanel } from './NamiOfficialsSubmissionsPanel.js';
import { NamiOwnerSettingsPanel } from './NamiOwnerSettingsPanel.js';
import { isOfficialOwner } from './nami-capabilities.js';
import type { NamiChannel } from './uiMockData.js';
import { useProtocolOwner } from './wallet.js';

const ADVANCED_TABS = [
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
    hint: 'Synced profile, channel, and safety protocol reads.',
  },
] as const;

type AdvancedTabId = (typeof ADVANCED_TABS)[number]['id'];

export function NamiOwnerAdvancedPanel(props: {
  onEnterEditMode: () => void;
  onOpenChannel?: (channel: NamiChannel) => void;
}): ReactElement | null {
  const { owner } = useProtocolOwner();
  const [activeTab, setActiveTab] = useState<AdvancedTabId>('assets');

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
          Manage artwork, shared chat emojis, security enforcement, and indexed protocol data from
          one console. Each tab scrolls inside this workspace so long catalogs stay reachable.
        </p>
      </div>

      <div
        aria-label="Owner advanced settings"
        className="nami-owner-advanced-tab-row tab-row"
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
        {activeTab === 'assets' ? (
          <NamiOwnerAssetEditPanel embedded onEnterEditMode={props.onEnterEditMode} />
        ) : null}
        {activeTab === 'emojis' ? <NamiOwnerEmojiPanel embedded /> : null}
        {activeTab === 'submissions' ? <NamiOfficialsSubmissionsPanel embedded /> : null}
        {activeTab === 'security' ? (
          <NamiOwnerSettingsPanel
            embedded
            {...(props.onOpenChannel ? { onOpenChannel: props.onOpenChannel } : {})}
          />
        ) : null}
        {activeTab === 'data' ? <IndexedDataPanel embedded /> : null}
      </div>
    </article>
  );
}