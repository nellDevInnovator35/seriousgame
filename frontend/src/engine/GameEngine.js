import { DEFAULT_PARAMS } from "../config/defaultParams.js";
import { generateMap, distance, findNearestDistributor, findNearestNeighbors } from "./MapGenerator.js";

// ========== EBITDA REEL = CA - COUTS ==========
// Remplace l'ancien calcul "15% du CA". Les couts (production, logistique,
// maintenance, frais fixes) sont accumules au fil de la partie.
export function computeEbitda(kpis) {
  const totalCosts = (kpis.totalCostProduction || 0)
    + (kpis.totalCostLogistics || 0)
    + (kpis.totalCostMaintenance || 0)
    + (kpis.totalCostFixed || 0);
  const ebitda = kpis.totalCA - totalCosts;
  const ebitdaMargin = kpis.totalCA > 0 ? ebitda / kpis.totalCA : 0;
  return { totalCosts, ebitda, ebitdaMargin };
}

// ========== CREATION STATE INITIAL ==========
export function createInitialState(params = DEFAULT_PARAMS) {
  const map = generateMap(params);
  // Seules les premieres maisons sont en demande au jour 0.
  // Le reste du parc existant emerge progressivement (controles SPANC etales),
  // via le meme pipeline mensuel que les nouvelles constructions.
  const activeCount = Math.min(
    params.initialActiveHouses ?? params.initialHouses,
    params.initialHouses
  );
  map.houses.forEach(h => {
    if (h.isInitial) {
      if (h.id < activeCount) {
        h.status = "needsANC"; h.hasDemand = true; h.demandDay = 0; h.appearedDay = 0;
      } else {
        h.appearedDay = null; // pas encore sur le marche
      }
    }
  });
  return {
    params: { ...params }, day: 0, ...map,
    weeklyPlan: { ecoflo: 0, eparco: 0 },
    currentWeekLocked: false,
    trucks: [], truckIdCounter: 0,
    kpis: {
      totalCA: 0, totalMaintenanceRevenue: 0, satisfiedClients: 0,
      totalEquipped: 0, totalCompetitor: 0,
      avgDeliveryDays: 0, deliveryDaysSum: 0, deliveryCount: 0,
      // Postes de couts pour l'EBITDA reel
      totalCostProduction: 0, totalCostLogistics: 0,
      totalCostMaintenance: 0, totalCostFixed: 0,
    },
    activeEvents: [], eventLog: [],
    nextHouseIndex: activeCount,
    isRunning: false, speed: 2, gameOver: false,
    showDevis: null, showEvent: null, showScore: false,
  };
}

// ========== INSTALLATION ==========
function doInstall(h, s, price) {
  const p = s.params;
  h.status = "installed"; h.isEquipped = true;
  h.installDay = s.day; h.lastMaintenanceDay = s.day;
  s.kpis.totalEquipped++; s.kpis.totalCA += price;
  const dd = s.day - (h.demandDay || 0);
  s.kpis.deliveryDaysSum += dd; s.kpis.deliveryCount++;
  s.kpis.avgDeliveryDays = s.kpis.deliveryDaysSum / s.kpis.deliveryCount;
  if (dd <= p.maxDeliveryDays) {
    s.kpis.satisfiedClients++; h.satisfaction = 1;
  } else {
    // Avis negatif -> 5 voisins partent chez concurrent
    h.satisfaction = 0;
    findNearestNeighbors(h, s.houses, p.negativeReviewNeighbors).forEach(n => {
      if (n.status === "needsANC" && !n.channel) {
        n.channel = "competitor"; n.status = "installed";
        n.isEquipped = true; n.installDay = s.day;
        s.kpis.totalCompetitor++;
      }
    });
  }
}

// ========== BOUCLE PRINCIPALE : AVANCER D'1 JOUR ==========
export function advanceDay(state) {
  if (state.gameOver) return state;

  // Deep copy des objets mutables
  const s = {
    ...state,
    houses: state.houses.map(h => ({ ...h })),
    trucks: [...state.trucks],
    factory: { ...state.factory, stock: { ...state.factory.stock } },
    kpis: { ...state.kpis },
    activeEvents: [...state.activeEvents],
    distributors: state.distributors.map(d => ({ ...d })),
  };
  const p = s.params;
  s.day++;

  // Fin de partie (11 ans)
  if (Math.floor(s.day / p.daysPerYear) >= p.gameDurationYears) {
    s.gameOver = true; s.showScore = true; s.isRunning = false;
    return s;
  }

  // --- Nouvelles maisons (2-5 par mois) ---
  if (s.day % p.daysInMonth === 0 && s.nextHouseIndex < s.houses.length) {
    const nb = Math.floor(Math.random() * (p.newHousesPerMonthMax - p.newHousesPerMonthMin + 1))
      + p.newHousesPerMonthMin;
    for (let i = 0; i < nb && s.nextHouseIndex < s.houses.length; i++) {
      const h = s.houses[s.nextHouseIndex];
      h.status = "needsANC"; h.hasDemand = true;
      h.demandDay = s.day; h.appearedDay = s.day;
      s.nextHouseIndex++;
    }
  }

  // --- Production (si usine ouverte, jours ouvres) ---
  if (!s.factory.isClosed && s.day % 7 < p.daysPerWeek) {
    if (s.weeklyPlan.ecoflo > 0 && s.factory.totalStock < p.maxStock) {
      const add = Math.min(p.ecofloPerDay, p.maxStock - s.factory.totalStock);
      const k = Math.random() < 0.5 ? "ecoflo4" : "ecoflo5";
      s.factory.stock[k] += add;
      s.factory.totalStock += add;
      s.kpis.totalCostProduction += add * p.costProductionEcoflo;
    }
    if (s.weeklyPlan.eparco > 0 && s.factory.totalStock < p.maxStock) {
      const add = Math.min(p.eparcoPerDay, p.maxStock - s.factory.totalStock);
      s.factory.stock.eparco4 += Math.ceil(add / 2);
      s.factory.stock.eparco5 += Math.floor(add / 2);
      s.factory.totalStock += add;
      s.kpis.totalCostProduction += add * p.costProductionEparco;
    }
  }
  if (s.factory.isClosed && s.day >= s.factory.closedUntilDay) {
    s.factory.isClosed = false;
  }

  // --- Debut de semaine : deverrouiller plan ---
  if (s.day % 7 === 0) s.currentWeekLocked = false;

  // --- Camions arrives ---
  s.trucks = s.trucks.filter(tr => {
    if (s.day >= tr.arriveDay) {
      const h = s.houses.find(h2 => h2.id === tr.targetHouseId);
      if (h && h.status === "shipping") h.status = "installing";
      return false;
    }
    return true;
  });

  // --- Installations ---
  let installsDone = 0;
  for (const h of s.houses) {
    if (h.status === "installing" && h.channel === "pointService" && installsDone < p.installsPerDay) {
      doInstall(h, s, p.priceEparcoInstall);
      installsDone++;
    }
    if (h.status === "installing" && h.channel === "distributor") {
      doInstall(h, s, p.priceEcofloSale);
      const d = findNearestDistributor(h, s.distributors);
      if (d) { d.ptSalesCount++; d.totalSalesCount++; }
    }
  }

  // --- Distributeurs : seuil switch concurrent ---
  for (const d of s.distributors) {
    if (d.totalSalesCount >= 5 && !d.isCompetitor
      && d.ptSalesCount / d.totalSalesCount < p.distributorSwitchThreshold) {
      d.isCompetitor = true; d.switchedDay = s.day;
      s.showEvent = {
        type: "distributorSwitch",
        message: "Un distributeur passe a la concurrence!"
      };
    }
    // IA concurrent : ventes automatiques dans sa zone
    if (d.isCompetitor) {
      s.houses.filter(h =>
        h.status === "needsANC" && !h.channel && distance(h, d) <= d.radius
      ).forEach(h => {
        if (Math.random() < 0.03) {
          h.channel = "competitor"; h.status = "installed";
          h.isEquipped = true; h.installDay = s.day;
          s.kpis.totalCompetitor++; d.totalSalesCount++;
        }
      });
    }
  }

  // --- Maintenance (tous les 2 ans) ---
  const maintDays = p.maintenanceIntervalYears * p.daysPerYear;
  s.houses.forEach(h => {
    if (h.isEquipped && h.channel !== "competitor" && h.lastMaintenanceDay
      && s.day - h.lastMaintenanceDay >= maintDays) {
      h.needsMaintenance = true;
    }
  });

  // --- Evenements aleatoires ---

  // Fuite
  if (Math.random() < 0.002) {
    const eq = s.houses.filter(h => h.isEquipped && !h.hasLeak && h.channel !== "competitor");
    if (eq.length) {
      const h = eq[Math.floor(Math.random() * eq.length)];
      h.hasLeak = true; h.leakDay = s.day;
      s.activeEvents.push({
        type: "leak", houseId: h.id,
        startDay: s.day, deadlineDay: s.day + p.eventLeakMaxDays,
      });
      s.showEvent = {
        type: "leak", houseId: h.id,
        message: "Fuite maison #" + h.id + "! Intervention sous " + p.eventLeakMaxDays + "j!"
      };
    }
  }

  // Fermeture usine
  if (Math.random() < 0.0003 && !s.factory.isClosed) {
    s.factory.isClosed = true;
    s.factory.closedUntilDay = s.day + p.eventFactoryClosureDays;
    s.activeEvents.push({
      type: "factoryClosure",
      startDay: s.day, endDay: s.factory.closedUntilDay
    });
    s.showEvent = {
      type: "factoryClosure",
      message: "Usine fermee " + p.eventFactoryClosureDays + " jours!"
    };
  }

  // Concurrent casse les prix
  if (Math.random() < 0.0005 && !s.activeEvents.some(e => e.type === "competitorPriceWar")) {
    s.activeEvents.push({
      type: "competitorPriceWar",
      startDay: s.day, endDay: s.day + p.eventCompetitorDuration
    });
    s.showEvent = {
      type: "competitorPriceWar",
      message: "Concurrent casse les prix pendant 6 mois!"
    };
  }

  // Guerre des prix active
  if (s.activeEvents.some(e => e.type === "competitorPriceWar" && s.day <= e.endDay)) {
    s.houses.filter(h => h.status === "needsANC" && !h.channel).forEach(h => {
      if (s.distributors.some(d => distance(h, d) <= p.eventCompetitorRadius)
        && Math.random() < p.eventCompetitorCaptureRate * 0.01) {
        h.channel = "competitor"; h.status = "installed";
        h.isEquipped = true; h.installDay = s.day;
        s.kpis.totalCompetitor++;
      }
    });
  }

  // Fuites non resolues -> client mecontent
  s.activeEvents = s.activeEvents.filter(e => {
    if (e.type === "leak" && !e.resolved && s.day > e.deadlineDay) {
      const h = s.houses.find(h2 => h2.id === e.houseId);
      if (h) h.satisfaction = 0;
      return false;
    }
    if (e.endDay && s.day > e.endDay) return false;
    return true;
  });

  // Revenus maintenance annuels
  if (s.day % p.daysPerYear === 0 && s.day > 0) {
    const n = s.houses.filter(h => h.isEquipped && h.channel !== "competitor").length;
    s.kpis.totalCA += n * p.priceMaintenanceYear;
    s.kpis.totalMaintenanceRevenue += n * p.priceMaintenanceYear;
    // Frais fixes annuels (usine, structure) - independants des ventes
    s.kpis.totalCostFixed += p.fixedCostPerYear;
  }

  return s;
}

// ========== DEVIS EN ATTENTE -> COMMANDE (apres 2 semaines) ==========
export function processDevisPending(s) {
  const r = { ...s, houses: s.houses.map(h => ({ ...h })) };
  r.houses.forEach(h => {
    if (h.status === "devisSent" && h.devisSentDay
      && r.day - h.devisSentDay >= r.params.devisToSaleDays) {
      h.status = "ordered"; h.orderDay = r.day;
    }
  });
  return r;
}

// ========== ACTIONS JOUEUR ==========

// Clic sur une maison -> proposer un devis
export function sendDevis(state, houseId) {
  const s = { ...state };
  const h = s.houses.find(x => x.id === houseId);
  if (!h) return s;
  if (h.status === "needsANC" && !h.channel) {
    const nd = findNearestDistributor(h, s.distributors);
    // On expose les options possibles, le joueur arbitre lui-meme le circuit.
    s.showDevis = {
      houseId,
      terrainIssue: !!h.hasTerrainIssue,         // sol inadapte a l'epandage (Eparco)
      distributorAvailable: !!(nd && !nd.isCompetitor),
    };
  } else {
    s.showDevis = { houseId, channel: h.channel, info: true };
  }
  return s;
}

// Confirmer le devis
export function confirmDevis(state, houseId, channel) {
  const s = { ...state, houses: state.houses.map(h => ({ ...h })) };
  const h = s.houses.find(x => x.id === houseId);
  if (!h) return s;
  const variant = h.inhabitants === 4 ? "4" : "5";
  if (channel === "pointService") {
    h.channel = "pointService";
    h.product = "eparco" + variant;
    h.status = "devisSent";
    h.devisSentDay = s.day;
  } else {
    h.channel = "distributor";
    h.product = "ecoflo" + variant;
    h.status = "ordered";
    h.orderDay = s.day;
  }
  s.showDevis = null;
  return s;
}

// Planifier la production de la semaine
export function setWeeklyPlan(state, ecoflo, eparco) {
  return {
    ...state,
    weeklyPlan: { ecoflo: Math.max(0, ecoflo), eparco: Math.max(0, eparco) },
    currentWeekLocked: true,
  };
}

// Expedier un produit vers une maison
export function shipProduct(state, houseId) {
  const s = {
    ...state,
    trucks: [...state.trucks],
    factory: { ...state.factory, stock: { ...state.factory.stock } },
    houses: state.houses.map(h => ({ ...h })),
    kpis: { ...state.kpis },
  };
  const h = s.houses.find(x => x.id === houseId);
  if (!h || !h.product || s.factory.stock[h.product] <= 0) return s;

  s.factory.stock[h.product]--;
  s.factory.totalStock--;
  s.kpis.totalCostLogistics += s.params.costPerTrip;
  s.trucks.push({
    id: s.truckIdCounter++,
    fromX: s.factory.x, fromY: s.factory.y,
    toX: h.x, toY: h.y,
    cargo: h.product,
    departDay: s.day,
    arriveDay: s.day + s.params.tripDuration,
    type: h.channel === "pointService" ? "pt" : "distributor",
    targetHouseId: h.id,
  });
  h.status = "shipping";
  return s;
}

// Resoudre une fuite
export function resolveLeak(state, houseId) {
  const s = {
    ...state,
    activeEvents: [...state.activeEvents],
    houses: state.houses.map(h => ({ ...h })),
  };
  const h = s.houses.find(x => x.id === houseId);
  if (!h || !h.hasLeak) return s;
  h.hasLeak = false; h.leakDay = null;
  s.activeEvents = s.activeEvents.filter(e => !(e.type === "leak" && e.houseId === houseId));
  return s;
}

// Effectuer la maintenance
export function performMaintenance(state, houseId) {
  const s = { ...state, houses: state.houses.map(h => ({ ...h })), kpis: { ...state.kpis } };
  const h = s.houses.find(x => x.id === houseId);
  if (h && h.needsMaintenance) {
    h.needsMaintenance = false; h.lastMaintenanceDay = s.day;
    s.kpis.totalCostMaintenance += s.params.maintenanceCostPerVisit;
  }
  return s;
}
