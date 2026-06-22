import { FICHES, FICHE_ORDER } from "../config/fichesMetier.js";

// Affiche soit le menu des fiches (poste === "menu"), soit une fiche precise.
export default function FicheMetier({ poste, onSelect, onClose }) {
  if (!poste) return null;

  if (poste === "menu") {
    return (
      <div className="fiche-overlay" onClick={onClose}>
        <div className="fiche-panel" onClick={(e) => e.stopPropagation()}>
          <div className="fiche-header">
            <h2>📖 Fiches métier</h2>
            <button className="btn-close" onClick={onClose}>X</button>
          </div>
          <p className="text-muted">Découvre le vrai rôle de chaque poste chez Premier Tech.</p>
          <div className="fiche-menu">
            {FICHE_ORDER.map((id) => (
              <button key={id} className="btn btn-secondary fiche-menu-item" onClick={() => onSelect(id)}>
                <span className="fiche-menu-icon">{FICHES[id].icon}</span>
                {FICHES[id].titre}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const f = FICHES[poste];
  if (!f) return null;

  return (
    <div className="fiche-overlay" onClick={onClose}>
      <div className="fiche-panel" onClick={(e) => e.stopPropagation()}>
        <div className="fiche-header">
          <h2>{f.icon} {f.titre}</h2>
          <button className="btn-close" onClick={onClose}>X</button>
        </div>

        <div className="fiche-section">
          <h3>🎮 Dans le jeu</h3>
          <p>{f.dansLeJeu}</p>
        </div>

        <div className="fiche-section">
          <h3>🏢 Le vrai métier chez Premier Tech</h3>
          <p>{f.metierPT}</p>
        </div>

        <div className="fiche-section">
          <h3>✅ Missions clés</h3>
          <ul>
            {f.missions.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>

        <div className="fiche-tip">💡 {f.cle}</div>

        <div className="fiche-footer">
          <button className="btn btn-secondary" onClick={() => onSelect("menu")}>← Toutes les fiches</button>
          <button className="btn btn-primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
