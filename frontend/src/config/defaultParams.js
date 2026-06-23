export const DEFAULT_PARAMS = {
  mapWidth: 20, mapHeight: 10, communeSize: 10,
  nbDistributors: 2, distributorRadius: 2,
  totalHouses: 160, initialHouses: 100, // < nb de tuiles : laisse de l'espace libre (placement d'infrastructures)
  initialActiveHouses: 12, // maisons en demande des le jour 0 (le reste emerge progressivement)
  newHousesPerMonthMin: 1, newHousesPerMonthMax: 3,
  terrainIssueRate: 0.05,
  ecofloPerDay: 1, eparcoPerDay: 2, maxStock: 100, daysPerWeek: 5,
  tripDuration: 1, installsPerDay: 1,
  priceEparcoInstall: 2000, priceEcofloSale: 1000, priceMaintenanceYear: 100,
  priceCompetitor: 1500, // CA estime que le concurrent encaisse par installation captee
  devisToSaleDays: 14, maxDeliveryDays: 20, negativeReviewNeighbors: 5,
  distributorSwitchThreshold: 0.20,
  distributorCompetitorPriceFactor: 0.8,
  maintenanceIntervalYears: 2, maintenanceCostPerVisit: 100,
  // Couts unitaires pour le calcul EBITDA reel (EBITDA = CA - couts)
  costProductionEcoflo: 600, costProductionEparco: 900,
  costPerTrip: 150, fixedCostPerYear: 8000,
  eventLeakMaxDays: 2, eventFactoryClosureDays: 20,
  eventCompetitorDuration: 180,
  competitorZoneHouses: 30, // taille de la zone d'influence du distributeur touchee par la guerre des prix
  eventCompetitorCaptureRate: 0.80,
  // Probabilites quotidiennes des aleas (modulables par la difficulte)
  eventLeakProba: 0.002, eventFactoryProba: 0.0003, eventPriceWarProba: 0.0005,
  distributorAutoCaptureRate: 0.03,
  // Investissements (CAPEX deduit de l'EBITDA)
  pricePointService: 60000, priceTruck: 15000, priceFactoryUpgrade: 40000,
  maxPointServices: 3, maxTrucks: 4, maxFactoryUpgrades: 3,
  maxShipmentsPerDay: 4, truckCapacityBonus: 2, // expeditions/jour = base + trucks*bonus
  factoryUpgradeStock: 50, // bonus de stock max par agrandissement
  gameDurationYears: 11,
  daysPerYear: 260, weeksPerYear: 52, daysInMonth: 22,
};