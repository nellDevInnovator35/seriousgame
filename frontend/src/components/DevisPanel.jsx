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

  const isInDistributorZone = state.showDevis?.channel === "distributor";

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
              <p><strong>⚠️ Terrain problematique !</strong></p>
              <p>Surface trop petite ou trop d'arbres. Installation Point Service impossible.</p>
              <button className="btn btn-primary" onClick={() => onConfirm(house.id, "distributor")}>
                📦 Passer par un distributeur (Ecoflo) - {state.params.priceEcofloSale}€
              </button>
            </div>
          ) : isInDistributorZone ? (
            <div>
              <p>📍 Cette maison est dans la zone d'un distributeur.</p>
              <button className="btn btn-primary" onClick={() => onConfirm(house.id, "distributor")}>
                📦 Vente via distributeur - Ecoflo {house.inhabitants}h ({state.params.priceEcofloSale}€)
              </button>
            </div>
          ) : (
            <div>
              <button className="btn btn-primary" onClick={() => onConfirm(house.id, "pointService")}>
                🏪 Devis Point Service - Eparco {house.inhabitants}h ({state.params.priceEparcoInstall}€)
              </button>
              <p className="text-muted">Delai devis → vente : {state.params.devisToSaleDays} jours</p>
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
