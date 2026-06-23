// Niveaux de difficulte : chaque preset surcharge certains parametres par-dessus
// les valeurs par defaut (et les eventuels reglages admin).

export const DIFFICULTIES = {
  facile: {
    label: "Facile",
    icon: "🟢",
    desc: "Marché captif, peu d'aléas, concurrent peu agressif. Idéal pour découvrir.",
    params: {
      eventLeakProba: 0.001, eventFactoryProba: 0.0001, eventPriceWarProba: 0.0002,
      eventCompetitorCaptureRate: 0.40, distributorAutoCaptureRate: 0.01,
      distributorSwitchThreshold: 0.10,
      fixedCostPerYear: 6000,
      maxDeliveryDays: 25, negativeReviewNeighbors: 3,
    },
  },
  normal: {
    label: "Normal",
    icon: "🟡",
    desc: "Équilibre standard : aléas modérés, concurrence présente.",
    params: {},
  },
  expert: {
    label: "Expert",
    icon: "🔴",
    desc: "Aléas fréquents, concurrent agressif, délais serrés, frais fixes élevés.",
    params: {
      eventLeakProba: 0.004, eventFactoryProba: 0.0006, eventPriceWarProba: 0.001,
      eventCompetitorCaptureRate: 1.0, distributorAutoCaptureRate: 0.06,
      distributorSwitchThreshold: 0.30,
      fixedCostPerYear: 11000,
      maxDeliveryDays: 16, negativeReviewNeighbors: 7,
      initialActiveHouses: 16, newHousesPerMonthMax: 4,
    },
  },
};

export const DIFFICULTY_ORDER = ["facile", "normal", "expert"];
