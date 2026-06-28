import { useCallback, useEffect, useState, type CSSProperties, type ReactElement } from 'react';

import { ArcadeBackgroundMedia } from './ArcadeBackgroundMedia.js';
import { ArcadeMusicPlayer } from './ArcadeMusicPlayer.js';
import { ArcadeBubbleGame, type ArcadeBubbleGameSummary } from './ArcadeBubbleGame.js';
import { arcadeBubbleModeLabel, type ArcadeBubbleMode } from './arcade-bubble-game.js';
import {
  readArcadeBubbleLeaderboard,
  recordArcadeBubbleGameResult,
  useArcadeBubbleGameVersion,
  type ArcadeBubbleGameResult,
} from './arcade-bubble-game-store.js';
import type { HubDestinationPage } from './domain/hub-destinations.js';
import { SELF_MEMBER_ID, getSelfMember } from './member-access.js';
import { resolveMemberDisplayName } from './member-display-name-store.js';
import {
  readOfficialNamiArcadeGames,
  type NamiArcadeGame,
} from './nami-arcade-games.js';
import {
  playArcadeGameOverSfx,
  playArcadeMenuSelectSfx,
  playArcadeScoreRevealSfx,
} from './nami-sfx.js';

type ArcadeScreenProps = {
  onExitToHub: (page: Extract<HubDestinationPage, 'hub' | 'gamehub'>) => void;
};

type ArcadePhase = 'menu' | 'mode-select' | 'playing' | 'results';

type ArcadeFlowState = {
  phase: ArcadePhase;
  selectedIndex: number;
  mode: ArcadeBubbleMode | null;
  result: ArcadeBubbleGameResult | null;
  lastSummary: ArcadeBubbleGameSummary | null;
};

export function ArcadeScreen(_props: ArcadeScreenProps): ReactElement {
  void _props;
  const games = readOfficialNamiArcadeGames();
  useArcadeBubbleGameVersion();
  const [cabinetStarted, setCabinetStarted] = useState(false);
  const [menuReady, setMenuReady] = useState(false);
  const [playSession, setPlaySession] = useState(0);
  const [flow, setFlow] = useState<ArcadeFlowState>({
    phase: 'menu',
    selectedIndex: 0,
    mode: null,
    result: null,
    lastSummary: null,
  });

  const selectedGame = games[flow.selectedIndex] ?? games[0]!;
  const isGameActive = flow.phase === 'playing' || flow.phase === 'results';
  const member = getSelfMember();
  const displayName = resolveMemberDisplayName(SELF_MEMBER_ID, member.name);

  const startCabinet = useCallback((): void => {
    playArcadeMenuSelectSfx();
    setCabinetStarted(true);
  }, []);

  const returnToTitle = useCallback((): void => {
    playArcadeMenuSelectSfx();
    setCabinetStarted(false);
    setMenuReady(false);
    setFlow({
      phase: 'menu',
      selectedIndex: 0,
      mode: null,
      result: null,
      lastSummary: null,
    });
  }, []);

  const moveSelection = useCallback(
    (delta: number): void => {
      if (flow.phase !== 'menu') {
        return;
      }

      playArcadeMenuSelectSfx();
      setFlow((current) => {
        const next = current.selectedIndex + delta;

        if (next < 0) {
          return { ...current, selectedIndex: games.length - 1 };
        }

        if (next >= games.length) {
          return { ...current, selectedIndex: 0 };
        }

        return { ...current, selectedIndex: next };
      });
    },
    [flow.phase, games.length],
  );

  const launchSelectedGame = useCallback((): void => {
    if (selectedGame.status !== 'live') {
      return;
    }

    playArcadeMenuSelectSfx();
    setFlow((current) => ({
      ...current,
      phase: 'mode-select',
      mode: null,
      result: null,
      lastSummary: null,
    }));
  }, [selectedGame.status]);

  const startMode = useCallback((mode: ArcadeBubbleMode): void => {
    playArcadeMenuSelectSfx();
    setPlaySession((session) => session + 1);
    setFlow((current) => ({
      ...current,
      phase: 'playing',
      mode,
      result: null,
      lastSummary: null,
    }));
  }, []);

  const handleGameForfeit = useCallback(() => {
    setFlow((current) => ({
      ...current,
      phase: 'mode-select',
      mode: null,
      result: null,
      lastSummary: null,
    }));
  }, []);

  const handleGameComplete = useCallback(
    (summary: ArcadeBubbleGameSummary) => {
      playArcadeGameOverSfx();

      const result = recordArcadeBubbleGameResult({
        memberId: SELF_MEMBER_ID,
        displayName,
        mode: summary.mode,
        score: summary.score,
        bubblesPopped: summary.bubblesPopped,
      });

      playArcadeScoreRevealSfx();

      setFlow((current) => ({
        ...current,
        phase: 'results',
        mode: summary.mode,
        result,
        lastSummary: summary,
      }));
    },
    [displayName],
  );

  useEffect(() => {
    if (!cabinetStarted) {
      setMenuReady(false);
      return;
    }

    const timer = window.setTimeout(() => setMenuReady(true), 480);

    return () => window.clearTimeout(timer);
  }, [cabinetStarted]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (!cabinetStarted) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          startCabinet();
        }

        return;
      }

      if (flow.phase === 'menu') {
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
          launchSelectedGame();
        }

        return;
      }

      if (flow.phase === 'mode-select') {
        if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
          event.preventDefault();
          startMode('normal');
        }

        if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
          event.preventDefault();
          startMode('hard');
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          setFlow((current) => ({ ...current, phase: 'menu', mode: null }));
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cabinetStarted, flow.phase, launchSelectedGame, moveSelection, startCabinet, startMode]);

  function renderExitMenu(): ReactElement {
    return (
      <nav aria-label="Leave arcade" className="arcade-screen-exit-menu">
        <span className="arcade-screen-exit-label">EXIT TO</span>
        <button className="arcade-screen-exit-button" onClick={returnToTitle} type="button">
          Title Screen
        </button>
        <button
          className="arcade-screen-exit-button"
          onClick={() => _props.onExitToHub('hub')}
          type="button"
        >
          Nami Hub
        </button>
        <button
          className="arcade-screen-exit-button"
          onClick={() => _props.onExitToHub('gamehub')}
          type="button"
        >
          Game Hub
        </button>
      </nav>
    );
  }

  function renderModeSelect(): ReactElement {
    return (
      <section aria-label="Select bubble game mode" className="arcade-bubble-mode-select panel">
        <header className="arcade-bubble-mode-select-head">
          <span>Nami Bubble Pop</span>
          <span>60 SEC RUN</span>
        </header>

        <div className="arcade-bubble-mode-select-copy">
          <h2>Choose your lane</h2>
          <p>
            Normal mode uses landing-page bubble physics with quicker small pops. Hard mode raises
            minimum speed and requires more taps per bubble.
          </p>
        </div>

        <div className="arcade-bubble-mode-select-actions">
          <button className="arcade-bubble-mode-button" onClick={() => startMode('normal')} type="button">
            <strong>Normal Mode</strong>
            <small>Small 1 tap · Big 3 taps · +1 / +2 points</small>
          </button>
          <button className="arcade-bubble-mode-button is-hard-mode" onClick={() => startMode('hard')} type="button">
            <strong>Hard Mode</strong>
            <small>Small 2 taps · Big 4 taps · faster rise</small>
          </button>
        </div>

        <footer className="arcade-bubble-mode-select-foot">
          <button
            className="arcade-screen-exit-button"
            onClick={() => setFlow((current) => ({ ...current, phase: 'menu', mode: null }))}
            type="button"
          >
            Back to menu
          </button>
        </footer>
      </section>
    );
  }

  function renderResults(): ReactElement | null {
    if (!flow.result || !flow.mode || !flow.lastSummary) {
      return null;
    }

    const leaderboard = readArcadeBubbleLeaderboard(flow.mode);

    return (
      <section aria-label="Bubble game results" className="arcade-bubble-results panel">
        <header className="arcade-bubble-results-head">
          <span>Run complete</span>
          <span>{arcadeBubbleModeLabel(flow.mode)}</span>
        </header>

        <div className="arcade-bubble-results-score">
          <span>Final score</span>
          <strong>{flow.result.score}</strong>
          <p>
            {flow.result.bubblesPopped} bubbles popped · Leaderboard #{flow.result.rank}
            {flow.result.isPersonalBest ? ' · New personal best' : ''}
          </p>
        </div>

        <ol className="arcade-bubble-results-leaderboard">
          {leaderboard.map((entry, index) => (
            <li
              className={
                entry.memberId === SELF_MEMBER_ID && entry.score === flow.result?.score
                  ? 'is-current-player'
                  : ''
              }
              key={entry.id}
            >
              <span>#{index + 1}</span>
              <strong>{entry.displayName}</strong>
              <span>{entry.score}</span>
            </li>
          ))}
          {leaderboard.length === 0 ? (
            <li className="arcade-bubble-results-empty">No runs recorded yet — yours is first.</li>
          ) : null}
        </ol>

        <div className="arcade-bubble-results-actions">
          <button
            className="arcade-screen-play-button"
            onClick={() => {
              if (flow.mode) {
                startMode(flow.mode);
              }
            }}
            type="button"
          >
            Try again
          </button>
          <button
            className="arcade-screen-exit-button"
            onClick={() =>
              setFlow((current) => ({
                ...current,
                phase: 'mode-select',
                result: null,
                lastSummary: null,
              }))
            }
            type="button"
          >
            Different mode
          </button>
          <button
            className="arcade-screen-exit-button"
            onClick={() =>
              setFlow({
                phase: 'menu',
                selectedIndex: 0,
                mode: null,
                result: null,
                lastSummary: null,
              })
            }
            type="button"
          >
            Back to menu
          </button>
        </div>
      </section>
    );
  }

  function renderMenu(game: NamiArcadeGame): ReactElement {
    return (
      <>
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
            {games.map((entry, index) => {
              const isSelected = index === flow.selectedIndex;

              return (
                <li key={entry.id}>
                  <button
                    aria-pressed={isSelected}
                    className={
                      'arcade-screen-menu-item' +
                      (isSelected ? ' is-selected' : '') +
                      (entry.status === 'coming-soon' ? ' is-offline' : '')
                    }
                    onClick={() => {
                      playArcadeMenuSelectSfx();
                      setFlow((current) => ({ ...current, selectedIndex: index }));
                    }}
                    type="button"
                  >
                    <span aria-hidden="true" className="arcade-screen-menu-cursor">
                      {isSelected ? '►' : ' '}
                    </span>
                    <span className="arcade-screen-menu-title">{entry.title}</span>
                    <span className="arcade-screen-menu-genre">{entry.genre}</span>
                    <span className="arcade-screen-menu-status">
                      {entry.status === 'coming-soon' ? 'OFFLINE' : 'LIVE'}
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
          aria-label={game.title + ' cabinet preview'}
          className="arcade-screen-cabinet-card"
          style={
            {
              '--arcade-cabinet-accent': game.cabinetAccent,
              '--arcade-cabinet-glow': game.cabinetGlow,
            } as CSSProperties
          }
        >
          <div className="arcade-screen-cabinet-top">
            <span className="arcade-screen-cabinet-badge">Official Cabinet</span>
            <strong>{game.title}</strong>
            <p>{game.tagline}</p>
          </div>

          <div className="arcade-screen-cabinet-screen">
            <span className="arcade-screen-cabinet-screen-label">HI-SCORE</span>
            <strong>{game.highScoreLabel}</strong>
            <small>{game.releaseLabel}</small>
          </div>

          <div className="arcade-screen-cabinet-controls">
            <button
              className="arcade-screen-play-button"
              disabled={game.status === 'coming-soon'}
              onClick={launchSelectedGame}
              type="button"
            >
              Insert coin
            </button>
          </div>
        </aside>

        {renderExitMenu()}
      </>
    );
  }

  const playLobbyMusic = flow.phase !== 'playing';
  const activeGameId = flow.phase === 'playing' ? selectedGame.id : null;

  return (
    <>
      <ArcadeMusicPlayer activeGameId={activeGameId} playLobbyMusic={playLobbyMusic} />

      {!cabinetStarted ? (
        <div className="arcade-screen arcade-screen-attract">
          <div className="arcade-screen-attract-stage">
            <h1 className="arcade-screen-attract-title">ARCADE</h1>
            <button
              aria-label="Press start to open the arcade cabinet"
              className="arcade-press-start-button"
              onClick={startCabinet}
              type="button"
            >
              <span className="arcade-press-start-label">PRESS START</span>
            </button>
          </div>
        </div>
      ) : (
    <div className={'arcade-screen' + (isGameActive ? ' is-arcade-game-active' : '')}>
      <div className={'nami-arcade-box' + (isGameActive ? ' is-arcade-game-active' : '')}>
        <div className="nami-arcade-box-bezel">
          <div className="nami-arcade-box-viewport">
            <ArcadeBackgroundMedia />

            {flow.phase === 'menu' ? (
              <div aria-hidden="true" className="arcade-screen-atmosphere">
                <div className="arcade-screen-rain" />
                <div className="arcade-screen-fog" />
                <div className="arcade-screen-scanlines" />
                <div className="arcade-screen-vignette" />
              </div>
            ) : null}

            <div
              className={
                'arcade-screen-shell' +
                (menuReady ? ' is-menu-ready' : '') +
                (flow.phase === 'playing' ? ' is-bubble-game-playing' : '') +
                (flow.phase === 'results' ? ' is-bubble-game-results' : '') +
                (flow.phase === 'mode-select' ? ' is-bubble-game-mode-select' : '')
              }
            >
              {flow.phase === 'menu' ? renderMenu(selectedGame) : null}
              {flow.phase === 'mode-select' ? renderModeSelect() : null}
              {flow.phase === 'playing' && flow.mode ? (
                <ArcadeBubbleGame
                  key={flow.mode + '-' + playSession}
                  mode={flow.mode}
                  onComplete={handleGameComplete}
                  onForfeit={handleGameForfeit}
                />
              ) : null}
              {flow.phase === 'results' ? renderResults() : null}
            </div>
          </div>
        </div>
      </div>
    </div>
      )}
    </>
  );
}