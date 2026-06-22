import { useState } from "react";

export default function ProductionPanel({ state, onSetPlan }) {
  const [eco, setEco] = useState(state.weeklyPlan.ecoflo);
  const [epa, setEpa] = useState(state.weeklyPlan.eparco);
  const { factory, params } = state;

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
        <button
          onClick={() => onSetPlan(eco ? 1 : 0, epa ? 1 : 0)}
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
                  Maison #{h.id} - {h.product}
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
    </div>
  );
}
