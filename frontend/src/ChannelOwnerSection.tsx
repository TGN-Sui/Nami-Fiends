import { useState, type ReactElement } from 'react';

import { ChannelBannerEditorCard } from './ChannelBannerEditorCard.js';
import { ChannelOwnerPlatformsPanel } from './ChannelOwnerPlatformsPanel.js';
import { ChannelOwnerBrandPaletteCard } from './ChannelOwnerBrandPaletteCard.js';
import { ChannelOwnerEmojiPanel } from './ChannelOwnerEmojiPanel.js';
import { ChannelOwnerPromotionsPanel } from './ChannelOwnerPromotionsPanel.js';
import { ChannelCoverUploadCard } from './ChannelCoverUploadCard.js';
import { ChannelHeroBackgroundUploadCard } from './ChannelHeroBackgroundUploadCard.js';
import { ChannelNewsBannerUploadCard } from './ChannelNewsBannerUploadCard.js';
import { ChannelTrailerUploadCard } from './ChannelTrailerUploadCard.js';
import {
  ChannelOwnerSettingsProvider,
  useChannelOwnerSettings,
} from './channel-owner-settings-context.js';
import {
  isOwnerPanelCollapsed,
  moveItem,
  OWNER_PANEL_LABELS,
  reorderOwnerPanels,
  setChannelOwnerEditMode,
  toggleOwnerPanelCollapsed,
  useChannelOwnerEditMode,
  useChannelOwnerLayout,
  type OwnerPanelId,
} from './channel-owner-layout-store.js';
import {
  OWNER_SETTINGS_GROUPS,
  readOwnerSettingsGroup,
  saveOwnerSettingsGroup,
  type OwnerSettingsGroup,
} from './channel-owner-settings-groups.js';
import { ProtocolChannelAccessPanel } from './ProtocolChannelAccessPanel.js';
import { ProtocolChannelPanel } from './ProtocolChannelPanel.js';
import type { NamiChannel } from './uiMockData.js';

function ChannelOwnerSettingsFooter(): ReactElement {
  const settings = useChannelOwnerSettings();

  return (
    <footer className="channel-owner-settings-footer">
      <div className="channel-owner-settings-footer-copy">
        {settings.isDirty ? (
          <span className="channel-owner-settings-dirty-pill">Unsaved changes</span>
        ) : (
          <span className="channel-owner-settings-saved-pill">All changes saved</span>
        )}
        {settings.saveNotice ? (
          <p className="channel-owner-settings-footer-notice is-success">{settings.saveNotice}</p>
        ) : null}
        {settings.saveError ? (
          <p className="channel-owner-settings-footer-notice is-error">{settings.saveError}</p>
        ) : null}
      </div>

      <div className="channel-owner-settings-footer-actions">
        <button
          className="nami-surface-button"
          disabled={!settings.isDirty}
          onClick={settings.discardSettings}
          type="button"
        >
          Discard
        </button>
        <button
          className="nami-surface-button is-primary-surface-button"
          disabled={!settings.isDirty}
          onClick={settings.saveSettings}
          type="button"
        >
          Save settings
        </button>
      </div>
    </footer>
  );
}

function ChannelOwnerSectionBody(props: { channel: NamiChannel }): ReactElement {
  const layout = useChannelOwnerLayout(props.channel.id);
  const editMode = useChannelOwnerEditMode(props.channel.id);
  const settings = useChannelOwnerSettings();
  const [activeGroup, setActiveGroup] = useState<OwnerSettingsGroup>(() =>
    readOwnerSettingsGroup(props.channel.id),
  );
  const [draggedPanelId, setDraggedPanelId] = useState<OwnerPanelId | null>(null);
  const [showChannelData, setShowChannelData] = useState(false);

  const activeGroupDefinition =
    OWNER_SETTINGS_GROUPS.find((group) => group.id === activeGroup) ?? OWNER_SETTINGS_GROUPS[0]!;
  const visiblePanelIds = layout.ownerPanelOrder.filter((panelId) =>
    activeGroupDefinition.panels.includes(panelId),
  );

  function handleGroupChange(group: OwnerSettingsGroup): void {
    setActiveGroup(group);
    saveOwnerSettingsGroup(props.channel.id, group);
    settings.clearMessages();
  }

  function handlePanelDrop(targetPanelId: OwnerPanelId): void {
    if (!draggedPanelId || draggedPanelId === targetPanelId) {
      setDraggedPanelId(null);
      return;
    }

    const fromIndex = layout.ownerPanelOrder.indexOf(draggedPanelId);
    const toIndex = layout.ownerPanelOrder.indexOf(targetPanelId);

    if (fromIndex < 0 || toIndex < 0) {
      setDraggedPanelId(null);
      return;
    }

    reorderOwnerPanels(props.channel.id, moveItem(layout.ownerPanelOrder, fromIndex, toIndex));
    setDraggedPanelId(null);
  }

  function renderPanelContent(panelId: OwnerPanelId): ReactElement | null {
    if (panelId === 'promotions') {
      return <ChannelOwnerPromotionsPanel channel={props.channel} />;
    }

    if (panelId === 'supported-platforms') {
      return <ChannelOwnerPlatformsPanel channel={props.channel} />;
    }

    if (panelId === 'brand-palette') {
      return (
        <ChannelOwnerBrandPaletteCard
          onChangeColor={settings.updateBrandColor}
          onReset={settings.resetBrandPalette}
          palette={settings.draft.brandPalette}
        />
      );
    }

    if (panelId === 'cover') {
      return <ChannelCoverUploadCard channel={props.channel} />;
    }

    if (panelId === 'hero-background') {
      return <ChannelHeroBackgroundUploadCard channel={props.channel} />;
    }

    if (panelId === 'news-banner') {
      return <ChannelNewsBannerUploadCard channel={props.channel} />;
    }

    if (panelId === 'trailer') {
      return <ChannelTrailerUploadCard channel={props.channel} />;
    }

    if (panelId === 'custom-emojis') {
      return <ChannelOwnerEmojiPanel channel={props.channel} />;
    }

    if (panelId === 'banner-editor') {
      return <ChannelBannerEditorCard channel={props.channel} />;
    }

    if (panelId === 'channel-data') {
      return (
        <article className="panel channel-data-collapse channel-owner-layout-panel">
          <button
            className="secondary-action"
            onClick={() => setShowChannelData((value) => !value)}
            type="button"
          >
            {showChannelData ? 'Hide channel data' : 'Show channel data'}
          </button>

          {showChannelData ? (
            <div className="channel-data-tab-body">
              <ProtocolChannelPanel />
              <ProtocolChannelAccessPanel />
            </div>
          ) : null}
        </article>
      );
    }

    return null;
  }

  function renderOwnerPanel(panelId: OwnerPanelId): ReactElement {
    const collapsed = isOwnerPanelCollapsed(props.channel.id, panelId);
    const content = renderPanelContent(panelId);

    if (!content) {
      return <div key={panelId} />;
    }

    if (!editMode) {
      return <div className="channel-owner-settings-panel" key={panelId}>{content}</div>;
    }

    const isDragging = draggedPanelId === panelId;

    return (
      <section
        className={
          'channel-owner-layout-panel-shell' +
          (isDragging ? ' is-dragging-owner-panel' : '') +
          (collapsed ? ' is-owner-panel-collapsed' : '')
        }
        draggable
        key={panelId}
        onDragEnd={() => setDraggedPanelId(null)}
        onDragOver={(event) => event.preventDefault()}
        onDragStart={() => setDraggedPanelId(panelId)}
        onDrop={() => handlePanelDrop(panelId)}
      >
        <div className="channel-owner-layout-panel-toolbar">
          <button
            aria-label={'Drag ' + OWNER_PANEL_LABELS[panelId]}
            className="channel-owner-layout-drag-handle"
            draggable
            onDragEnd={() => setDraggedPanelId(null)}
            onDragStart={() => setDraggedPanelId(panelId)}
            type="button"
          >
            ⋮⋮
          </button>
          <strong>{OWNER_PANEL_LABELS[panelId]}</strong>
          <button
            className="nami-surface-button"
            onClick={() => toggleOwnerPanelCollapsed(props.channel.id, panelId)}
            type="button"
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>

        {collapsed ? null : <div className="channel-owner-layout-panel-body">{content}</div>}
      </section>
    );
  }

  return (
    <section
      className={
        'channel-profile-section channel-profile-owner' + (editMode ? ' is-channel-owner-edit-mode' : '')
      }
    >
      <div className="channel-profile-section-head channel-owner-edit-mode-head">
        <div>
          <h2>Owner tools</h2>
          <p>
            Manage {props.channel.name} in focused sections. Uploads save immediately — text and toggles
            use Save settings below.
          </p>
        </div>

        <button
          aria-pressed={editMode}
          className={'nami-surface-button' + (editMode ? ' is-primary-surface-button' : '')}
          onClick={() => setChannelOwnerEditMode(props.channel.id, !editMode)}
          type="button"
        >
          {editMode ? 'Done editing' : 'Edit layout'}
        </button>
      </div>

      <nav aria-label="Owner settings sections" className="channel-owner-settings-nav">
        {OWNER_SETTINGS_GROUPS.map((group) => (
          <button
            aria-current={activeGroup === group.id ? 'page' : undefined}
            className={
              'channel-owner-settings-nav-tab' + (activeGroup === group.id ? ' is-active' : '')
            }
            key={group.id}
            onClick={() => handleGroupChange(group.id)}
            type="button"
          >
            <strong>{group.label}</strong>
            <span>{group.description}</span>
          </button>
        ))}
      </nav>

      {editMode ? (
        <p className="channel-owner-edit-mode-hint">
          Edit layout mode: drag panel handles to reorder tools in this section. Switch sections to
          arrange each group.
        </p>
      ) : null}

      <div className="channel-owner-settings-panel-stack">
        {visiblePanelIds.length > 0 ? (
          visiblePanelIds.map((panelId) => renderOwnerPanel(panelId))
        ) : (
          <p className="channel-owner-settings-empty">No tools in this section yet.</p>
        )}
      </div>

      <ChannelOwnerSettingsFooter />
    </section>
  );
}

export function ChannelOwnerSection(props: { channel: NamiChannel }): ReactElement {
  return (
    <ChannelOwnerSettingsProvider channel={props.channel}>
      <ChannelOwnerSectionBody channel={props.channel} />
    </ChannelOwnerSettingsProvider>
  );
}