import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { canAccessModerationQueues } from './member-access.js';
import { ProtocolChannelAccessPanel } from './ProtocolChannelAccessPanel.js';
import { ProtocolDiscoveryPanel } from './ProtocolDiscoveryPanel.js';
import { ProtocolChannelPanel } from './ProtocolChannelPanel.js';
import { ProtocolConductPanel } from './ProtocolConductPanel.js';
import { ProtocolCustomizationPanel } from './ProtocolCustomizationPanel.js';
import { ProtocolHistoryPanel } from './ProtocolHistoryPanel.js';
import { ProtocolIdentityPanel } from './ProtocolIdentityPanel.js';
import { ProtocolModerationPanel } from './ProtocolModerationPanel.js';
import { ProtocolModerationRecordsPanel } from './ProtocolModerationRecordsPanel.js';
import { ProtocolProfilePanel } from './ProtocolProfilePanel.js';
import { ProtocolRecoveryPanel } from './ProtocolRecoveryPanel.js';
import { useProtocolOwner } from './wallet.js';

const INDEXED_TABS = [
  { id: 'identity', label: 'Identity' },
  { id: 'profile', label: 'Profile' },
  { id: 'conduct', label: 'Conduct' },
  { id: 'history', label: 'History' },
  { id: 'customization', label: 'Customization' },
  { id: 'channels', label: 'Channels' },
  { id: 'access', label: 'Access' },
  { id: 'moderation', label: 'Moderation' },
  { id: 'records', label: 'Records' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'discovery', label: 'Discovery' },
] as const;

type IndexedTabId = (typeof INDEXED_TABS)[number]['id'];

const MODERATION_QUEUE_TABS = new Set<IndexedTabId>(['moderation', 'records']);

export function IndexedDataPanel(props: { embedded?: boolean } = {}): ReactElement {
  const { owner } = useProtocolOwner();
  const canAccessModeration = canAccessModerationQueues(owner);
  const [activeTab, setActiveTab] = useState<IndexedTabId>('identity');

  const visibleTabs = useMemo(
    () =>
      INDEXED_TABS.filter(
        (tab) => canAccessModeration || !MODERATION_QUEUE_TABS.has(tab.id)
      ),
    [canAccessModeration]
  );

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id ?? 'identity');
    }
  }, [activeTab, visibleTabs]);

  return (
    <article
      className={
        'panel settings-indexed-data-panel' +
        (props.embedded ? ' nami-owner-advanced-embedded-panel' : ' settings-section-wide')
      }
    >
      {props.embedded ? null : (
        <div className="profile-panel-heading">
          <h2>Indexed Data</h2>
          <p>All synced profile, channel, and safety reads in one place.</p>
        </div>
      )}

      <div className="settings-indexed-tab-row tab-row" role="tablist" aria-label="Indexed data tabs">
        {visibleTabs.map((tab) => (
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

      <div className="settings-indexed-tab-body nami-owner-advanced-scroll-region">
        {activeTab === 'identity' ? <ProtocolIdentityPanel /> : null}
        {activeTab === 'profile' ? <ProtocolProfilePanel /> : null}
        {activeTab === 'conduct' ? <ProtocolConductPanel /> : null}
        {activeTab === 'history' ? <ProtocolHistoryPanel /> : null}
        {activeTab === 'customization' ? <ProtocolCustomizationPanel /> : null}
        {activeTab === 'channels' ? <ProtocolChannelPanel /> : null}
        {activeTab === 'access' ? <ProtocolChannelAccessPanel /> : null}
        {activeTab === 'moderation' ? <ProtocolModerationPanel /> : null}
        {activeTab === 'records' ? <ProtocolModerationRecordsPanel /> : null}
        {activeTab === 'recovery' ? <ProtocolRecoveryPanel /> : null}
        {activeTab === 'discovery' ? <ProtocolDiscoveryPanel /> : null}
      </div>
    </article>
  );
}