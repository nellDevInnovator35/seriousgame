import { useState } from "react";
import { computeEbitda } from "../engine/GameEngine.js";
import { gameApi } from "../api/gameApi.js";
import EvolutionCharts from "./EvolutionCharts.jsx";
import { DIFFICULTIES } from "../config/difficulties.js";
import { QUEST_DEFS } from "../config/quests.js";

export default function ScoreScreen({ state, onRestart, onClose }) {
  const [showDebrief, setShowDebrief] = useState(false);
  const [pseudo, setPseudo] = useState("");
  const [published, setPublished] = useState(null);
  const [publishError, setPublishError] = useState(false);
  if (!state) return null;

  const publishScore = async () => {
    setPublishError(false);
    const r = await gameApi.publishScore({
      name: pseudo,
      difficulty: state.params.difficulty,
      seed: state.seed,
      kpis: state.kpis,
    });
    if (r?.success) setPublished(r);
    else setPublishError(true);
  };

  const { kpis, params, day, houses } = state;
  const { ebitda, totalCosts, ebitdaMargin } = computeEbitda(kpis);
  const totalVis = houses.filter(h => h.appearedDay !== null && h.appearedDay <= day).length;
  const equipped = kpis.totalEquipped + kpis.totalCompetitor;
  const ptShare = equipped > 0 ? (kpis.totalEquipped / equipped * 100) : 0;
  const satRate = kpis.deliveryCount > 0
    ? (kpis.satisfiedClients / kpis.deliveryCount * 100)
    : 100;

  const quests = state.quests || [];
  const qDone = quests.filter(q => q.status === "completed");
  const qFailed = quests.filter(q => q.status === "failed");

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

  if ((kpis.maintenanceLostContracts || 0) > 0) {
    insights.push({
      icon: "🔧", title: "Contrats resilies (maintenance)",
      msg: kpis.maintenanceLostContracts + " client(s) ont resilie leur contrat car la visite de maintenance n'a jamais ete faite. Chaque contrat perdu, c'est du revenu recurrent envole.",
      service: "SAV & Maintenance",
    });
  }

  if (quests.length > 0 && qFailed.length > qDone.length) {
    insights.push({
      icon: "🎯", title: "Objectifs manques",
      msg: qFailed.length + " objectif(s) manque(s) sur " + quests.length + ". Les objectifs structurent les priorites : les relire en debut de partie aide a arbitrer.",
      service: "Pilotage",
    });
  }

  if ((kpis.mediaLostContracts || 0) > 0) {
    insights.push({
      icon: "🔄", title: "Milieux filtrants negliges",
      msg: (kpis.mediaLostContracts) + " contrat(s) de maintenance perdu(s) faute de remplacement du milieu filtrant a temps. Le suivi du parc installe est un revenu recurrent a proteger.",
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

  const diff = DIFFICULTIES[params.difficulty];

  // --- Mode debrief animateur : observations dynamiques + questions par service ---
  const ptCount = houses.filter(h => h.channel === "pointService").length;
  const distCount = houses.filter(h => h.channel === "distributor").length;
  const eur = v => Math.round(v).toLocaleString() + " €";
  const dominantCost = [
    ["la production", kpis.totalCostProduction],
    ["la logistique", kpis.totalCostLogistics],
    ["la maintenance", kpis.totalCostMaintenance],
    ["les frais fixes", kpis.totalCostFixed],
  ].sort((a, b) => b[1] - a[1])[0][0];

  const debrief = [
    {
      icon: "💶", theme: "Rentabilité (Finance)",
      obs: ebitda <= 0
        ? "EBITDA négatif (" + eur(ebitda) + ") : les coûts ont dépassé le CA, surtout " + dominantCost + "."
        : "EBITDA de " + eur(ebitda) + " (" + (ebitdaMargin * 100).toFixed(0) + "% du CA). Premier poste de coût : " + dominantCost + ".",
      q: "Quels leviers concrets pour améliorer la marge sans perdre de clients ?",
    },
    {
      icon: "🏭", theme: "Production & stock",
      obs: "Coût de production cumulé : " + eur(kpis.totalCostProduction) + ".",
      q: "La production était-elle calée sur la demande, ou a-t-on fabriqué du stock invendu ?",
    },
    {
      icon: "🚛", theme: "Logistique & délais",
      obs: "Délai moyen de " + kpis.avgDeliveryDays.toFixed(1) + " j (seuil " + params.maxDeliveryDays + " j) pour une satisfaction de " + satRate.toFixed(0) + "%.",
      q: "Comment fiabiliser les délais et éviter les avis négatifs en chaîne ?",
    },
    {
      icon: "🛒", theme: "Ventes & circuits",
      obs: "Répartition : " + ptCount + " Point Service vs " + distCount + " distributeur. Part de marché PT : " + ptShare.toFixed(0) + "%.",
      q: "L'arbitrage Point Service (marge) / distributeur (volume + fidélité) était-il le bon ?",
    },
    {
      icon: "🏴", theme: "Concurrence",
      obs: "Le concurrent a capté " + kpis.totalCompetitor + " maisons, soit " + eur(kpis.totalCompetitorCA || 0) + " de CA perdu.",
      q: "Comment mieux défendre les zones attaquées (guerre des prix) et garder les distributeurs ?",
    },
    {
      icon: "🔧", theme: "Maintenance & fidélisation",
      obs: "Revenus de maintenance : " + eur(kpis.totalMaintenanceRevenue) + " (revenu récurrent).",
      q: "La maintenance est-elle exploitée comme un revenu récurrent et un lien client durable ?",
    },
    {
      icon: "🔄", theme: "Cycle de vie & milieux filtrants",
      obs: (kpis.mediaReplacedCount || 0) + " milieu(x) filtrant(s) remplacé(s) pour " + eur(kpis.totalMediaRevenue || 0)
        + ((kpis.mediaLostContracts || 0) > 0 ? " — " + kpis.mediaLostContracts + " contrat(s) perdu(s) faute de remplacement." : "."),
      q: "Le parc installé en début de partie a-t-il été anticipé comme un marché de renouvellement (aftermarket) ?",
    },
  ];

  return (
    <div className="score-overlay">
      <div className="score-screen">
        <h2>🏆 Resultats - Fin de partie</h2>
        {diff && <div className="score-difficulty">Niveau : {diff.icon} {diff.label}</div>}

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
          <ScoreRow label="🔄 Milieux filtrants remplaces" value={(kpis.mediaReplacedCount || 0) + " (" + (kpis.totalMediaRevenue || 0).toLocaleString() + " €)"} />
          {quests.length > 0 && (
            <ScoreRow label="🎯 Objectifs reussis" value={qDone.length + "/" + quests.length + " (+" + (kpis.totalQuestRevenue || 0).toLocaleString() + " € de primes)"} />
          )}
          {state.seed != null && (
            <ScoreRow label="🎲 Seed de la partie" value={String(state.seed)} />
          )}
        </div>

        {quests.length > 0 && (
          <div className="score-quests">
            <h3>🎯 Objectifs de la partie</h3>
            {quests.map(q => {
              const def = QUEST_DEFS[q.id];
              if (!def) return null;
              const st = q.status === "completed" ? "✅" : q.status === "failed" ? "❌" : "⏳";
              return (
                <div key={q.id} className="score-item">
                  <span className="score-label">{st} {def.title} {"⭐".repeat(def.stars)}</span>
                  <span className="score-value">{def.desc}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="score-charts">
          <h3>📊 Evolution de la partie</h3>
          <EvolutionCharts history={state.history} />
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

        <div className={"score-debrief" + (showDebrief ? " open" : "")}>
          <h3>🎓 Mode débrief animateur</h3>
          <p className="text-muted">Points de discussion à dérouler avec l'équipe, par service.</p>
          {debrief.map((d, i) => (
            <div key={i} className="debrief-card">
              <div className="debrief-theme">{d.icon} {d.theme}</div>
              <p className="debrief-obs">{d.obs}</p>
              <p className="debrief-q">❓ {d.q}</p>
            </div>
          ))}
        </div>

        <div className="score-publish">
          {published ? (
            <p className="publish-ok">
              ✅ Score publié ! Rang <strong>#{published.rank}</strong> en {diff ? diff.label : "Normal"}.
            </p>
          ) : (
            <>
              <input
                className="save-input"
                value={pseudo}
                onChange={e => setPseudo(e.target.value)}
                placeholder="Ton prénom / pseudo"
                maxLength={30}
              />
              <button
                className="btn btn-primary"
                disabled={!pseudo.trim()}
                onClick={publishScore}
              >
                🏆 Publier mon score
              </button>
              {publishError && <p className="text-danger">Publication impossible (backend inaccessible ?)</p>}
            </>
          )}
        </div>

        <div className="score-actions">
          <button className="btn btn-primary" onClick={onRestart}>🔄 Nouvelle partie</button>
          <button className="btn btn-secondary" onClick={() => setShowDebrief(v => !v)}>
            🎓 {showDebrief ? "Masquer le débrief" : "Mode débrief animateur"}
          </button>
          <button className="btn btn-secondary" onClick={() => window.print()}>🖨️ Exporter en PDF</button>
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
