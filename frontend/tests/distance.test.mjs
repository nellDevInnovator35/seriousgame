// Tests : delais fonction de la distance + files d'installation par Point Service
import { DEFAULT_PARAMS } from "../src/config/defaultParams.js";
import { createInitialState, advanceDay, shipProduct, shipMedia, placePointService, tripDays } from "../src/engine/GameEngine.js";
import { distance } from "../src/engine/MapGenerator.js";

const assert = (cond, msg) => { if (!cond) { console.error("FAIL:", msg); process.exit(1); } console.log("OK:", msg); };

const calm = {
  ...DEFAULT_PARAMS, difficulty: "facile", seed: 11,
  eventLeakProba: 0, eventFactoryProba: 0, eventPriceWarProba: 0,
  distributorAutoCaptureRate: 0, newHousesPerMonthMin: 0, newHousesPerMonthMax: 0,
};

// ========== 1) Duree de trajet = f(distance usine -> maison) ==========
let s = createInitialState(calm);
const byDist = [...s.houses].sort((a, b) => distance(s.factory, a) - distance(s.factory, b));
const near = byDist[0], far = byDist[byDist.length - 1];
const dNear = distance(s.factory, near), dFar = distance(s.factory, far);
assert(dFar > dNear + calm.tripKmPerDay, "carte : ecart de distance suffisant (" + dNear.toFixed(1) + " vs " + dFar.toFixed(1) + " km)");

for (const h of [near, far]) { h.status = "ordered"; h.channel = "distributor"; h.product = "ecoflo4"; h.hasDemand = true; }
s.factory.stock.ecoflo4 = 5; s.factory.totalStock = 5;

s = shipProduct(s, near.id);
s = shipProduct(s, far.id);
const tNear = s.trucks.find(t => t.targetHouseId === near.id);
const tFar = s.trucks.find(t => t.targetHouseId === far.id);
const expNear = Math.max(calm.tripDuration, Math.ceil(dNear / calm.tripKmPerDay));
const expFar = Math.max(calm.tripDuration, Math.ceil(dFar / calm.tripKmPerDay));
assert(tNear.arriveDay - s.day === expNear, "maison proche : trajet " + expNear + " j");
assert(tFar.arriveDay - s.day === expFar, "maison lointaine : trajet " + expFar + " j");
assert(expFar > expNear, "livrer loin prend plus de temps (" + expFar + " j > " + expNear + " j)");
assert(tripDays(calm, s.factory, far) === expFar, "tripDays() coherent");

// Milieu filtrant : meme regle de distance
let sm = createInitialState(calm);
const fm = [...sm.houses].sort((a, b) => distance(sm.factory, b) - distance(sm.factory, a))[0];
fm.isEquipped = true; fm.channel = "distributor"; fm.product = "ecoflo4";
fm.needsMediaReplacement = true; fm.mediaDueDay = 0; fm.installDay = 0; fm.lastMaintenanceDay = 0;
sm.factory.stock.media = 1; sm.factory.totalStock = 1;
sm = shipMedia(sm, fm.id);
const tm = sm.trucks.find(t => t.cargo === "media");
assert(tm.arriveDay - sm.day === tripDays(calm, sm.factory, fm), "milieu filtrant : trajet fonction de la distance");

// ========== 2) Files d'installation par Point Service ==========
// Deux maisons en attente de pose : avec 1 seul PS -> 1 pose/jour.
let q = createInitialState(calm);
const cand = [...q.houses].sort((a, b) => distance(q.pointService, a) - distance(q.pointService, b));
const h1 = cand[0]; // proche du PS principal
const h2 = [...q.houses].sort((a, b) => distance(q.pointService, b) - distance(q.pointService, a))[0]; // la plus loin du PS
for (const h of [h1, h2]) { h.status = "installing"; h.channel = "pointService"; h.product = "eparco4"; h.demandDay = 0; h.hasDemand = true; }
q.showEvent = null; q = advanceDay(q);
const installed1 = [h1, h2].filter(h => q.houses.find(x => x.id === h.id).isEquipped).length;
assert(installed1 === 1, "1 seul Point Service -> 1 pose/jour (file unique)");

// Meme scenario avec un 2e PS place PRES de la maison lointaine -> 2 poses le meme jour.
let q2 = createInitialState(calm);
const g1 = q2.houses.find(h => h.id === h1.id), g2 = q2.houses.find(h => h.id === h2.id);
for (const h of [g1, g2]) { h.status = "installing"; h.channel = "pointService"; h.product = "eparco4"; h.demandDay = 0; h.hasDemand = true; }
// trouver une tuile libre adjacente a g2
let placed = false;
outer: for (let dx = -2; dx <= 2; dx++) {
  for (let dy = -2; dy <= 2; dy++) {
    const nx = g2.x + dx, ny = g2.y + dy;
    if (nx < 0 || ny < 0) continue;
    const next = placePointService(q2, nx, ny);
    if (next !== q2) { q2 = next; placed = true; break outer; }
  }
}
assert(placed, "2e Point Service place pres de la maison lointaine");
q2.showEvent = null; q2 = advanceDay(q2);
const installed2 = [g1, g2].filter(h => q2.houses.find(x => x.id === h.id).isEquipped).length;
assert(installed2 === 2, "2 Points Service bien places -> 2 poses le meme jour (files locales)");

// Contre-test : 2 maisons dans la MEME zone (les 2 plus proches du PS principal)
// et un 2e PS place a l'autre bout de la carte -> il n'apporte rien : 1 seule pose.
let q3 = createInitialState(calm);
const sorted3 = [...q3.houses].sort((a, b) => distance(q3.pointService, a) - distance(q3.pointService, b));
const k1 = sorted3[0], k2 = sorted3[1]; // toutes deux collees au PS principal
for (const h of [k1, k2]) { h.status = "installing"; h.channel = "pointService"; h.product = "eparco4"; h.demandDay = 0; h.hasDemand = true; }
const farCorner = [...q3.houses].sort((a, b) => distance(q3.pointService, b) - distance(q3.pointService, a))[0];
let placedBad = false;
outerB: for (let dx = -2; dx <= 2; dx++) {
  for (let dy = -2; dy <= 2; dy++) {
    const nx = farCorner.x + dx, ny = farCorner.y + dy;
    if (nx < 0 || ny < 0) continue;
    const next = placePointService(q3, nx, ny);
    if (next !== q3) { q3 = next; placedBad = true; break outerB; }
  }
}
assert(placedBad, "2e Point Service place loin de la demande (mauvais placement)");
q3.showEvent = null; q3 = advanceDay(q3);
const installed3 = [k1, k2].filter(h => q3.houses.find(x => x.id === h.id).isEquipped).length;
assert(installed3 === 1, "PS loin de la demande : toujours 1 pose/jour -> le placement compte");

console.log("\nTous les tests passent ✅");
