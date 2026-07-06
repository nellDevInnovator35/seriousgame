// Simulation du cycle milieu filtrant sur le vrai moteur
import { DEFAULT_PARAMS } from "../src/config/defaultParams.js";
import { createInitialState, advanceDay, setWeeklyPlan, shipMedia } from "../src/engine/GameEngine.js";

const params = {
  ...DEFAULT_PARAMS,
  mediaLifespanYears: 1, mediaReplacementMaxDays: 30,
  eventLeakProba: 0, eventFactoryProba: 0, eventPriceWarProba: 0,
  distributorAutoCaptureRate: 0,
  newHousesPerMonthMin: 0, newHousesPerMonthMax: 0,
};

let s = createInitialState(params);
const assert = (cond, msg) => { if (!cond) { console.error("FAIL:", msg); process.exit(1); } console.log("OK:", msg); };

// Forcer 2 maisons en installation Ecoflo (circuit distributeur)
const [hA, hB] = s.houses.filter(h => h.status === "needsANC").slice(0, 2);
for (const h of [hA, hB]) {
  h.channel = "distributor"; h.product = "ecoflo4"; h.status = "installing";
}
s = advanceDay(s);
assert(s.houses.find(h => h.id === hA.id).isEquipped, "maison A installee (Ecoflo)");
assert(s.houses.find(h => h.id === hB.id).isEquipped, "maison B installee (Ecoflo)");

// Produire des milieux filtrants
s = setWeeklyPlan(s, 0, 0, 1);
const run = (n) => { for (let i = 0; i < n; i++) { s.showEvent = null; s = advanceDay(s); if (s.day % 7 === 0) s = setWeeklyPlan(s, 0, 0, 1); } };

// Avancer jusqu'a la fin de vie (1 an = 260 j)
run(262);
let a = s.houses.find(h => h.id === hA.id), b = s.houses.find(h => h.id === hB.id);
assert(a.needsMediaReplacement && b.needsMediaReplacement, "besoin de remplacement declenche apres 1 an");
assert((s.factory.stock.media || 0) > 0, "stock de milieux filtrants produit (" + s.factory.stock.media + ")");
const costProd = s.kpis.totalCostProduction;
assert(costProd > 0, "cout de production des milieux comptabilise");

// Remplacer A, ignorer B
const caBefore = s.kpis.totalCA;
s = shipMedia(s, a.id);
assert(s.houses.find(h => h.id === a.id).mediaShipping, "milieu filtrant expedie vers A");
assert(s.trucks.some(t => t.cargo === "media"), "camion media en route");
run(2);
a = s.houses.find(h => h.id === hA.id);
assert(!a.needsMediaReplacement && !a.mediaShipping, "remplacement A effectue a la livraison");
assert(a.mediaInstallDay != null, "duree de vie A reinitialisee");
assert(s.kpis.totalCA === caBefore + params.priceMediaReplacement, "CA credite de " + params.priceMediaReplacement + " €");
assert(s.kpis.mediaReplacedCount === 1, "compteur remplacements = 1");

// B ignore -> apres 30 jours : contrat perdu + fuite
run(35);
b = s.houses.find(h => h.id === hB.id);
assert(b.contractLost, "contrat B perdu (remplacement ignore)");
assert(b.hasLeak, "fuite declenchee sur B");
assert(s.kpis.mediaLostContracts === 1, "compteur contrats perdus = 1");

// Revenu maintenance annuel : B exclu
const houses = s.houses.filter(h => h.isEquipped && h.channel !== "competitor");
const paying = houses.filter(h => !h.contractLost);
assert(paying.length === houses.length - 1, "B exclu du revenu de maintenance (" + paying.length + "/" + houses.length + ")");

// Re-declenchement pour A apres une nouvelle duree de vie
run(230); // jusqu'au jour ~530 : nouvelle echeance (~524) atteinte, delai de 30 j pas encore depasse
a = s.houses.find(h => h.id === hA.id);
assert(a.needsMediaReplacement, "nouveau cycle de remplacement pour A apres reset");

console.log("\nTous les tests passent ✅");
