import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactElement } from 'react';

import { ArcadeBackgroundMedia } from './ArcadeBackgroundMedia.js';
import { ArcadeAudioControls } from './ArcadeAudioControls.js';
import { ArcadeCabinetIntro } from './ArcadeCabinetIntro.js';
import {
  ARCADE_CABINET_SELECT_COLUMNS,
  ArcadeCabinetSelect,
} from './ArcadeCabinetSelect.js';
import {
  ArcadeCabinetPlaySession,
  type ArcadeCabinetPlayPhase,
} from './ArcadeCabinetPlaySession.js';
import { ArcadeMusicPlayer } from './ArcadeMusicPlayer.js';
import {
  canEnterArcadeCabinet,
  readArcadeCabinetsForMember,
  type ArcadeCabinetView,
} from './arcade-cabinets.js';
import {
  arcadeCabinetStageFitStyle,
  readArcadeCabinetStageFit,
} from './arcade-cabinet-stage-fit.js';
import {
  clearArcadeSession,
  setArcadeStageCabinetId,
  useArcadeStageCabinetId,
} from './arcade-session-store.js';
import type { HubDestinationPage } from './domain/hub-destinations.js';
import { SELF_MEMBER_ID, getSelfMember } from './member-access.js';
import { resolveMemberDisplayName } from './member-display-name-store.js';
import { playArcadeMenuSelectSfx } from './nami-sfx.js';

type ArcadeScreenProps = {
  onExitToHub: (page: Extract<HubDestinationPage, 'hub' | 'gamehub'>) => void;
};

type ArcadeScreenPhase = 'attract' | 'cabinet-select' | 'cabinet-intro' | 'cabinet-active';

type ArcadeCabinetMenuPhase = 'menu' | 'play';

export function ArcadeScreen(props: ArcadeScreenProps): ReactElement {
  const member = getSelfMember();
  const cabinets = useMemo(() => readArcadeCabinetsForMember(member), [member.tier]);

  const [screenPhase, setScreenPhase] = useState<ArcadeScreenPhase>('attract');
  const [selectedCabinetIndex, setSelectedCabinetIndex] = useState(0);
  const [activeCabinetId, setActiveCabinetId] = useState<string | null>(null);
  const [pendingCabinetId, setPendingCabinetId] = useState<string | null>(null);
  const [skipCabinetIntro, setSkipCabinetIntro] = useState(false);
  const [menuReady, setMenuReady] = useState(false);
  const [cabinetMenuPhase, setCabinetMenuPhase] = useState<ArcadeCabinetMenuPhase>('menu');
  const [cabinetPlayPhase, setCabinetPlayPhase] = useState<ArcadeCabinetPlayPhase>('mode-select');

  const selectedCabinet = cabinets[selectedCabinetIndex] ?? cabinets[0]!;
  const activeCabinet =
    cabinets.find((cabinet) => cabinet.id === activeCabinetId) ?? selectedCabinet;
  const pendingCabinet =
    cabinets.find((cabinet) => cabinet.id === pendingCabinetId) ?? null;

  const isGameActive =
    screenPhase === 'cabinet-active' &&
    cabinetMenuPhase === 'play' &&
    (cabinetPlayPhase === 'playing' || cabinetPlayPhase === 'results');
  const displayName = resolveMemberDisplayName(SELF_MEMBER_ID, member.name);

  const resetGameFlow = useCallback((): void => {
    setCabinetMenuPhase('menu');
    setCabinetPlayPhase('mode-select');
  }, []);

  const returnToTitle = useCallback((): void => {
    playArcadeMenuSelectSfx();
    clearArcadeSession();
    setScreenPhase('attract');
    setActiveCabinetId(null);
    setPendingCabinetId(null);
    setSkipCabinetIntro(false);
    setMenuReady(false);
    setSelectedCabinetIndex(0);
    resetGameFlow();
  }, [resetGameFlow]);

  const openCabinetSelect = useCallback(
    (options?: { skipIntro?: boolean }): void => {
      playArcadeMenuSelectSfx();
      setSkipCabinetIntro(Boolean(options?.skipIntro));
      setScreenPhase('cabinet-select');
      setMenuReady(false);
      resetGameFlow();
    },
    [resetGameFlow],
  );

  const startArcadeSession = useCallback((): void => {
    playArcadeMenuSelectSfx();
    clearArcadeSession();
    setActiveCabinetId(null);
    setPendingCabinetId(null);
    setSkipCabinetIntro(false);
    setSelectedCabinetIndex(0);
    resetGameFlow();
    setScreenPhase('cabinet-select');
  }, [resetGameFlow]);

  const activateCabinet = useCallback(
    (cabinet: ArcadeCabinetView, playIntro: boolean): void => {
      if (!canEnterArcadeCabinet(cabinet)) {
        return;
      }

      if (playIntro) {
        setPendingCabinetId(cabinet.id);
        setScreenPhase('cabinet-intro');
        return;
      }

      setActiveCabinetId(cabinet.id);
      setArcadeStageCabinetId(cabinet.id);
      setScreenPhase('cabinet-active');
      resetGameFlow();
    },
    [resetGameFlow],
  );

  const confirmCabinetSelection = useCallback((): void => {
    const cabinet = cabinets[selectedCabinetIndex];

    if (!cabinet || !canEnterArcadeCabinet(cabinet)) {
      return;
    }

    playArcadeMenuSelectSfx();
    activateCabinet(cabinet, !skipCabinetIntro);
    setSkipCabinetIntro(false);
  }, [activateCabinet, cabinets, selectedCabinetIndex, skipCabinetIntro]);

  const handleCabinetIntroComplete = useCallback((): void => {
    if (!pendingCabinetId) {
      setScreenPhase('cabinet-select');
      return;
    }

    setActiveCabinetId(pendingCabinetId);
    setArcadeStageCabinetId(pendingCabinetId);
    setPendingCabinetId(null);
    setScreenPhase('cabinet-active');
    resetGameFlow();
  }, [pendingCabinetId, resetGameFlow]);

  const moveCabinetSelection = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right'): void => {
      if (screenPhase !== 'cabinet-select') {
        return;
      }

      playArcadeMenuSelectSfx();
      setSelectedCabinetIndex((current) => {
        const columns = ARCADE_CABINET_SELECT_COLUMNS;
        const count = cabinets.length;
        let next = current;

        if (direction === 'left') {
          next = current - 1;
        }

        if (direction === 'right') {
          next = current + 1;
        }

        if (direction === 'up') {
          next = current - columns;
        }

        if (direction === 'down') {
          next = current + columns;
        }

        if (next < 0) {
          return count - 1;
        }

        if (next >= count) {
          return 0;
        }

        return next;
      });
    },
    [cabinets.length, screenPhase],
  );

  const launchActiveCabinet = useCallback((): void => {
    if (!canEnterArcadeCabinet(activeCabinet)) {
      return;
    }

    playArcadeMenuSelectSfx();
    setCabinetMenuPhase('play');
    setCabinetPlayPhase('mode-select');
  }, [activeCabinet]);

  useEffect(() => {
    if (screenPhase !== 'cabinet-active') {
      setMenuReady(false);
      return;
    }

    const timer = window.setTimeout(() => setMenuReady(true), 480);

    return () => window.clearTimeout(timer);
  }, [screenPhase, activeCabinetId]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (screenPhase === 'attract') {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          startArcadeSession();
        }

        return;
      }

      if (screenPhase === 'cabinet-select') {
        if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
          event.preventDefault();
          moveCabinetSelection('up');
        }

        if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
          event.preventDefault();
          moveCabinetSelection('down');
        }

        if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
          event.preventDefault();
          moveCabinetSelection('left');
        }

        if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
          event.preventDefault();
          moveCabinetSelection('right');
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          confirmCabinetSelection();
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          returnToTitle();
        }

        return;
      }

      if (screenPhase === 'cabinet-intro') {
        if (event.key === 'Escape') {
          event.preventDefault();
          setPendingCabinetId(null);
          clearArcadeSession();
          setScreenPhase('cabinet-select');
        }

        return;
      }

      if (screenPhase !== 'cabinet-active') {
        return;
      }

      if (cabinetMenuPhase === 'menu') {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          launchActiveCabinet();
        }

        return;
      }

      if (cabinetPlayPhase === 'mode-select') {
        if (event.key === 'Escape') {
          event.preventDefault();
          resetGameFlow();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    cabinetMenuPhase,
    cabinetPlayPhase,
    confirmCabinetSelection,
    launchActiveCabinet,
    moveCabinetSelection,
    resetGameFlow,
    returnToTitle,
    screenPhase,
    startArcadeSession,
  ]);

  function renderExitMenu(): ReactElement {
    return (
      <nav aria-label="Leave arcade" className="arcade-screen-exit-menu">
        <span className="arcade-screen-exit-label">EXIT TO</span>
        <button
          className="arcade-screen-exit-button"
          onClick={() => openCabinetSelect({ skipIntro: true })}
          type="button"
        >
          Change Machine
        </button>
        <button className="arcade-screen-exit-button" onClick={returnToTitle} type="button">
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
    );
  }

  function renderCabinetLobby(cabinet: ArcadeCabinetView): ReactElement {
    return (
      <>
        <header className="arcade-screen-marquee">
          <p className="arcade-screen-marquee-kicker">GoonSquad Cabinet</p>
          <h1 className="arcade-screen-marquee-title">{cabinet.title.toUpperCase()}</h1>
          <p className="arcade-screen-marquee-subtitle">{cabinet.tagline}</p>
        </header>

        <section aria-label="Cabinet lobby" className="arcade-screen-menu panel">
          <div className="arcade-screen-menu-head">
            <span>READY PLAYER</span>
            <span className="arcade-screen-menu-credit">CREDIT 01</span>
          </div>

          <div className="arcade-screen-cabinet-lobby-copy">
            <p>{cabinet.releaseLabel}</p>
            <p>{cabinet.genre}</p>
          </div>

          <footer className="arcade-screen-menu-foot">
            <span>ENTER PLAY</span>
            <span>CHANGE MACHINE</span>
            <span>© GOONIE LABS</span>
          </footer>
        </section>

        <aside
          aria-label={cabinet.title + ' cabinet preview'}
          className="arcade-screen-cabinet-card"
          style={
            {
              '--arcade-cabinet-accent': cabinet.cabinetAccent,
              '--arcade-cabinet-glow': cabinet.cabinetGlow,
            } as CSSProperties
          }
        >
          <div className="arcade-screen-cabinet-top">
            <span className="arcade-screen-cabinet-badge">Tier {cabinet.cabinetTier} Cabinet</span>
            <strong>{cabinet.title}</strong>
            <p>{cabinet.tagline}</p>
          </div>

          <div className="arcade-screen-cabinet-screen">
            <span className="arcade-screen-cabinet-screen-label">HI-SCORE</span>
            <strong>{cabinet.highScoreLabel}</strong>
            <small>{cabinet.releaseLabel}</small>
          </div>

          <div className="arcade-screen-cabinet-controls">
            <button
              className="arcade-screen-play-button"
              onClick={launchActiveCabinet}
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

  const stageCabinetId = useArcadeStageCabinetId();
  const isCabinetStageFit = screenPhase === 'cabinet-active' && stageCabinetId !== null;
  const cabinetStageFit = useMemo(
    () => readArcadeCabinetStageFit(stageCabinetId),
    [stageCabinetId],
  );
  const cabinetStageFitCss = useMemo(
    () => arcadeCabinetStageFitStyle(cabinetStageFit) as CSSProperties,
    [cabinetStageFit],
  );

  const playLobbyMusic =
    screenPhase !== 'cabinet-active' ||
    cabinetMenuPhase !== 'play' ||
    cabinetPlayPhase !== 'playing';
  const duckLobbyMusic = screenPhase === 'cabinet-intro';
  const activeGameId =
    screenPhase === 'cabinet-active' &&
    cabinetMenuPhase === 'play' &&
    cabinetPlayPhase === 'playing'
      ? activeCabinet.gameId
      : null;

  return (
    <>
      <ArcadeAudioControls />
      <ArcadeMusicPlayer
        activeGameId={activeGameId}
        duckLobbyMusic={duckLobbyMusic}
        playLobbyMusic={playLobbyMusic}
      />

      {screenPhase === 'attract' ? (
        <div className="arcade-screen arcade-screen-attract">
          <div className="arcade-screen-attract-stage">
            <h1 className="arcade-screen-attract-title">ARCADE</h1>
            <button
              aria-label="Press start to open the arcade cabinet select"
              className="arcade-press-start-button"
              onClick={startArcadeSession}
              type="button"
            >
              <span className="arcade-press-start-label">PRESS START</span>
            </button>
          </div>
        </div>
      ) : null}

      {screenPhase === 'cabinet-select' ? (
        <ArcadeCabinetSelect
          cabinets={cabinets}
          onConfirmSelection={confirmCabinetSelection}
          onExitToHub={props.onExitToHub}
          onReturnToTitle={returnToTitle}
          onSelectIndex={setSelectedCabinetIndex}
          selectedIndex={selectedCabinetIndex}
        />
      ) : null}

      {screenPhase === 'cabinet-intro' && pendingCabinet ? (
        <ArcadeCabinetIntro
          cabinetId={pendingCabinet.id}
          cabinetTitle={pendingCabinet.title}
          onComplete={handleCabinetIntroComplete}
        />
      ) : null}

      {screenPhase === 'cabinet-active' ? (
        <div
          className={
            'arcade-screen' +
            (isGameActive ? ' is-arcade-game-active' : '') +
            (isCabinetStageFit ? ' is-cabinet-stage-fit' : '') +
            (isCabinetStageFit && cabinetStageFit.hideBezel ? ' is-cabinet-stage-fit-bezelless' : '')
          }
          style={isCabinetStageFit ? cabinetStageFitCss : undefined}
        >
          <div className={'nami-arcade-box' + (isGameActive ? ' is-arcade-game-active' : '')}>
            <div className="nami-arcade-box-bezel">
              <div className="nami-arcade-box-viewport">
                <ArcadeBackgroundMedia cabinetId={activeCabinet.id} />

                {cabinetMenuPhase === 'menu' && !isCabinetStageFit ? (
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
                    (cabinetPlayPhase === 'playing' ? ' is-cabinet-game-playing' : '') +
                    (cabinetPlayPhase === 'results' ? ' is-cabinet-game-results' : '') +
                    (cabinetPlayPhase === 'mode-select' ? ' is-cabinet-game-mode-select' : '')
                  }
                >
                  {cabinetMenuPhase === 'menu' ? renderCabinetLobby(activeCabinet) : null}
                  {cabinetMenuPhase === 'play' ? (
                    <ArcadeCabinetPlaySession
                      cabinet={activeCabinet}
                      displayName={displayName}
                      onBackToMenu={resetGameFlow}
                      onPhaseChange={setCabinetPlayPhase}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}