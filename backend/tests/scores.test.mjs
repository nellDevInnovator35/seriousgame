// Test d'integration des routes /api/scores
import { spawn } from "child_process";

const srv = spawn("node", ["src/index.js"], { env: { ...process.env, PORT: "3199", DB_PATH: "/tmp/anc-scores-test.sqlite" } });
srv.stdout.on("data", d => process.stdout.write("[srv] " + d));
srv.stderr.on("data", d => process.stdout.write("[srv-err] " + d));
await new Promise(r => setTimeout(r, 2500));

const API = "http://localhost:3199/api";
const assert = (c, m) => { if (!c) { console.error("FAIL:", m); srv.kill(); process.exit(1); } console.log("OK:", m); };
const post = (body) => fetch(API + "/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json());

// KPIs coherents : CA 200k, couts 80k -> EBITDA 120k -> note A
const kpis = (ca, costs, extra = {}) => ({
  totalCA: ca, totalCostProduction: costs, totalCostLogistics: 0,
  totalCostMaintenance: 0, totalCostFixed: 0, totalCostInvestment: 0,
  deliveryCount: 50, satisfiedClients: 45, totalEquipped: 60, totalCompetitor: 20, ...extra,
});

const r1 = await post({ name: "Nell", difficulty: "normal", seed: 2026, kpis: kpis(200000, 80000) });
assert(r1.success && r1.entry.ebitda === 120000 && r1.entry.grade === "A", "EBITDA recalcule serveur (120k, note A)");
assert(r1.rank === 1, "premier score -> rang 1");
assert(r1.entry.satisfaction === 90 && r1.entry.ptShare === 75, "satisfaction 90% et part PT 75% calculees");

const r2 = await post({ name: "Alex", difficulty: "normal", seed: 2026, kpis: kpis(300000, 80000) });
assert(r2.rank === 1, "meilleur EBITDA -> passe rang 1");

const r3 = await post({ name: "Sam", difficulty: "expert", seed: 999, kpis: kpis(100000, 90000) });
assert(r3.rank === 1, "rang calcule PAR difficulte (expert separe)");

// Triche : EBITDA declare ignore, recalcul depuis les composantes
const r4 = await post({ name: "Tricheur", difficulty: "normal", seed: 1, kpis: { ...kpis(1000, 900), ebitda: 999999 } });
assert(r4.entry.ebitda === 100 && r4.entry.grade === "D", "EBITDA declare ignore -> recalcule (100 €)");

const all = (await (await fetch(API + "/scores")).json()).scores;
assert(all.length === 4 && all[0].name === "Alex", "GET /scores trie par EBITDA desc");

const norm = (await (await fetch(API + "/scores?difficulty=normal")).json()).scores;
assert(norm.length === 3 && norm.every(s => s.difficulty === "normal"), "filtre difficulte");

const chal = (await (await fetch(API + "/scores?difficulty=normal&seed=2026")).json()).scores;
assert(chal.length === 2 && chal[0].name === "Alex" && chal[1].name === "Nell", "filtre seed (challenge) : classement propre");

const bad = await fetch(API + "/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "", kpis: null }) });
assert(bad.status === 400, "requete invalide -> 400");

srv.kill();
console.log("\nTous les tests passent ✅");
process.exit(0);
