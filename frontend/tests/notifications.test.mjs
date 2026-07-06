// Tests : evenements mineurs -> notifications (sans pause) ; majeurs -> popup
import { DEFAULT_PARAMS } from "../src/config/defaultParams.js";
import { createInitialState, advanceDay } from "../src/engine/GameEngine.js";

const assert = (cond, msg) => { if (!cond) { console.error("FAIL:", msg); process.exit(1); } console.log("OK:", msg); };

const calm = {
  ...DEFAULT_PARAMS, difficulty: "facile", seed: 21,
  eventLeakProba: 0, eventFactoryProba: 0, eventPriceWarProba: 0,
  distributorAutoCaptureRate: 0, newHousesPerMonthMin: 0, newHousesPerMonthMax: 0,
};

// ========== 1) Fuite -> notification, PAS de popup ==========
let s = createInitialState({ ...calm, eventLeakProba: 1 });
const h = s.houses.find(x => x.status === "needsANC");
h.channel = "distributor"; h.product = "eparco4"; h.status = "installing";
s = advanceDay(s); // installation
s = advanceDay(s); // fuite garantie (proba 1)
assert(s.notifications.some(n => n.type === "leak"), "fuite -> notification dans le fil");
assert(s.showEvent === null || s.showEvent === undefined || s.showEvent?.type !== "leak",
  "fuite -> aucun popup bloquant");
const leakNotif = s.notifications.find(n => n.type === "leak");
assert(leakNotif.houseId === h.id && leakNotif.day >= 1 && leakNotif.day <= s.day,
  "notification liee a la maison et datee");

// ========== 2) Quete completee -> notification questDone ==========
let q = createInitialState(calm);
q.houses.filter(x => x.status === "needsANC").slice(0, 10).forEach(x => {
  x.channel = "distributor"; x.product = "ecoflo4"; x.status = "installing";
});
q = advanceDay(q);
assert(q.notifications.some(n => n.type === "questDone"), "quete reussie -> notification (pas de popup)");
assert(!q.showEvent, "aucun popup pour la quete");

// ========== 3) Fermeture usine -> popup (evenement majeur) ==========
let f = createInitialState({ ...calm, eventFactoryProba: 1 });
f = advanceDay(f);
assert(f.showEvent?.type === "factoryClosure", "fermeture usine -> popup bloquant conserve");

// ========== 4) Plafond du fil : 30 notifications max ==========
let c = createInitialState({ ...calm, eventLeakProba: 1, eventLeakMaxDays: 9999 });
c.houses.slice(0, 40).forEach(x => {
  x.status = "installed"; x.isEquipped = true; x.channel = "distributor";
  x.product = "eparco4"; x.installDay = 0; x.lastMaintenanceDay = 0; x.appearedDay = 0;
});
for (let i = 0; i < 40; i++) { c.showEvent = null; c = advanceDay(c); } // 1 fuite/jour
assert(c.notifications.length <= 30, "fil plafonne a 30 notifications (" + c.notifications.length + ")");
assert(c.notifications.filter(n => n.type === "leak").length >= 30, "les fuites se sont bien accumulees");

console.log("\nTous les tests passent ✅");
