import { useState, useEffect } from "react";
import { gameApi } from "../api/gameApi.js";
import { DIFFICULTIES, DIFFICULTY_ORDER } from "../config/difficulties.js";

// Classement des parties publiees. Filtrable par difficulte et par seed :
// avec un seed impose ("challenge"), tout le monde joue la meme partie
// et le classement ne mesure que les decisions des joueurs.
export default function Leaderboard({ onClose }) {
  const [difficulty, setDifficulty] = useState("");
  const [seed, setSeed] = useState("");
  const [scores, setScores] = useState(null);

  useEffect(() => {
    let alive = true;
    gameApi.getScores({ difficulty, seed: seed.trim() || undefined })
      .then(s => { if (alive) setScores(s); });
    return () => { alive = false; };
  }, [difficulty, seed]);

  const eur = v => Math.round(v).toLocaleString() + " €";

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={e => e.stopPropagation()}>
        <div className="admin-header">
          <h2>🏆 Classement</h2>
          <button className="btn-close" onClick={onClose}>X</button>
        </div>

        <div className="lb-filters">
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="">Toutes difficultés</option>
            {DIFFICULTY_ORDER.map(id => (
              <option key={id} value={id}>{DIFFICULTIES[id].icon} {DIFFICULTIES[id].label}</option>
            ))}
          </select>
          <input
            value={seed}
            onChange={e => setSeed(e.target.value)}
            placeholder="Filtrer par seed (challenge)"
          />
        </div>

        <div className="admin-content">
          {scores === null && <p className="text-muted">Chargement…</p>}
          {scores !== null && scores.length === 0 && (
            <p className="text-muted">
              Aucun score publié{difficulty || seed ? " pour ces filtres" : ""}.
              Terminez une partie et cliquez « Publier mon score » !
            </p>
          )}
          {scores !== null && scores.length > 0 && (
            <table className="lb-table">
              <thead>
                <tr>
                  <th>#</th><th>Pseudo</th><th>EBITDA</th><th>Note</th>
                  <th>Satisf.</th><th>Part PT</th><th>Niveau</th><th>Seed</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((sc, i) => (
                  <tr key={sc.id} className={i === 0 ? "lb-first" : ""}>
                    <td>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
                    <td>{sc.name}</td>
                    <td className="lb-ebitda">{eur(sc.ebitda)}</td>
                    <td>{sc.grade}</td>
                    <td>{sc.satisfaction}%</td>
                    <td>{sc.pt_share}%</td>
                    <td>{DIFFICULTIES[sc.difficulty]?.icon || ""} {DIFFICULTIES[sc.difficulty]?.label || sc.difficulty}</td>
                    <td className="lb-seed">{sc.seed}</td>
                    <td>{new Date(sc.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="admin-footer">
          <button className="btn btn-secondary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
