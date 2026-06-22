import { computeEbitda } from "../engine/GameEngine.js";

export default function Dashboard({ state }) {
  if (!state) return null;

  const { kpis, factory, houses, params, day } = state;
  const totalVis = houses.filter(h => h.appearedDay !== null && h.appearedDay <= day).length;
  const equipped = kpis.totalEquipped + kpis.totalCompetitor;
  const ptShare = equipped > 0 ? ((kpis.totalEquipped / equipped) * 100).toFixed(1) : "0";
  const satRate = kpis.deliveryCount > 0
    ? ((kpis.satisfiedClients / kpis.deliveryCount) * 100).toFixed(1)
    : "100";
  const { ebitda, ebitdaMargin } = computeEbitda(kpis);
  const ebitdaLabel = "EBITDA (" + (ebitdaMargin * 100).toFixed(0) + "%)";

  return (
    <div className="dashboard">
      <h3>Tableau de bord</h3>
      <div className="kpi-grid">
        <KPI icon={"\u{1F4B0}"} value={kpis.totalCA.toLocaleString() + " \u20ac"} label="CA" />
        <KPI icon={"\u{1F4C8}"} value={Math.round(ebitda).toLocaleString() + " \u20ac"} label={ebitdaLabel} />
        <KPI icon={"\u{1F60A}"} value={satRate + "%"} label="Satisfaction" />
        <KPI icon={"\u{1F4CA}"} value={ptShare + "%"} label="Part marche PT" />
        <KPI icon={"\u23F1"} value={kpis.avgDeliveryDays.toFixed(1) + " j"} label="Delai moyen" />
        <KPI icon={"\u{1F4E6}"} value={factory.totalStock + "/" + params.maxStock} label="Stock" />
        <KPI icon={"\u{1F3E0}"} value={kpis.totalEquipped + " PT / " + kpis.totalCompetitor + " Conc."} label={"Equipees (" + totalVis + ")"} />
        <KPI icon={"\u{1F527}"} value={kpis.totalMaintenanceRevenue.toLocaleString() + " \u20ac"} label="Maintenance" />
      </div>
      {factory.isClosed && (
        <div className="alert alert-danger">
          USINE FERMEE - Reouverture jour {factory.closedUntilDay}
        </div>
      )}
      {state.activeEvents.some(e => e.type === "competitorPriceWar") && (
        <div className="alert alert-warning">
          GUERRE DES PRIX en cours !
        </div>
      )}
    </div>
  );
}

function KPI({ icon, value, label }) {
  return (
    <div className="kpi-card">
      <span className="kpi-icon">{icon}</span>
      <div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  );
}
