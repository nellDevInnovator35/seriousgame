import { DEFAULT_PARAMS } from "../config/defaultParams.js";
import { generateMap, distance, findNearestDistributor, findNearestNeighbors, findNearestHouses } from "./MapGenerator.js";
import { nextRand, seedFrom } from "./rng.js";
import { QUEST_DEFS, QUEST_SETS, questDeadlineDay } from "../config/quests.js";

// ========== EBITDA REEL = CA - COUTS ==========
// Remplace l'ancien calcul "15% du CA". Les couts (production, logistique,
// maintenance, frais fixes) sont accumules au fil de la partie.
// ========== DISTANCE -> DUREE DE TRAJET ==========
// 1 tuile = 1 km. Un camion parcourt tripKmPerDay km/jour.
// La geographie compte : livrer loin de l'usine prend plus de temps.
export function tripDays(params, from, to) {
  const d = distance(from, to);
  return Math.max(params.tripDuration || 1, Math.ceil(d / (params.tripKmPerDay || 8)));
}

export function computeEbitda(kpis) {
  const totalCosts = (kpis.totalCostProduction || 0)
    + (kpis.totalCostLogistics || 0)
    + (kpis.totalCostMaintenance || 0)
    + (kpis.totalCostFixed || 0)
    + (kpis.totalCostInvestment || 0);
  const ebitda = kpis.totalCA - totalCosts;
  const ebitdaMargin = kpis.totalCA > 0 ? ebitda / kpis.totalCA : 0;
  return { totalCosts, ebitda, ebitdaMargin };
}

// ========== CREATION STATE INITIAL ==========
export function createInitialState(params = DEFAULT_PARAMS) {
  // RNG seedable : meme seed => meme carte et memes aleas (partie reproductible)
  const seed = seedFrom(params.seed);
  const rngObj = { rngState: seed };
  const rand = () => nextRand(rngObj);
  const map = generateMap(params, rand);
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
    seed, rngState: rngObj.rngState,
    // Quetes selon la difficulte (seuls id + statut sont stockes, cf. quests.js)
    quests: (QUEST_SETS[params.difficulty] || QUEST_SETS.normal).map(id => ({ id, status: "active" })),
    weeklyPlan: { ecoflo: 0, eparco: 0, media: 0 },
    currentWeekLocked: false,
    trucks: [], truckIdCounter: 0,
    kpis: {
      totalCA: 0, totalMaintenanceRevenue: 0, satisfiedClients: 0,
      totalEquipped: 0, totalCompetitor: 0, totalCompetitorCA: 0,
      avgDeliveryDays: 0, deliveryDaysSum: 0, deliveryCount: 0,
      // Postes de couts pour l'EBITDA reel
      totalCostProduction: 0, totalCostLogistics: 0,
      totalCostMaintenance: 0, totalCostFixed: 0, totalCostInvestment: 0,
      // Milieux filtrants
      totalMediaRevenue: 0, mediaReplacedCount: 0, mediaLostContracts: 0,
      // Maintenance negligee & quetes
      maintenanceLostContracts: 0, totalQuestRevenue: 0,
    },
    // Investissements (CAPEX) realises par le joueur
    investments: { pointServices: 0, trucks: 0, factoryUpgrades: 0 },
    extraPointServices: [], // points service supplementaires places sur la carte
    shipmentsToday: 0,
    activeEvents: [], eventLog: [],
    history: [], // releve mensuel pour les courbes d'evolution
    nextHouseIndex: activeCount,
    isRunning: false, speed: 2, gameOver: false,
    showDevis: null, showEvent: null, showScore: false,
    notifications: [], notifIdCounter: 0,
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
        s.kpis.totalCompetitorCA += p.priceCompetitor;
      }
    });
  }
}

// ========== NOTIFICATIONS (non bloquantes) ==========
// Les evenements mineurs (fuites, milieux filtrants, quetes, contrats) alimentent
// un fil de notifications sans mettre le jeu en pause. Seuls les evenements
// majeurs (fermeture usine, guerre des prix, distributeur perdu) ouvrent un popup.
function notify(s, type, message, houseId = null) {
  s.notifIdCounter = (s.notifIdCounter || 0) + 1;
  s.notifications = [
    ...(s.notifications || []),
    { id: s.notifIdCounter, day: s.day, type, message, houseId },
  ].slice(-30); // on garde les 30 dernieres
}

// ========== QUETES ==========
// Evalue les quetes actives : reussite (prime au CA), echec instantane ou a l'echeance.
function updateQuests(s) {
  if (!s.quests || !s.quests.length) return;
  for (const q of s.quests) {
    if (q.status !== "active") continue;
    const def = QUEST_DEFS[q.id];
    if (!def) continue;
    const deadline = questDeadlineDay(def, s.params);

    const complete = () => {
      q.status = "completed"; q.completedDay = s.day;
      if (def.reward) {
        s.kpis.totalCA += def.reward;
        s.kpis.totalQuestRevenue = (s.kpis.totalQuestRevenue || 0) + def.reward;
      }
      notify(s, "questDone",
        def.icon + " " + def.title + " : objectif atteint !"
        + (def.reward ? " Prime de " + def.reward.toLocaleString() + " €." : ""));
    };
    const fail = () => {
      q.status = "failed"; q.failedDay = s.day;
      notify(s, "questFailed",
        def.icon + " " + def.title + " : objectif manqué (" + def.desc + ").");
    };

    // Echec instantane (condition violee)
    if (def.failed && def.failed(s)) { fail(); continue; }

    if (def.type === "reach") {
      const cur = def.progress(s);
      if (cur >= def.target) complete();
      else if (s.day >= deadline) fail();
    } else if (def.type === "hold") {
      if (s.day >= deadline) complete();
    } else if (def.type === "checkpoint") {
      if (s.day >= deadline) (def.check(s) ? complete() : fail());
    }
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
    quests: (state.quests || []).map(q => ({ ...q })),
    notifications: [...(state.notifications || [])],
  };
  const p = s.params;
  // RNG deterministe : chaque tirage fait avancer s.rngState
  const rand = () => nextRand(s);
  // Capacites effectives selon les investissements (CAPEX)
  const inv = s.investments || { pointServices: 0, trucks: 0, factoryUpgrades: 0 };
  const ecofloPerDayEff = p.ecofloPerDay + inv.factoryUpgrades;
  const eparcoPerDayEff = p.eparcoPerDay + inv.factoryUpgrades;
  const maxStockEff = p.maxStock + inv.factoryUpgrades * (p.factoryUpgradeStock || 50);

  s.day++;
  s.shipmentsToday = 0; // remise a zero du compteur d'expeditions quotidien

  // Fin de partie (11 ans) : derniere evaluation des quetes avant le score
  if (Math.floor(s.day / p.daysPerYear) >= p.gameDurationYears) {
    updateQuests(s);
    s.showEvent = null; // pas de popup par-dessus l'ecran de score
    s.gameOver = true; s.showScore = true; s.isRunning = false;
    return s;
  }

  // --- Nouvelles maisons (2-5 par mois) ---
  if (s.day % p.daysInMonth === 0 && s.nextHouseIndex < s.houses.length) {
    const nb = Math.floor(rand() * (p.newHousesPerMonthMax - p.newHousesPerMonthMin + 1))
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
    if (s.weeklyPlan.ecoflo > 0 && s.factory.totalStock < maxStockEff) {
      const add = Math.min(ecofloPerDayEff, maxStockEff - s.factory.totalStock);
      const k = rand() < 0.5 ? "ecoflo4" : "ecoflo5";
      s.factory.stock[k] += add;
      s.factory.totalStock += add;
      s.kpis.totalCostProduction += add * p.costProductionEcoflo;
    }
    if (s.weeklyPlan.eparco > 0 && s.factory.totalStock < maxStockEff) {
      const add = Math.min(eparcoPerDayEff, maxStockEff - s.factory.totalStock);
      s.factory.stock.eparco4 += Math.ceil(add / 2);
      s.factory.stock.eparco5 += Math.floor(add / 2);
      s.factory.totalStock += add;
      s.kpis.totalCostProduction += add * p.costProductionEparco;
    }
    // Milieux filtrants (remplacement Ecoflo en fin de vie)
    if ((s.weeklyPlan.media || 0) > 0 && s.factory.totalStock < maxStockEff) {
      const add = Math.min(p.mediaPerDay || 2, maxStockEff - s.factory.totalStock);
      s.factory.stock.media = (s.factory.stock.media || 0) + add;
      s.factory.totalStock += add;
      s.kpis.totalCostProduction += add * (p.costProductionMedia || 0);
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
      if (tr.cargo === "media") {
        // Livraison d'un milieu filtrant : remplacement effectue a l'arrivee
        if (h && h.needsMediaReplacement) {
          h.needsMediaReplacement = false;
          h.mediaShipping = false;
          h.mediaDueDay = null;
          h.mediaInstallDay = s.day; // reset de la duree de vie
          s.kpis.totalCA += p.priceMediaReplacement || 0;
          s.kpis.totalMediaRevenue = (s.kpis.totalMediaRevenue || 0) + (p.priceMediaReplacement || 0);
          s.kpis.mediaReplacedCount = (s.kpis.mediaReplacedCount || 0) + 1;
        } else if (h) {
          h.mediaShipping = false;
        }
      } else if (h && h.status === "shipping") {
        h.status = "installing";
      }
      return false;
    }
    return true;
  });

  // --- Installations ---
  // Chaque Point Service pose au plus installsPerDay/jour, pour les maisons
  // dont il est le PS le plus proche. Un 2e PS bien place cree une vraie
  // file d'attente locale ; mal place, il n'apporte rien -> la carte compte.
  const psList = [s.pointService, ...(s.extraPointServices || [])];
  const psInstallsDone = psList.map(() => 0);
  const nearestPsIndex = (h) => {
    let best = 0, bd = Infinity;
    psList.forEach((ps, i) => {
      const d = distance(h, ps);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  };
  for (const h of s.houses) {
    if (h.status === "installing" && h.channel === "pointService") {
      const i = nearestPsIndex(h);
      if (psInstallsDone[i] < p.installsPerDay) {
        doInstall(h, s, p.priceEparcoInstall);
        psInstallsDone[i]++;
      }
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
        if (rand() < p.distributorAutoCaptureRate) {
          h.channel = "competitor"; h.status = "installed";
          h.isEquipped = true; h.installDay = s.day;
          s.kpis.totalCompetitor++; s.kpis.totalCompetitorCA += p.priceCompetitor;
          d.totalSalesCount++;
        }
      });
    }
  }

  // --- Maintenance (tous les 2 ans) ---
  // Maintenance sur toutes les installations de notre marque (Point Service
  // ET distributeur posant Ecoflo). Seul le concurrent est exclu.
  const maintDays = p.maintenanceIntervalYears * p.daysPerYear;
  s.houses.forEach(h => {
    if (h.isEquipped && h.channel !== "competitor" && !h.contractLost
      && h.lastMaintenanceDay != null && s.day - h.lastMaintenanceDay >= maintDays) {
      if (!h.needsMaintenance) {
        h.needsMaintenance = true;
        h.maintenanceDueDay = s.day;
      }
      // Maintenance negligee : risque de fuite accru, puis perte du contrat
      const overdue = s.day - (h.maintenanceDueDay ?? s.day);
      if (overdue > (p.maintenanceGraceDays || 60)) {
        if (!h.hasLeak && rand() < (p.maintenanceLeakProba || 0.01)) {
          h.hasLeak = true; h.leakDay = s.day;
          s.activeEvents.push({
            type: "leak", houseId: h.id,
            startDay: s.day, deadlineDay: s.day + p.eventLeakMaxDays,
          });
          notify(s, "leak", "Fuite maison #" + h.id + " (maintenance négligée) ! Intervention sous "
            + p.eventLeakMaxDays + "j !", h.id);
        }
        if (overdue > (p.maintenanceLostDays || 120)) {
          h.needsMaintenance = false;
          h.maintenanceDueDay = null;
          h.contractLost = true;
          h.satisfaction = 0;
          s.kpis.maintenanceLostContracts = (s.kpis.maintenanceLostContracts || 0) + 1;
          notify(s, "maintenanceLost", "Maintenance jamais effectuée maison #" + h.id
            + " : le client résilie son contrat de maintenance !", h.id);
        }
      }
    }
  });

  // --- Milieux filtrants (Ecoflo) : fin de vie apres N annees ---
  const mediaDays = (p.mediaLifespanYears || 8) * p.daysPerYear;
  s.houses.forEach(h => {
    if (h.isEquipped && h.channel !== "competitor" && !h.contractLost
      && h.product && h.product.startsWith("ecoflo")
      && !h.needsMediaReplacement && !h.mediaShipping
      && s.day - (h.mediaInstallDay ?? h.installDay ?? 0) >= mediaDays) {
      h.needsMediaReplacement = true;
      h.mediaDueDay = s.day;
      notify(s, "mediaDue", "Milieu filtrant en fin de vie maison #" + h.id
        + " ! Remplacement sous " + (p.mediaReplacementMaxDays || 90) + " jours.", h.id);
    }
    // Remplacement ignore trop longtemps -> fuite + contrat perdu
    if (h.needsMediaReplacement && !h.mediaShipping && h.mediaDueDay != null
      && s.day - h.mediaDueDay > (p.mediaReplacementMaxDays || 90)) {
      h.needsMediaReplacement = false;
      h.contractLost = true;
      h.satisfaction = 0;
      h.hasLeak = true; h.leakDay = s.day;
      s.kpis.mediaLostContracts = (s.kpis.mediaLostContracts || 0) + 1;
      s.activeEvents.push({
        type: "leak", houseId: h.id,
        startDay: s.day, deadlineDay: s.day + p.eventLeakMaxDays,
      });
      notify(s, "mediaLost", "Milieu filtrant non remplacé maison #" + h.id
        + " : fuite et contrat de maintenance perdu !", h.id);
    }
  });

  // --- Evenements aleatoires ---

  // Fuite
  if (rand() < p.eventLeakProba) {
    const eq = s.houses.filter(h => h.isEquipped && !h.hasLeak && h.channel !== "competitor");
    if (eq.length) {
      const h = eq[Math.floor(rand() * eq.length)];
      h.hasLeak = true; h.leakDay = s.day;
      s.activeEvents.push({
        type: "leak", houseId: h.id,
        startDay: s.day, deadlineDay: s.day + p.eventLeakMaxDays,
      });
      notify(s, "leak", "Fuite maison #" + h.id + " ! Intervention sous " + p.eventLeakMaxDays + "j !", h.id);
    }
  }

  // Fermeture usine
  if (rand() < p.eventFactoryProba && !s.factory.isClosed) {
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

  // Concurrent casse les prix : cible la zone d'influence d'UN distributeur
  if (rand() < p.eventPriceWarProba && !s.activeEvents.some(e => e.type === "competitorPriceWar")
    && s.distributors.length > 0) {
    const d = s.distributors[Math.floor(rand() * s.distributors.length)];
    const zoneHouseIds = findNearestHouses(d, s.houses, p.competitorZoneHouses).map(h => h.id);
    s.activeEvents.push({
      type: "competitorPriceWar",
      startDay: s.day, endDay: s.day + p.eventCompetitorDuration,
      distributorId: d.id, zoneHouseIds,
    });
    s.showEvent = {
      type: "competitorPriceWar",
      message: "Concurrent casse les prix dans la zone d'un distributeur ("
        + zoneHouseIds.length + " maisons) pendant 6 mois!"
    };
  }

  // Guerre des prix active : seuls les prospects de la zone touchee peuvent partir
  const war = s.activeEvents.find(e => e.type === "competitorPriceWar" && s.day <= e.endDay);
  if (war && war.zoneHouseIds) {
    const zone = new Set(war.zoneHouseIds);
    s.houses.filter(h => zone.has(h.id) && h.status === "needsANC" && !h.channel).forEach(h => {
      if (rand() < p.eventCompetitorCaptureRate * 0.01) {
        h.channel = "competitor"; h.status = "installed";
        h.isEquipped = true; h.installDay = s.day;
        s.kpis.totalCompetitor++; s.kpis.totalCompetitorCA += p.priceCompetitor;
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
    // Revenu de maintenance : toutes les installations de notre marque (hors
    // concurrent et hors contrats perdus faute de remplacement du milieu filtrant).
    const n = s.houses.filter(h => h.isEquipped && h.channel !== "competitor" && !h.contractLost).length;
    s.kpis.totalCA += n * p.priceMaintenanceYear;
    s.kpis.totalMaintenanceRevenue += n * p.priceMaintenanceYear;
    // Frais fixes annuels (usine, structure) - independants des ventes
    s.kpis.totalCostFixed += p.fixedCostPerYear;
  }

  // --- Quetes / objectifs ---
  updateQuests(s);

  // --- Releve mensuel pour les courbes d'evolution ---
  if (s.day > 0 && s.day % p.daysInMonth === 0) {
    const { ebitda, ebitdaMargin } = computeEbitda(s.kpis);
    const equipped = s.kpis.totalEquipped + s.kpis.totalCompetitor;
    s.history = [...s.history, {
      day: s.day,
      year: Math.round((s.day / p.daysPerYear) * 10) / 10,
      ca: Math.round(s.kpis.totalCA),
      ebitda: Math.round(ebitda),
      margin: Math.round(ebitdaMargin * 1000) / 10,
      satisfaction: s.kpis.deliveryCount
        ? Math.round(s.kpis.satisfiedClients / s.kpis.deliveryCount * 1000) / 10 : 100,
      ptShare: equipped ? Math.round(s.kpis.totalEquipped / equipped * 1000) / 10 : 0,
      competitorCA: Math.round(s.kpis.totalCompetitorCA || 0),
    }];
  }

  return s;
}

// ========== DEVIS EN ATTENTE -> COMMANDE (apres 2 semaines) ==========
export function processDevisPending(s) {
  const r = { ...s, houses: s.houses.map(h => ({ ...h })) };
  r.houses.forEach(h => {
    if (h.status === "devisSent" && h.devisSentDay != null
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
export function setWeeklyPlan(state, ecoflo, eparco, media = 0) {
  return {
    ...state,
    weeklyPlan: { ecoflo: Math.max(0, ecoflo), eparco: Math.max(0, eparco), media: Math.max(0, media) },
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

  // Plafond d'expeditions par jour (logistique) : base + camions achetes
  const inv = s.investments || { trucks: 0 };
  const maxShip = (s.params.maxShipmentsPerDay || 4) + inv.trucks * (s.params.truckCapacityBonus || 2);
  if ((s.shipmentsToday || 0) >= maxShip) return s;
  s.shipmentsToday = (s.shipmentsToday || 0) + 1;

  s.factory.stock[h.product]--;
  s.factory.totalStock--;
  s.kpis.totalCostLogistics += s.params.costPerTrip;
  s.trucks.push({
    id: s.truckIdCounter++,
    fromX: s.factory.x, fromY: s.factory.y,
    toX: h.x, toY: h.y,
    cargo: h.product,
    departDay: s.day,
    arriveDay: s.day + tripDays(s.params, s.factory, h),
    type: h.channel === "pointService" ? "pt" : "distributor",
    targetHouseId: h.id,
  });
  h.status = "shipping";
  return s;
}

// Expedier un milieu filtrant vers une maison (remplacement Ecoflo)
export function shipMedia(state, houseId) {
  const s = {
    ...state,
    trucks: [...state.trucks],
    factory: { ...state.factory, stock: { ...state.factory.stock } },
    houses: state.houses.map(h => ({ ...h })),
    kpis: { ...state.kpis },
  };
  const h = s.houses.find(x => x.id === houseId);
  if (!h || !h.needsMediaReplacement || h.mediaShipping) return s;
  if ((s.factory.stock.media || 0) <= 0) return s;

  // Meme plafond logistique que les produits
  const inv = s.investments || { trucks: 0 };
  const maxShip = (s.params.maxShipmentsPerDay || 4) + inv.trucks * (s.params.truckCapacityBonus || 2);
  if ((s.shipmentsToday || 0) >= maxShip) return s;
  s.shipmentsToday = (s.shipmentsToday || 0) + 1;

  s.factory.stock.media--;
  s.factory.totalStock--;
  s.kpis.totalCostLogistics += s.params.costPerTrip;
  s.trucks.push({
    id: s.truckIdCounter++,
    fromX: s.factory.x, fromY: s.factory.y,
    toX: h.x, toY: h.y,
    cargo: "media",
    departDay: s.day,
    arriveDay: s.day + tripDays(s.params, s.factory, h),
    type: "pt",
    targetHouseId: h.id,
  });
  h.mediaShipping = true;
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
    h.maintenanceDueDay = null;
    s.kpis.totalCostMaintenance += s.params.maintenanceCostPerVisit;
  }
  return s;
}

// ========== INVESTISSEMENTS (CAPEX) ==========

// Config des investissements disponibles (prix + plafond)
export function investConfig(params) {
  return {
    truck: { price: params.priceTruck, max: params.maxTrucks, key: "trucks" },
    factory: { price: params.priceFactoryUpgrade, max: params.maxFactoryUpgrades, key: "factoryUpgrades" },
    pointService: { price: params.pricePointService, max: params.maxPointServices, key: "pointServices" },
  };
}

// Achat immediat (camion, agrandissement usine). Le point service passe par placePointService.
export function invest(state, type) {
  const cfg = investConfig(state.params)[type];
  if (!cfg || type === "pointService") return state;
  const inv = state.investments || { pointServices: 0, trucks: 0, factoryUpgrades: 0 };
  if (inv[cfg.key] >= cfg.max) return state; // plafond atteint
  return {
    ...state,
    investments: { ...inv, [cfg.key]: inv[cfg.key] + 1 },
    kpis: { ...state.kpis, totalCostInvestment: (state.kpis.totalCostInvestment || 0) + cfg.price },
  };
}

// Placer un 2e (ou 3e) Point Service sur une tuile libre
export function placePointService(state, x, y) {
  const p = state.params;
  const inv = state.investments || { pointServices: 0, trucks: 0, factoryUpgrades: 0 };
  if (inv.pointServices >= p.maxPointServices) return state;
  // Tuile libre ? (pas de batiment, pas de maison apparue, pas l'usine/PS/distrib)
  const occupied =
    (state.houses || []).some(h => h.x === x && h.y === y) ||
    (state.distributors || []).some(d => d.x === x && d.y === y) ||
    (state.pointService && state.pointService.x === x && state.pointService.y === y) ||
    (state.factory && state.factory.x === x && state.factory.y === y) ||
    (state.extraPointServices || []).some(ps => ps.x === x && ps.y === y);
  if (occupied) return state;
  return {
    ...state,
    extraPointServices: [...(state.extraPointServices || []), { x, y }],
    investments: { ...inv, pointServices: inv.pointServices + 1 },
    kpis: { ...state.kpis, totalCostInvestment: (state.kpis.totalCostInvestment || 0) + p.pricePointService },
  };
}
