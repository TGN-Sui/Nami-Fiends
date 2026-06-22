import { useCallback, useEffect, useState, type CSSProperties, type ReactElement } from 'react';

import { ArcadeBackgroundMedia } from './ArcadeBackgroundMedia.js';
import type { HubDestinationPage } from './domain/hub-destinations.js';
import {
  readOfficialNamiArcadeGames,
  type NamiArcadeGame,
} from './nami-arcade-games.js';

type ArcadeScreenProps = {
  onExitToHub: (page: Extract<HubDestinationPage, 'hub' | 'gamehub'>) => void;
  onOpenChannel?: (channelId: string) => void;
};

function arcadeActionLabel(game: NamiArcadeGame): string {
  if (game.status === 'coming-soon') {
    return 'Cabinet offline';
  }

  if (game.channelId) {
    return 'Open channel';
  }

  return 'Insert coin';
}

export function ArcadeScreen(props: ArcadeScreenProps): ReactElement {
  const games = readOfficialNamiArcadeGames();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [menuReady, setMenuReady] = useState(false);

  const selectedGame = games[selectedIndex] ?? games[0]!;

  const moveSelection = useCallback(
    (delta: number): void => {
      setSelectedIndex((current) => {
        const next = current + delta;

        if (next < 0) {
          return games.length - 1;
        }

        if (next >= games.length) {
          return 0;
        }

        return next;
      });
    },
    [games.length],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setMenuReady(true), 480);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
        event.preventDefault();
        moveSelection(-1);
      }

      if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
        event.preventDefault();
        moveSelection(1);
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();

        if (selectedGame.channelId) {
          props.onOpenChannel?.(selectedGame.channelId);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveSelection, props, selectedGame.channelId]);

  return (
    <div className="arcade-screen">
      <div className="nami-arcade-box">
        <div className="nami-arcade-box-bezel">
          <div className="nami-arcade-box-viewport">
            <ArcadeBackgroundMedia />

            <div aria-hidden="true" className="arcade-screen-atmosphere">
              <div className="arcade-screen-rain" />
              <div className="arcade-screen-fog" />
              <div className="arcade-screen-scanlines" />
              <div className="arcade-screen-vignette" />
            </div>

            <div className={'arcade-screen-shell' + (menuReady ? ' is-menu-ready' : '')}>
              <header className="arcade-screen-marquee">
                <p className="arcade-screen-marquee-kicker">Official Nami Cabinets</p>
                <h1 className="arcade-screen-marquee-title">NAMI ARCADE</h1>
                <p className="arcade-screen-marquee-subtitle">
                  Down the alley · Cyber district · Insert coin
                </p>
              </header>

              <section aria-label="Arcade game select" className="arcade-screen-menu panel">
                <div className="arcade-screen-menu-head">
                  <span>SELECT GAME</span>
                  <span className="arcade-screen-menu-credit">CREDIT 01</span>
                </div>

                <ol className="arcade-screen-menu-list">
                  {games.map((game, index) => {
                    const isSelected = index === selectedIndex;

                    return (
                      <li key={game.id}>
                        <button
                          aria-pressed={isSelected}
                          className={
                            'arcade-screen-menu-item' +
                            (isSelected ? ' is-selected' : '') +
                            (game.status === 'coming-soon' ? ' is-offline' : '')
                          }
                          onClick={() => setSelectedIndex(index)}
                          onDoubleClick={() => {
                            if (game.channelId) {
                              props.onOpenChannel?.(game.channelId);
                            }
                          }}
                          type="button"
                        >
                          <span aria-hidden="true" className="arcade-screen-menu-cursor">
                            {isSelected ? '►' : ' '}
                          </span>
                          <span className="arcade-screen-menu-title">{game.title}</span>
                          <span className="arcade-screen-menu-genre">{game.genre}</span>
                          <span className="arcade-screen-menu-status">
                            {game.status === 'coming-soon' ? 'OFFLINE' : 'LIVE'}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>

                <footer className="arcade-screen-menu-foot">
                  <span>↑↓ MOVE</span>
                  <span>ENTER PLAY</span>
                  <span>© NAMI OFFICIAL</span>
                </footer>
              </section>

              <aside
                aria-label={selectedGame.title + ' cabinet preview'}
                className="arcade-screen-cabinet-card"
                style={
                  {
                    '--arcade-cabinet-accent': selectedGame.cabinetAccent,
                    '--arcade-cabinet-glow': selectedGame.cabinetGlow,
                  } as CSSProperties
                }
              >
                <div className="arcade-screen-cabinet-top">
                  <span className="arcade-screen-cabinet-badge">Official Cabinet</span>
                  <strong>{selectedGame.title}</strong>
                  <p>{selectedGame.tagline}</p>
                </div>

                <div className="arcade-screen-cabinet-screen">
                  <span className="arcade-screen-cabinet-screen-label">HI-SCORE</span>
                  <strong>{selectedGame.highScoreLabel}</strong>
                  <small>{selectedGame.releaseLabel}</small>
                </div>

                <div className="arcade-screen-cabinet-controls">
                  <button
                    className="arcade-screen-play-button"
                    disabled={selectedGame.status === 'coming-soon' || !selectedGame.channelId}
                    onClick={() => {
                      if (selectedGame.channelId) {
                        props.onOpenChannel?.(selectedGame.channelId);
                      }
                    }}
                    type="button"
                  >
                    {arcadeActionLabel(selectedGame)}
                  </button>
                </div>
              </aside>

              <nav aria-label="Leave arcade" className="arcade-screen-exit-menu">
                <span className="arcade-screen-exit-label">EXIT TO</span>
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
          </div>
        </div>
      </div>
    </div>
  );
}