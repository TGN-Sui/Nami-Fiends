import { useState, type ReactElement } from 'react';

import { ChannelBannerEditorCard } from './ChannelBannerEditorCard.js';
import { ChannelOwnerBrandPaletteCard } from './ChannelOwnerBrandPaletteCard.js';
import { ChannelOwnerEmojiPanel } from './ChannelOwnerEmojiPanel.js';
import { ChannelOwnerPromotionsPanel } from './ChannelOwnerPromotionsPanel.js';
import { ChannelCoverUploadCard } from './ChannelCoverUploadCard.js';
import { ChannelHeroBackgroundUploadCard } from './ChannelHeroBackgroundUploadCard.js';
import { ChannelNewsBannerUploadCard } from './ChannelNewsBannerUploadCard.js';
import { ChannelTrailerUploadCard } from './ChannelTrailerUploadCard.js';
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
import { ProtocolChannelAccessPanel } from './ProtocolChannelAccessPanel.js';
import { ProtocolChannelPanel } from './ProtocolChannelPanel.js';
import type { NamiChannel } from './uiMockData.js';

export function ChannelOwnerSection(props: {
  channel: NamiChannel;
  isEliteOwner: boolean;
  ownerBrandPalette: string[];
  onChangeBrandColor: (index: number, color: string) => void;
  onResetBrandPalette: () => void;
}): ReactElement {
  const layout = useChannelOwnerLayout(props.channel.id);
  const editMode = useChannelOwnerEditMode(props.channel.id);
  const [draggedPanelId, setDraggedPanelId] = useState<OwnerPanelId | null>(null);
  const [showChannelData, setShowChannelData] = useState(false);

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

    if (panelId === 'brand-palette') {
      return (
        <ChannelOwnerBrandPaletteCard
          onChangeColor={props.onChangeBrandColor}
          onReset={props.onResetBrandPalette}
          palette={props.ownerBrandPalette}
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
      return <ChannelBannerEditorCard channel={props.channel} isEliteOwner={props.isEliteOwner} />;
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
      if (panelId === 'channel-data') {
        return <div key={panelId}>{content}</div>;
      }

      return <div key={panelId}>{content}</div>;
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
            Personalize {props.channel.name} — upload media, reorder tabs and panels, and manage channel
            emojis.
          </p>
        </div>

        <button
          aria-pressed={editMode}
          className={'nami-surface-button' + (editMode ? ' is-primary-surface-button' : '')}
          onClick={() => setChannelOwnerEditMode(props.channel.id, !editMode)}
          type="button"
        >
          {editMode ? 'Done editing' : 'Edit mode'}
        </button>
      </div>

      {editMode ? (
        <p className="channel-owner-edit-mode-hint">
          Drag panel handles to reorder owner tools. Collapse panels you use less often. Switch to other
          tabs to drag them into your preferred order.
        </p>
      ) : null}

      <div className="channel-owner-layout-panel-stack">
        {layout.ownerPanelOrder.map((panelId) => renderOwnerPanel(panelId))}
      </div>
    </section>
  );
}