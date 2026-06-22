export default function DevisPanel({ state, houseId, onConfirm, onClose, onResolveLeak, onMaintenance, onShip }) {
  const house = state.houses.find(h => h.id === houseId);
  if (!house) return null;

  const statusLabels = {
    none: "Pas encore apparue",
    needsANC: "🟡 Besoin d'installation ANC",
    devisSent: "🟠 Devis envoye (en attente)",
    ordered: "🔴 Commande (a produire/expedier)",
    shipping: "🟣 En cours de livraison",
    installing: "🔵 Installation en cours",
    installed: "🟢 Installe",
  };

  return (
    <div className="devis-panel">
      <div className="devis-header">
        <h3>🏠 Maison #{house.id}</h3>
        <button className="btn-close" onClick={onClose}>X</button>
      </div>

      <div className="devis-info">
        <p><strong>Commune :</strong> {house.commune}</p>
        <p><strong>Habitants :</strong> {house.inhabitants}</p>
        <p><strong>Terrain :</strong> {house.terrain === "trees" ? "🌳 Arbore" : house.terrain === "slope" ? "⛰️ Pente" : "🌿 Plat"}</p>
        <p><strong>Statut :</strong> {house.channel === "competitor" ? "❌ Concurrent" : statusLabels[house.status] || house.status}</p>
        {house.satisfaction < 1 && <p className="text-danger"><strong>⚠️ Client insatisfait</strong></p>}
      </div>

      {house.hasLeak && (
        <div className="alert alert-danger">
          <p><strong>💧 FUITE DETECTEE !</strong></p>
          <p>Intervention necessaire sous {state.params.eventLeakMaxDays} jours</p>
          <button className="btn btn-danger" onClick={() => onResolveLeak(house.id)}>
            🔧 Intervenir maintenant
          </button>
        </div>
      )}

      {house.needsMaintenance && (
        <div className="alert alert-warning">
          <p><strong>🔧 Maintenance requise</strong> (visite bisannuelle)</p>
          <button className="btn btn-warning" onClick={() => onMaintenance(house.id)}>
            ✅ Effectuer la maintenance
          </button>
        </div>
      )}

      {house.status === "needsANC" && !house.channel && (
        <div className="devis-actions">
          {state.showDevis?.terrainIssue ? (
            <div className="alert alert-warning">
              <p><strong>⚠️ Terrain problematique</strong></p>
              <p>Sol inadapte a l'epandage : la fosse Eparco (Point Service) ne passe pas. Seul l'Ecoflo (filtre compact) convient ici.</p>
              <button className="btn btn-primary devis-option" onClick={() => onConfirm(house.id, "distributor")}>
                <span className="devis-option-title">📦 Distributeur — Ecoflo {house.inhabitants}h</span>
                <span className="devis-option-price">{state.params.priceEcofloSale}€</span>
              </button>
            </div>
          ) : (
            <div>
              <p className="devis-choice-title">Choisissez le circuit de vente :</p>
              <div className="devis-choice">
                <button className="btn btn-primary devis-option" onClick={() => onConfirm(house.id, "pointService")}>
                  <span className="devis-option-title">🏪 Point Service — Eparco {house.inhabitants}h</span>
                  <span className="devis-option-price">{state.params.priceEparcoInstall}€</span>
                  <span className="devis-option-note">+ Marge la plus elevee · 🔧 contrat de maintenance inclus ({state.params.priceMaintenanceYear}€/an) · ⏱ delai devis {state.params.devisToSaleDays}j, pose limitee a {state.params.installsPerDay}/jour</span>
                </button>

                {state.showDevis?.distributorAvailable ? (
                  <button className="btn btn-secondary devis-option" onClick={() => onConfirm(house.id, "distributor")}>
                    <span className="devis-option-title">📦 Distributeur — Ecoflo {house.inhabitants}h</span>
                    <span className="devis-option-price">{state.params.priceEcofloSale}€</span>
                    <span className="devis-option-note">+ Rapide (sans delai devis) · fidelise le distributeur · maintenance incluse · − marge plus faible</span>
                  </button>
                ) : (
                  <p className="text-muted">📦 Aucun distributeur a portee : seul le Point Service est possible ici.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {house.status === "ordered" && (
        <div className="devis-actions">
          {state.factory.stock[house.product] > 0
            ? <button className="btn btn-success" onClick={() => onShip(house.id)}>
                🚛 Expedier {house.product} (stock: {state.factory.stock[house.product]})
              </button>
            : <p className="text-danger">📦 Pas de {house.product} en stock ! Planifiez la production.</p>
          }
        </div>
      )}
    </div>
  );
}
