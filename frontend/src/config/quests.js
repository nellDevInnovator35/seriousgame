// ========== SYSTEME DE QUETES / OBJECTIFS ==========
// Chaque quete a une difficulte (etoiles), une echeance et un type :
// - reach      : atteindre une cible avant l'echeance (progression visible)
// - hold       : tenir une condition jusqu'a l'echeance (echec instantane sinon)
// - checkpoint : condition verifiee une seule fois, a l'echeance
// La prime (reward) est creditee au CA a la reussite (prime interne de performance).

const ebitdaOf = (k) => (k.totalCA || 0) - (
  (k.totalCostProduction || 0) + (k.totalCostLogistics || 0)
  + (k.totalCostMaintenance || 0) + (k.totalCostFixed || 0)
  + (k.totalCostInvestment || 0)
);

export const QUEST_DEFS = {
  premiersPas: {
    icon: "\u{1F3E0}", title: "Premiers pas", stars: 1, type: "reach",
    desc: "Équiper 10 maisons PT",
    deadlineYears: 2, target: 10, reward: 3000,
    progress: s => s.kpis.totalEquipped,
  },
  zeroRetard: {
    icon: "⏱️", title: "Zéro retard", stars: 1, type: "hold",
    desc: "Aucune livraison hors délai pendant l'an 1",
    deadlineYears: 1, reward: 3000,
    failed: s => s.kpis.deliveryCount > s.kpis.satisfiedClients,
  },
  investisseur: {
    icon: "\u{1F3D7}️", title: "Investisseur", stars: 1, type: "reach",
    desc: "Réaliser au moins 1 investissement (CAPEX)",
    deadlineYears: 4, target: 1, reward: 4000,
    progress: s => {
      const i = s.investments || {};
      return (i.pointServices || 0) + (i.trucks || 0) + (i.factoryUpgrades || 0);
    },
  },
  fideliteDistrib: {
    icon: "\u{1F4E6}", title: "Fidélité distributeurs", stars: 2, type: "hold",
    desc: "Aucun distributeur passé à la concurrence avant l'an 5",
    deadlineYears: 5, reward: 6000,
    failed: s => (s.distributors || []).some(d => d.isCompetitor),
  },
  rentableTot: {
    icon: "\u{1F4C8}", title: "Rentable tôt", stars: 2, type: "checkpoint",
    desc: "EBITDA positif à la fin de l'an 3",
    deadlineYears: 3, reward: 6000,
    check: s => ebitdaOf(s.kpis) > 0,
  },
  partMarche: {
    icon: "\u{1F4CA}", title: "Leader du territoire", stars: 2, type: "checkpoint",
    desc: "≥ 70 % de part de marché PT à la fin de l'an 5",
    deadlineYears: 5, reward: 8000,
    check: s => {
      const t = s.kpis.totalEquipped + s.kpis.totalCompetitor;
      return t >= 10 && s.kpis.totalEquipped / t >= 0.70;
    },
  },
  aftermarket: {
    icon: "\u{1F504}", title: "Roi de l'aftermarket", stars: 3, type: "reach",
    desc: "Remplacer 5 milieux filtrants sans perdre un seul contrat",
    deadlineYears: 99, target: 5, reward: 10000,
    progress: s => s.kpis.mediaReplacedCount || 0,
    failed: s => ((s.kpis.mediaLostContracts || 0) + (s.kpis.maintenanceLostContracts || 0)) > 0,
  },
  excellenceSav: {
    icon: "\u{1F6E0}️", title: "Excellence SAV", stars: 3, type: "hold",
    desc: "Aucun contrat de maintenance perdu pendant toute la partie",
    deadlineYears: 99, reward: 10000,
    failed: s => ((s.kpis.mediaLostContracts || 0) + (s.kpis.maintenanceLostContracts || 0)) > 0,
  },
};

// Jeux de quetes par niveau de difficulte du jeu
export const QUEST_SETS = {
  facile: ["premiersPas", "zeroRetard", "investisseur", "fideliteDistrib", "rentableTot"],
  normal: ["premiersPas", "zeroRetard", "investisseur", "fideliteDistrib", "rentableTot", "partMarche", "aftermarket"],
  expert: ["zeroRetard", "fideliteDistrib", "rentableTot", "partMarche", "aftermarket", "excellenceSav"],
};

// Echeance effective (bornee par la duree de la partie)
export function questDeadlineDay(def, params) {
  return Math.min(def.deadlineYears, params.gameDurationYears) * params.daysPerYear;
}
