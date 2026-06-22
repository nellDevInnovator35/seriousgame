import { useState, useEffect, useCallback, useRef } from "react";
import { DEFAULT_PARAMS } from "./config/defaultParams.js";
import {
  createInitialState, advanceDay, sendDevis, confirmDevis,
  setWeeklyPlan, shipProduct, resolveLeak, performMaintenance,
  processDevisPending,
} from "./engine/GameEngine.js";
import { gameApi } from "./api/gameApi.js";
import GameMap from "./components/GameMap.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ProductionPanel from "./components/ProductionPanel.jsx";
import DevisPanel from "./components/DevisPanel.jsx";
import TimeControl from "./components/TimeControl.jsx";
import EventPopup from "./components/EventPopup.jsx";
import ScoreScreen from "./components/ScoreScreen.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import FicheMetier from "./components/FicheMetier.jsx";
import Tutorial from "./components/Tutorial.jsx";
import "./App.css";

export default function App() {
  const [state, setState] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [saveName, setSaveName] = useState("Partie 1");
  const [showMenu, setShowMenu] = useState(true);
  const [saves, setSaves] = useState([]);
  const [showFiche, setShowFiche] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const loopRef = useRef(null);

  // Charger sauvegardes et params au demarrage
  useEffect(() => {
    gameApi.list().then(setSaves).catch(() => {});
    gameApi.getParams().then(p => { if (p) setParams(p); }).catch(() => {});
  }, []);

  // === BOUCLE DE JEU ===
  useEffect(() => {
    if (state?.isRunning && !state?.gameOver) {
      // 11 ans = 2860 ticks. Base 315ms => partie complete ~15 min (x1),
      // ~7,5 min (x2), ~5 min (x3). Cible : une partie dure 5 a 15 min.
      const ms = Math.max(50, 315 / (state.speed || 1));
      loopRef.current = setInterval(() => {
        setState(prev => {
          if (!prev || !prev.isRunning || prev.gameOver) return prev;
          let next = advanceDay(prev);
          next = processDevisPending(next);
          // Si un evenement doit etre affiche, on pause le jeu
          if (next.showEvent) {
            next.isRunning = false;
          }
          return next;
        });
      }, ms);
      return () => clearInterval(loopRef.current);
    }
  }, [state?.isRunning, state?.speed, state?.gameOver]);

  // === ACTIONS MENU ===
  const handleNewGame = () => {
    const newState = createInitialState(params);
    setState(newState);
    setShowMenu(false);
    let done = false;
    try { done = localStorage.getItem("anc_tuto_done") === "1"; } catch { /* ignore */ }
    setShowTutorial(!done);
  };

  const handleLoad = async (name) => {
    const loaded = await gameApi.load(name);
    if (loaded) {
      setState(loaded);
      setShowMenu(false);
      setSaveName(name);
    }
  };

  const handleSave = async () => {
    if (state) {
      await gameApi.save(saveName, state);
      const updatedSaves = await gameApi.list();
      setSaves(updatedSaves);
    }
  };

  // === CONTROLES DU TEMPS ===
  const togglePlay = () => {
    setState(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const setSpeed = (speed) => {
    setState(prev => ({ ...prev, speed }));
  };

  const stopGame = () => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      gameOver: true,
      showScore: true,
    }));
  };

  // === ACTIONS JOUEUR ===
  const handleHouseClick = useCallback((houseId) => {
    setState(prev => sendDevis(prev, houseId));
    setSelectedHouse(houseId);
  }, []);

  const handleConfirmDevis = (houseId, channel) => {
    setState(prev => confirmDevis(prev, houseId, channel));
  };

  const handleSetPlan = (actionOrEcoflo, eparcoOrHouseId) => {
    if (actionOrEcoflo === "ship") {
      // Expedier un produit
      setState(prev => shipProduct(prev, eparcoOrHouseId));
    } else {
      // Planifier la production
      setState(prev => setWeeklyPlan(prev, actionOrEcoflo, eparcoOrHouseId));
    }
  };

  const handleResolveLeak = (houseId) => {
    setState(prev => resolveLeak(prev, houseId));
  };

  const handleMaintenance = (houseId) => {
    setState(prev => performMaintenance(prev, houseId));
  };

  const handleShip = (houseId) => {
    setState(prev => shipProduct(prev, houseId));
  };

  const handleDismissEvent = () => {
    setState(prev => ({ ...prev, showEvent: null }));
  };

  const handleSaveParams = (newParams) => {
    setParams(newParams);
    gameApi.saveParams(newParams).catch(() => {});
    setShowAdmin(false);
  };

  const handleRestart = () => {
    setState(null);
    setShowMenu(true);
    setSelectedHouse(null);
  };

  // ============================================
  // ECRAN MENU PRINCIPAL
  // ============================================
  if (showMenu) {
    return (
      <div className="menu-screen">
        <div className="menu-content">
          <h1>{"\u{1F3D8}"} SmartCity ANC</h1>
          <h2>Serious Game - Premier Tech Eau</h2>
          <p className="menu-subtitle">
            Gerez la chaine complete de l'assainissement non collectif
          </p>

          <div className="menu-actions">
            <button className="btn btn-primary btn-large" onClick={handleNewGame}>
              {"\u{1F3AE}"} Nouvelle partie
            </button>

            {saves.length > 0 && (
              <div className="saves-list">
                <h3>Parties sauvegardees</h3>
                {saves.map(s => (
                  <button
                    key={s.id}
                    className="btn btn-secondary"
                    onClick={() => handleLoad(s.name)}
                  >
                    {s.name}
                    <span className="save-date">
                      {new Date(s.updated_at).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <button className="btn btn-admin" onClick={() => setShowAdmin(true)}>
              {"\u2699"} Administration
            </button>
          </div>
        </div>

        {showAdmin && (
          <AdminPanel
            params={params}
            onSave={handleSaveParams}
            onClose={() => setShowAdmin(false)}
          />
        )}
      </div>
    );
  }

  // ============================================
  // ECRAN DE JEU PRINCIPAL
  // ============================================
  return (
    <div className="game-screen">
      {/* === BARRE DU HAUT === */}
      <header className="game-header">
        <div className="header-left">
          <h1>{"\u{1F3D8}"} SmartCity ANC</h1>
        </div>

        <TimeControl
          state={state}
          onTogglePlay={togglePlay}
          onSetSpeed={setSpeed}
          onStopGame={stopGame}
        />

        <div className="header-right">
          <input
            className="save-input"
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            placeholder="Nom de la partie"
          />
          <button className="btn btn-sm" onClick={() => setShowTutorial(true)} title="Tutoriel">
            {"?"}
          </button>
          <button className="btn btn-sm" onClick={() => setShowFiche("menu")} title="Fiches métier">
            {"\u{1F4D6}"}
          </button>
          <button className="btn btn-sm" onClick={handleSave} title="Sauvegarder">
            {"\u{1F4BE}"}
          </button>
          <button className="btn btn-sm" onClick={() => setShowAdmin(true)} title="Admin">
            {"\u2699"}
          </button>
          <button className="btn btn-sm" onClick={handleRestart} title="Menu">
            {"\u{1F3E0}"}
          </button>
        </div>
      </header>

      {/* === ZONE DE JEU === */}
      <div className="game-content">
        {/* Carte isometrique */}
        <div className="game-left">
          <GameMap
            state={state}
            onHouseClick={handleHouseClick}
            onBuildingClick={setShowFiche}
            selectedHouse={selectedHouse}
          />
        </div>

        {/* Panneau lateral droit */}
        <div className="game-right">
          <Dashboard state={state} />
          <ProductionPanel state={state} onSetPlan={handleSetPlan} />
        </div>
      </div>

      {/* === PANNEAU DEVIS (bas de l'ecran) === */}
      {selectedHouse !== null && (
        <DevisPanel
          state={state}
          houseId={selectedHouse}
          onConfirm={handleConfirmDevis}
          onClose={() => {
            setSelectedHouse(null);
            setState(prev => ({ ...prev, showDevis: null }));
          }}
          onResolveLeak={handleResolveLeak}
          onMaintenance={handleMaintenance}
          onShip={handleShip}
        />
      )}

      {/* === POPUP EVENEMENT === */}
      <EventPopup
        event={state?.showEvent}
        onClose={handleDismissEvent}
      />

      {/* === ECRAN DE SCORE === */}
      {state?.showScore && (
        <ScoreScreen
          state={state}
          onRestart={handleRestart}
          onClose={() => setState(prev => ({ ...prev, showScore: false }))}
        />
      )}

      {/* === TUTORIEL === */}
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}

      {/* === FICHES METIER === */}
      <FicheMetier
        poste={showFiche}
        onSelect={setShowFiche}
        onClose={() => setShowFiche(null)}
      />

      {/* === ADMIN PANEL === */}
      {showAdmin && (
        <AdminPanel
          params={state?.params || params}
          onSave={handleSaveParams}
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  );
}
