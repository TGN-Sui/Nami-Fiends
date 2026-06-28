import { type CSSProperties, type ReactElement } from 'react';

import {
  arcadeCabinetRequiredMembershipLabel,
  canEnterArcadeCabinet,
  type ArcadeCabinetView,
} from './arcade-cabinets.js';
import type { HubDestinationPage } from './domain/hub-destinations.js';
import { playArcadeMenuSelectSfx } from './nami-sfx.js';

export const ARCADE_CABINET_SELECT_COLUMNS = 2;

type ArcadeCabinetSelectProps = {
  cabinets: ArcadeCabinetView[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onConfirmSelection: () => void;
  onReturnToTitle: () => void;
  onExitToHub: (page: Extract<HubDestinationPage, 'hub' | 'gamehub'>) => void;
};

export function ArcadeCabinetSelect(props: ArcadeCabinetSelectProps): ReactElement {
  const selectedCabinet = props.cabinets[props.selectedIndex] ?? props.cabinets[0]!;
  const canEnter = canEnterArcadeCabinet(selectedCabinet);

  return (
    <div className="arcade-screen arcade-screen-cabinet-select">
      <header className="arcade-screen-marquee arcade-cabinet-select-marquee">
        <p className="arcade-screen-marquee-kicker">Universe 88 · World 003</p>
        <h1 className="arcade-screen-marquee-title">PICK YOUR MACHINE</h1>
        <p className="arcade-screen-marquee-subtitle">Down the alley · Wet neon · Crew pass ready</p>
      </header>

      <div className="arcade-cabinet-select-layout">
        <section aria-label="Arcade cabinet select" className="arcade-cabinet-select-grid-panel panel">
          <div className="arcade-screen-menu-head">
            <span>SELECT CABINET</span>
            <span className="arcade-screen-menu-credit">CREDIT 01</span>
          </div>

          <div
            aria-activedescendant={'arcade-cabinet-option-' + selectedCabinet.id}
            aria-label="Cabinet list"
            className="arcade-cabinet-select-grid"
            role="listbox"
          >
            {props.cabinets.map((cabinet, index) => {
              const isSelected = index === props.selectedIndex;
              const isLocked = cabinet.access === 'locked';
              const isOffline = cabinet.access === 'offline';

              return (
                <button
                  aria-selected={isSelected}
                  className={
                    'arcade-cabinet-select-tile' +
                    ' is-tier-' +
                    cabinet.cabinetTier +
                    (isSelected ? ' is-selected' : '') +
                    (isLocked ? ' is-locked-cabinet' : '') +
                    (isOffline ? ' is-offline' : '')
                  }
                  id={'arcade-cabinet-option-' + cabinet.id}
                  key={cabinet.id}
                  onClick={() => {
                    playArcadeMenuSelectSfx();
                    props.onSelectIndex(index);
                  }}
                  role="option"
                  type="button"
                >
                  <span aria-hidden="true" className="arcade-cabinet-select-tile-cursor">
                    {isSelected ? '►' : ''}
                  </span>
                  <span className="arcade-cabinet-select-tile-tier">T{cabinet.cabinetTier}</span>
                  <strong className="arcade-cabinet-select-tile-title">{cabinet.title}</strong>
                  <span className="arcade-cabinet-select-tile-genre">{cabinet.genre}</span>
                  <span className="arcade-cabinet-select-tile-status">{cabinet.accessLabel}</span>
                </button>
              );
            })}
          </div>

          <footer className="arcade-screen-menu-foot">
            <span>↑↓←→ MOVE</span>
            <span>{canEnter ? 'ENTER WALK' : 'LOCKED'}</span>
            <span>© GOONIE LABS</span>
          </footer>
        </section>

        <aside
          aria-label={selectedCabinet.title + ' cabinet preview'}
          className="arcade-screen-cabinet-card arcade-cabinet-select-preview"
          style={
            {
              '--arcade-cabinet-accent': selectedCabinet.cabinetAccent,
              '--arcade-cabinet-glow': selectedCabinet.cabinetGlow,
            } as CSSProperties
          }
        >
          <div className="arcade-screen-cabinet-top">
            <span className="arcade-screen-cabinet-badge">Tier {selectedCabinet.cabinetTier} Cabinet</span>
            <strong>{selectedCabinet.title}</strong>
            <p>{selectedCabinet.tagline}</p>
          </div>

          <div className="arcade-screen-cabinet-screen">
            <span className="arcade-screen-cabinet-screen-label">ACCESS</span>
            <strong>{selectedCabinet.accessLabel}</strong>
            <small>
              {selectedCabinet.access === 'locked'
                ? 'Requires ' + arcadeCabinetRequiredMembershipLabel(selectedCabinet.requiredMembership)
                : selectedCabinet.releaseLabel}
            </small>
          </div>

          <div className="arcade-screen-cabinet-controls">
            <button
              className="arcade-screen-play-button"
              disabled={!canEnter}
              onClick={() => {
                playArcadeMenuSelectSfx();
                props.onConfirmSelection();
              }}
              type="button"
            >
              {canEnter ? 'Walk to cabinet' : 'Crew pass required'}
            </button>
          </div>
        </aside>
      </div>

      <nav aria-label="Leave cabinet select" className="arcade-screen-exit-menu">
        <span className="arcade-screen-exit-label">EXIT TO</span>
        <button className="arcade-screen-exit-button" onClick={props.onReturnToTitle} type="button">
          Title Screen
        </button>
        <button
          className="arcade-screen-exit-button"
          onClick={() => props.onExitToHub('hub')}
          type="button"
        >
          Nami Hub
        </button>
        <button
          className="arcade-screen-exit-button"
          onClick={() => props.onExitToHub('gamehub')}
          type="button"
        >
          Game Hub
        </button>
      </nav>
    </div>
  );
}