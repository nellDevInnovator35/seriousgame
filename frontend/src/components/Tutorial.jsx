import { useState } from "react";

const STEPS = [
  {
    icon: "👋",
    title: "Bienvenue chez SmartCity ANC",
    text: "Tu gères toute la chaîne de l'assainissement non collectif sur 2 communes pendant 11 ans. Objectif : un EBITDA (CA − coûts) maximal, sans perdre tes clients face au concurrent. Une partie dure 5 à 15 minutes.",
  },
  {
    icon: "🟡",
    title: "Les maisons à équiper",
    text: "Les maisons en jaune ont besoin d'une installation ANC. Clique dessus pour proposer un devis. De nouvelles demandes apparaissent au fil des mois — il y a donc toujours du travail.",
  },
  {
    icon: "🛒",
    title: "Choisir le circuit de vente",
    text: "Pour chaque maison, tu arbitres : Point Service (Eparco, 2000 €, plus de marge mais plus lent) ou Distributeur (Ecoflo, 1000 €, rapide et fidélise le distributeur). Les deux incluent la maintenance.",
  },
  {
    icon: "🏭",
    title: "Produire et expédier",
    text: "Planifie la production de la semaine (Ecoflo/Eparco) dans le panneau Production, puis expédie les commandes. Attention : surproduire un produit invendu sature le stock (max 100) et plombe l'EBITDA.",
  },
  {
    icon: "⏱️",
    title: "Le temps et les délais",
    text: "Lance le temps (Play) et règle la vitesse (x1 à x3). Si une installation dépasse 20 jours, le client laisse un avis négatif et 5 voisins partent au concurrent. Anticipe !",
  },
  {
    icon: "⚠️",
    title: "Gérer les imprévus",
    text: "Fuites (à réparer sous 2 jours), fermeture d'usine, et guerre des prix où le concurrent attaque la zone d'un distributeur (≈30 maisons, surlignée en rouge). Réagis vite pour limiter la casse.",
  },
  {
    icon: "📖",
    title: "Comprendre les métiers",
    text: "Clique sur l'usine, le Point Service ou un distributeur — ou sur le bouton 📖 — pour découvrir le vrai métier correspondant chez Premier Tech. À la fin, des courbes d'évolution facilitent le débrief.",
  },
];

export default function Tutorial({ onClose }) {
  const [i, setI] = useState(0);
  const [dontShow, setDontShow] = useState(false);
  const last = i === STEPS.length - 1;
  const s = STEPS[i];

  const finish = () => {
    if (dontShow) { try { localStorage.setItem("anc_tuto_done", "1"); } catch { /* ignore */ } }
    onClose();
  };

  return (
    <div className="tuto-overlay">
      <div className="tuto-card">
        <div className="tuto-icon">{s.icon}</div>
        <h2>{s.title}</h2>
        <p>{s.text}</p>

        <div className="tuto-dots">
          {STEPS.map((_, k) => (
            <span key={k} className={"tuto-dot" + (k === i ? " active" : "")} />
          ))}
        </div>

        <div className="tuto-actions">
          <button className="btn btn-ghost" onClick={finish}>Passer</button>
          <div className="tuto-nav">
            {i > 0 && (
              <button className="btn btn-secondary" onClick={() => setI(i - 1)}>← Précédent</button>
            )}
            {!last
              ? <button className="btn btn-primary" onClick={() => setI(i + 1)}>Suivant →</button>
              : <button className="btn btn-primary" onClick={finish}>Commencer 🎮</button>}
          </div>
        </div>

        <label className="tuto-dontshow">
          <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} />
          Ne plus afficher au lancement
        </label>
      </div>
    </div>
  );
}
