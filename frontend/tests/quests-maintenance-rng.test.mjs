// Tests : RNG seede, quetes, maintenance avec consequences
import { DEFAULT_PARAMS } from "../src/config/defaultParams.js";
import { createInitialState, advanceDay } from "../src/engine/GameEngine.js";
import { QUEST_SETS } from "../src/config/quests.js";

const assert = (cond, msg) => { if (!cond) { console.error("FAIL:", msg); process.exit(1); } console.log("OK:", msg); };

// ========== 1) RNG deterministe ==========
const base = { ...DEFAULT_PARAMS, difficulty: "normal" };
let a = createInitialState({ ...base, seed: 42 });
let b = createInitialState({ ...base, seed: 42 });
assert(JSON.stringify(a.houses) === JSON.stringify(b.houses), "meme seed -> meme carte");
assert(a.seed === 42 && a.rngState === b.rngState, "seed stocke dans le state");

for (let i = 0; i < 60; i++) {
  a.showEvent = null; b.showEvent = null;
  a = advanceDay(a); b = advanceDay(b);
}
assert(JSON.stringify(a.kpis) === JSON.stringify(b.kpis) && a.rngState === b.rngState
  && JSON.stringify(a.houses) === JSON.stringify(b.houses),
  "meme seed -> simulation identique apres 60 jours");

const c = createInitialState({ ...base, seed: 43 });
assert(JSON.stringify(c.houses) !== JSON.stringify(createInitialState({ ...base, seed: 42 }).houses),
  "seed different -> carte differente");

// ========== 2) Quetes par difficulte ==========
for (const d of ["facile", "normal", "expert"]) {
  const s = createInitialState({ ...DEFAULT_PARAMS, difficulty: d, seed: 1 });
  assert(s.quests.length === QUEST_SETS[d].length && s.quests.length >= 5,
    "difficulte '" + d + "' -> " + s.quests.length + " quetes");
}

// ========== 3) Quete 'reach' completee + prime ==========
const calm = {
  ...DEFAULT_PARAMS, difficulty: "facile", seed: 7,
  eventLeakProba: 0, eventFactoryProba: 0, eventPriceWarProba: 0,
  distributorAutoCaptureRate: 0, newHousesPerMonthMin: 0, newHousesPerMonthMax: 0,
};
let s = createInitialState(calm);
s.houses.filter(h => h.status === "needsANC").slice(0, 10).forEach(h => {
  h.channel = "distributor"; h.product = "ecoflo4"; h.status = "installing";
});
s.showEvent = null; s = advanceDay(s);
const pp = s.quests.find(q => q.id === "premiersPas");
assert(pp.status === "completed", "quete 'Premiers pas' completee (10 maisons)");
assert(s.kpis.totalQuestRevenue === 3000, "prime de 3000 € creditee");
assert(s.kpis.totalCA === 10 * calm.priceEcofloSale + 3000, "CA = ventes + prime");

// ========== 4) Quete 'hold' echouee (distributeur perdu) ==========
s.distributors[0].isCompetitor = true;
s.showEvent = null; s = advanceDay(s);
assert(s.quests.find(q => q.id === "fideliteDistrib").status === "failed",
  "quete 'Fidelite distributeurs' echouee si un distributeur passe au concurrent");

// ========== 5) Quete 'hold' reussie a l'echeance (zero retard, an 1) ==========
let z = createInitialState(calm);
z.houses.filter(h => h.status === "needsANC").slice(0, 2).forEach(h => {
  h.channel = "distributor"; h.product = "ecoflo4"; h.status = "installing";
});
for (let i = 0; i < 262; i++) { z.showEvent = null; z = advanceDay(z); }
assert(z.quests.find(q => q.id === "zeroRetard").status === "completed",
  "quete 'Zero retard' completee a la fin de l'an 1");

// ========== 6) Maintenance negligee -> fuite puis contrat resilie ==========
const strict = {
  ...calm, seed: 9,
  maintenanceLeakProba: 1, // fuite garantie des le depassement du delai de grace
  maintenanceGraceDays: 10, maintenanceLostDays: 30,
  maintenanceIntervalYears: 1,
};
let m = createInitialState(strict);
const hm = m.houses.find(h => h.status === "needsANC");
hm.channel = "distributor"; hm.product = "eparco4"; hm.status = "installing"; // eparco : pas de milieu filtrant
m.showEvent = null; m = advanceDay(m);
assert(m.houses.find(h => h.id === hm.id).isEquipped, "maison installee (maintenance test)");

// 1 an (echeance) + 11 j (grace depassee) -> fuite
for (let i = 0; i < 260 + 11; i++) { m.showEvent = null; m = advanceDay(m); }
let hh = m.houses.find(h => h.id === hm.id);
assert(hh.needsMaintenance, "maintenance requise apres 1 an");
assert(hh.hasLeak, "fuite declenchee (maintenance negligee au-dela du delai de grace)");

// + jusqu'a 31 j de retard -> contrat resilie
for (let i = 0; i < 25; i++) { m.showEvent = null; m = advanceDay(m); }
hh = m.houses.find(h => h.id === hm.id);
assert(hh.contractLost && !hh.needsMaintenance, "contrat resilie apres " + strict.maintenanceLostDays + " j de negligence");
assert(m.kpis.maintenanceLostContracts === 1, "compteur contrats resilies = 1");

// La visite effectuee a temps evite tout ca : contre-test
let ok = createInitialState(strict);
const ho = ok.houses.find(h => h.status === "needsANC");
ho.channel = "distributor"; ho.product = "eparco4"; ho.status = "installing";
ok.showEvent = null; ok = advanceDay(ok);
for (let i = 0; i < 265; i++) {
  ok.showEvent = null; ok = advanceDay(ok);
  const h = ok.houses.find(x => x.id === ho.id);
  if (h.needsMaintenance) {
    // simule performMaintenance inline (import direct possible aussi)
    h.needsMaintenance = false; h.lastMaintenanceDay = ok.day; h.maintenanceDueDay = null;
  }
}
const hOk = ok.houses.find(x => x.id === ho.id);
assert(!hOk.contractLost && !hOk.hasLeak, "maintenance faite a temps -> aucun degat");

console.log("\nTous les tests passent ✅");
