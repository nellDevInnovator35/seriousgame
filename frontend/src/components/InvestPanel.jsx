import { computeEbitda, investConfig } from "../engine/GameEngine.js";

export default function InvestPanel({ state, onInvest, onStartPlacePS, onClose }) {
  if (!state) return null;
  const p = state.params;
  const inv = state.investments || { pointServices: 0, trucks: 0, factoryUpgrades: 0 };
  const cfg = investConfig(p);
  const { ebitda } = computeEbitda(state.kpis);
  const eur = v => Math.round(v).toLocaleString() + " €";

  const options = [
    {
      type: "pointService", icon: "🏪", title: "2ᵉ Point Service",
      price: p.pricePointService, count: inv.pointServices, max: p.maxPointServices,
      effet: "+" + p.installsPerDay + " installation/jour pour les maisons dont il est le PS le plus proche. Placez-le là où est la demande : mal placé, il ne sert à rien !",
      action: onStartPlacePS, cta: "Acheter & placer",
    },
    {
      type: "truck", icon: "🚛", title: "Camion supplémentaire",
      price: p.priceTruck, count: inv.trucks, max: p.maxTrucks,
      effet: "+" + p.truckCapacityBonus + " expéditions/jour (capacité logistique).",
      action: () => onInvest("truck"), cta: "Acheter",
    },
    {
      type: "factory", icon: "🏭", title: "Agrandir l'usine",
      price: p.priceFactoryUpgrade, count: inv.factoryUpgrades, max: p.maxFactoryUpgrades,
      effet: "+1 Ecoflo & +1 Eparco/jour, +" + (p.factoryUpgradeStock || 50) + " de stock max.",
      action: () => onInvest("factory"), cta: "Acheter",
    },
  ];

  return (
    <div className="invest-overlay" onClick={onClose}>
      <div className="invest-panel" onClick={e => e.stopPropagation()}>
        <div className="invest-header">
          <h2>🏗️ Investir</h2>
          <button className="btn-close" onClick={onClose}>X</button>
        </div>
        <p className="text-muted">
          Chaque investissement (CAPEX) est déduit de l'EBITDA : il doit être rentabilisé.
          EBITDA actuel : <strong>{eur(ebitda)}</strong>.
        </p>

        <div className="invest-list">
          {options.map(o => {
            const full = o.count >= o.max;
            return (
              <div key={o.type} className="invest-card">
                <div className="invest-card-head">
                  <span className="invest-icon">{o.icon}</span>
                  <div>
                    <div className="invest-title">{o.title}</div>
                    <div className="invest-count">{o.count} / {o.max} acheté{o.count > 1 ? "s" : ""}</div>
                  </div>
                  <div className="invest-price">{eur(o.price)}</div>
                </div>
                <p className="invest-effet">{o.effet}</p>
                <button
                  className="btn btn-primary invest-buy"
                  disabled={full}
                  onClick={() => { if (!full) o.action(); }}
                >
                  {full ? "Maximum atteint" : o.cta}
                </button>
              </div>
            );
          })}
        </div>

        <div className="invest-footer">
          <button className="btn btn-secondary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
