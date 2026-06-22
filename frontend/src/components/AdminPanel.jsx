import { useState } from "react";

export default function AdminPanel({ params, onSave, onClose }) {
  const [v, setV] = useState({ ...params });

  const set = (key, val) => {
    setV(prev => ({ ...prev, [key]: Number(val) }));
  };

  const sections = [
    {
      title: "📦 Production",
      fields: [
        ["ecofloPerDay", "Ecoflo par jour"],
        ["eparcoPerDay", "Eparco par jour"],
        ["maxStock", "Stock maximum"],
        ["daysPerWeek", "Jours ouvres / semaine"],
      ],
    },
    {
      title: "💰 Prix",
      fields: [
        ["priceEparcoInstall", "Installation Eparco (€)"],
        ["priceEcofloSale", "Vente Ecoflo (€)"],
        ["priceMaintenanceYear", "Contrat maintenance / an (€)"],
      ],
    },
    {
      title: "🚛 Logistique",
      fields: [
        ["tripDuration", "Duree trajet (jours)"],
        ["installsPerDay", "Installations / jour (Pt Service)"],
      ],
    },
    {
      title: "📉 Seuils",
      fields: [
        ["distributorSwitchThreshold", "Seuil switch concurrent (%)"],
        ["maxDeliveryDays", "Delai max livraison (jours)"],
        ["negativeReviewNeighbors", "Voisins impactes avis negatif"],
        ["devisToSaleDays", "Delai devis → vente (jours)"],
        ["terrainIssueRate", "Taux terrain problematique (%)"],
      ],
    },
    {
      title: "🏠 Carte & Maisons",
      fields: [
        ["totalHouses", "Nombre total maisons"],
        ["initialHouses", "Maisons au debut"],
        ["newHousesPerMonthMin", "Nouvelles maisons / mois (min)"],
        ["newHousesPerMonthMax", "Nouvelles maisons / mois (max)"],
        ["nbDistributors", "Nombre de distributeurs"],
        ["distributorRadius", "Rayon distributeur (km)"],
      ],
    },
    {
      title: "🎲 Evenements",
      fields: [
        ["eventLeakMaxDays", "Fuite : delai intervention (j)"],
        ["eventFactoryClosureDays", "Fermeture usine (jours)"],
        ["eventCompetitorDuration", "Promo concurrent (jours)"],
        ["eventCompetitorRadius", "Rayon concurrent (km)"],
        ["eventCompetitorCaptureRate", "Taux capture concurrent (%)"],
      ],
    },
    {
      title: "💸 Couts (EBITDA reel)",
      fields: [
        ["costProductionEcoflo", "Cout production Ecoflo (€)"],
        ["costProductionEparco", "Cout production Eparco (€)"],
        ["costPerTrip", "Cout par trajet camion (€)"],
        ["maintenanceCostPerVisit", "Cout visite maintenance (€)"],
        ["fixedCostPerYear", "Frais fixes / an (€)"],
      ],
    },
    {
      title: "📊 Scoring",
      fields: [
        ["gameDurationYears", "Duree du jeu (annees)"],
        ["maintenanceIntervalYears", "Intervalle maintenance (annees)"],
      ],
    },
  ];

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        <div className="admin-header">
          <h2>⚙️ Administration du jeu</h2>
          <button className="btn-close" onClick={onClose}>X</button>
        </div>

        <div className="admin-content">
          {sections.map((section, si) => (
            <div key={si} className="admin-section">
              <h3>{section.title}</h3>
              <div className="admin-fields">
                {section.fields.map(([key, label]) => (
                  <div key={key} className="admin-field">
                    <label>{label}</label>
                    <input
                      type="number"
                      step={key.includes("Rate") || key.includes("Threshold") ? 0.01 : 1}
                      value={v[key]}
                      onChange={e => set(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="admin-footer">
          <button className="btn btn-primary" onClick={() => onSave(v)}>
            💾 Sauvegarder
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
