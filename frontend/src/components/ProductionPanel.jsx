import { useState } from "react";
import { tripDays } from "../engine/GameEngine.js";

export default function ProductionPanel({ state, onSetPlan }) {
  const [eco, setEco] = useState(state.weeklyPlan.ecoflo);
  const [epa, setEpa] = useState(state.weeklyPlan.eparco);
  const [med, setMed] = useState(state.weeklyPlan.media || 0);
  const { factory, params } = state;
  const mediaStock = factory.stock.media || 0;
  const mediaToReplace = state.houses.filter(h => h.needsMediaReplacement && !h.mediaShipping);

  return (
    <div className="production-panel">
      <h3>Production</h3>

      <div className="stock-display">
        <h4>Stock usine ({factory.totalStock}/{params.maxStock})</h4>
        <div className="stock-bar">
          <div className="stock-fill" style={{ width: (factory.totalStock / params.maxStock * 100) + "%" }} />
        </div>
        <div className="stock-detail">
          <span>Ecoflo 4h: {factory.stock.ecoflo4}</span>
          <span>Ecoflo 5h: {factory.stock.ecoflo5}</span>
          <span>Eparco 4h: {factory.stock.eparco4}</span>
          <span>Eparco 5h: {factory.stock.eparco5}</span>
          <span>Milieu filtrant: {mediaStock}</span>
        </div>
      </div>

      <div className="plan-section">
        <h4>Plan de la semaine {state.currentWeekLocked ? "\u{1F512}" : ""}</h4>
        <div className="plan-row">
          <label>
            <input
              type="checkbox"
              checked={eco > 0}
              onChange={e => setEco(e.target.checked ? 1 : 0)}
              disabled={state.currentWeekLocked}
            />
            Ecoflo ({params.ecofloPerDay}/jour)
          </label>
        </div>
        <div className="plan-row">
          <label>
            <input
              type="checkbox"
              checked={epa > 0}
              onChange={e => setEpa(e.target.checked ? 1 : 0)}
              disabled={state.currentWeekLocked}
            />
            Eparco ({params.eparcoPerDay}/jour)
          </label>
        </div>
        <div className="plan-row">
          <label>
            <input
              type="checkbox"
              checked={med > 0}
              onChange={e => setMed(e.target.checked ? 1 : 0)}
              disabled={state.currentWeekLocked}
            />
            Milieu filtrant ({params.mediaPerDay || 2}/jour)
          </label>
        </div>
        <button
          onClick={() => onSetPlan(eco ? 1 : 0, epa ? 1 : 0, med ? 1 : 0)}
          disabled={state.currentWeekLocked}
          className="btn btn-primary"
        >
          {state.currentWeekLocked ? "Plan verrouille cette semaine" : "Valider le plan"}
        </button>
      </div>

      {factory.isClosed && (
        <div className="alert alert-danger">Usine fermee ! Pas de production.</div>
      )}

      <div className="orders-pending">
        <h4>Commandes en attente</h4>
        {state.houses.filter(h => h.status === "ordered").length === 0
          ? <p className="text-muted">Aucune commande</p>
          : (
            <ul>
              {state.houses.filter(h => h.status === "ordered").map(h => (
                <li key={h.id} className="order-item">
                  Maison #{h.id} - {h.product} · 🚛 {tripDays(params, state.factory, h)}j
                  {factory.stock[h.product] > 0
                    ? <button className="btn btn-sm btn-ship" onClick={() => onSetPlan("ship", h.id)}>
                        Expedier
                      </button>
                    : <span className="text-danger"> (pas en stock)</span>
                  }
                </li>
              ))}
            </ul>
          )
        }
      </div>

      {mediaToReplace.length > 0 && (
        <div className="orders-pending">
          <h4>🔄 Milieux filtrants a remplacer</h4>
          <ul>
            {mediaToReplace.map(h => {
              const daysLeft = (params.mediaReplacementMaxDays || 90) - (state.day - (h.mediaDueDay || state.day));
              return (
                <li key={h.id} className="order-item">
                  Maison #{h.id} ({daysLeft}j restants)
                  {mediaStock > 0
                    ? <button className="btn btn-sm btn-ship" onClick={() => onSetPlan("shipMedia", h.id)}>
                        Expedier
                      </button>
                    : <span className="text-danger"> (pas en stock)</span>
                  }
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
