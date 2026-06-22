import { computeEbitda } from "../engine/GameEngine.js";

export default function ScoreScreen({ state, onRestart, onClose }) {
  if (!state) return null;

  const { kpis, params, day, houses } = state;
  const { ebitda, totalCosts, ebitdaMargin } = computeEbitda(kpis);
  const totalVis = houses.filter(h => h.appearedDay !== null && h.appearedDay <= day).length;
  const equipped = kpis.totalEquipped + kpis.totalCompetitor;
  const ptShare = equipped > 0 ? (kpis.totalEquipped / equipped * 100) : 0;
  const satRate = kpis.deliveryCount > 0
    ? (kpis.satisfiedClients / kpis.deliveryCount * 100)
    : 100;

  const insights = [];

  if (satRate < 70) {
    insights.push({
      icon: "😞", title: "Satisfaction client faible",
      msg: "Les delais de livraison ont impacte la satisfaction. Le service logistique et le Point Service doivent anticiper la demande.",
      service: "Logistique & Service Client",
    });
  } else {
    insights.push({
      icon: "😊", title: "Bonne satisfaction client",
      msg: "Bravo ! La coordination entre production et livraison a bien fonctionne.",
      service: "Toute la chaine",
    });
  }

  if (ptShare < 60) {
    insights.push({
      icon: "📉", title: "Part de marche PT en recul",
      msg: "Le concurrent a capte une part importante du marche. Reactivite commerciale et gestion des distributeurs sont cles.",
      service: "Ventes & Distribution",
    });
  }

  if (kpis.totalCA < 100000) {
    insights.push({
      icon: "💰", title: "CA modeste",
      msg: "Le chiffre d'affaires est en dessous des attentes. Production et prospection a mieux calibrer.",
      service: "Production & Commercial",
    });
  }

  const maintNeeded = houses.filter(h => h.needsMaintenance).length;
  if (maintNeeded > 5) {
    insights.push({
      icon: "🔧", title: "Maintenance negligee",
      msg: maintNeeded + " installations necessitent une maintenance. Le SAV est crucial pour la fidelisation.",
      service: "SAV & Maintenance",
    });
  }

  if (ebitda <= 0) {
    insights.push({
      icon: "🔴", title: "EBITDA négatif",
      msg: "Les coûts (production, logistique, frais fixes) ont dépassé le chiffre d'affaires. Surproduire du stock invendu ou multiplier les trajets pèse directement sur la rentabilité.",
      service: "Production & Logistique",
    });
  } else if (ebitdaMargin < 0.10) {
    insights.push({
      icon: "⚠️", title: "Marge faible",
      msg: "La marge EBITDA est sous les 10%. Mieux vaut produire au plus près de la demande et limiter les trajets pour protéger la rentabilité.",
      service: "Production & Logistique",
    });
  }

  const grade = ebitda > 150000 ? "A+" : ebitda > 100000 ? "A" : ebitda > 60000 ? "B"
    : ebitda > 30000 ? "C" : ebitda > 0 ? "D" : "E";

  return (
    <div className="score-overlay">
      <div className="score-screen">
        <h2>🏆 Resultats - Fin de partie</h2>

        <div className="score-grade">
          <div className="grade-circle">{grade}</div>
          <div className="grade-ebitda">
            <span className="grade-ebitda-label">EBITDA</span>
            <span className="grade-ebitda-value">{Math.round(ebitda).toLocaleString() + " €"}</span>
            <span className="grade-ebitda-margin">{"Marge " + (ebitdaMargin * 100).toFixed(0) + "% du CA"}</span>
          </div>
        </div>

        <div className="score-summary">
          <ScoreRow label="💰 CA total" value={kpis.totalCA.toLocaleString() + " €"} />
          <ScoreRow label="🏭 Coût production" value={"- " + Math.round(kpis.totalCostProduction).toLocaleString() + " €"} />
          <ScoreRow label="🚛 Coût logistique" value={"- " + Math.round(kpis.totalCostLogistics).toLocaleString() + " €"} />
          <ScoreRow label="🔧 Coût maintenance" value={"- " + Math.round(kpis.totalCostMaintenance).toLocaleString() + " €"} />
          <ScoreRow label="🏢 Frais fixes" value={"- " + Math.round(kpis.totalCostFixed).toLocaleString() + " €"} />
          <ScoreRow label="➖ Total coûts" value={"- " + Math.round(totalCosts).toLocaleString() + " €"} />
          <ScoreRow label={"📈 EBITDA (" + (ebitdaMargin * 100).toFixed(0) + "% du CA)"} value={Math.round(ebitda).toLocaleString() + " €"} highlight />
          <ScoreRow label="😊 Satisfaction" value={satRate.toFixed(1) + "%"} />
          <ScoreRow label="📊 Part de marche PT" value={ptShare.toFixed(1) + "%"} />
          <ScoreRow label="🏠 Maisons PT" value={kpis.totalEquipped + " / " + totalVis} />
          <ScoreRow label="🏴 CA concurrent (perdu)" value={(kpis.totalCompetitorCA || 0).toLocaleString() + " €"} />
          <ScoreRow label="⏱️ Delai moyen" value={kpis.avgDeliveryDays.toFixed(1) + " jours"} />
          <ScoreRow label="🔧 Revenus maintenance" value={kpis.totalMaintenanceRevenue.toLocaleString() + " €"} />
        </div>

        <div className="score-insights">
          <h3>💡 Ce que le jeu nous apprend</h3>
          {insights.map((ins, i) => (
            <div key={i} className="insight-card">
              <span className="insight-icon">{ins.icon}</span>
              <div>
                <strong>{ins.title}</strong>
                <p>{ins.msg}</p>
                <span className="insight-service">Service concerne : {ins.service}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="score-actions">
          <button className="btn btn-primary" onClick={onRestart}>🔄 Nouvelle partie</button>
          <button className="btn btn-secondary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ label, value, highlight }) {
  return (
    <div className={"score-item" + (highlight ? " highlight" : "")}>
      <span className="score-label">{label}</span>
      <span className="score-value">{value}</span>
    </div>
  );
}
