import { DEFAULT_PARAMS } from "../config/defaultParams.js";

export function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function findNearestDistributor(h, ds) {
  let n = null, m = Infinity;
  for (const d of ds) {
    const dd = distance(h, d);
    if (dd <= d.radius && dd < m) { m = dd; n = d; }
  }
  return n;
}

// Les n maisons les plus proches d'un point (ex: un distributeur) -> zone d'influence
export function findNearestHouses(point, hs, n) {
  return hs
    .map(x => ({ h: x, d: distance(point, x) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map(e => e.h);
}

export function findNearestNeighbors(h, hs, n) {
  return hs.filter(x => x.id !== h.id)
    .map(x => ({ h: x, d: distance(h, x) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map(e => e.h);
}

export function generateMap(params = DEFAULT_PARAMS, rand = Math.random) {
  const { mapWidth: W, mapHeight: H, totalHouses: TH, initialHouses: IH,
    nbDistributors: ND, distributorRadius: DR, terrainIssueRate: TI } = params;

  // Grille de tuiles (2 communes cote a cote)
  const tiles = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const commune = x < W / 2 ? "A" : "B";
      const r = rand();
      const terrain = r < 0.12 ? "trees" : r < 0.20 ? "slope" : "grass";
      tiles.push({ x, y, commune, terrain, building: null, houseId: null });
    }
  }

  // Usine hors communes
  const factory = {
    x: Math.floor(W / 2), y: H + 2,
    stock: { ecoflo4: 0, ecoflo5: 0, eparco4: 0, eparco5: 0, media: 0 },
    totalStock: 0, isClosed: false, closedUntilDay: 0,
  };

  // Point Service dans commune A
  const psx = Math.floor(rand() * (W / 2 - 2)) + 1;
  const psy = Math.floor(rand() * (H - 2)) + 1;
  const pointService = { x: psx, y: psy, commune: "A" };
  const psTile = tiles.find(t => t.x === psx && t.y === psy);
  if (psTile) { psTile.building = "pointService"; psTile.terrain = "grass"; }

  // Distributeurs aleatoires
  const distributors = [];
  for (let i = 0; i < ND; i++) {
    let dx, dy, attempts = 0;
    do {
      dx = Math.floor(rand() * W);
      dy = Math.floor(rand() * H);
      attempts++;
    } while (attempts < 100 && (
      tiles.find(t => t.x === dx && t.y === dy)?.building ||
      distributors.some(d => d.x === dx && d.y === dy)
    ));
    distributors.push({
      id: i, x: dx, y: dy, radius: DR,
      ptSalesCount: 0, totalSalesCount: 0,
      isCompetitor: false, switchedDay: null,
    });
    const dt = tiles.find(t => t.x === dx && t.y === dy);
    if (dt) { dt.building = "distributor"; dt.terrain = "grass"; }
  }

  // Maisons
  const houses = [];
  const avail = tiles.filter(t => !t.building);
  // Melange Fisher-Yates deterministe (via rand seedable)
  for (let i = avail.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [avail[i], avail[j]] = [avail[j], avail[i]];
  }
  for (let i = 0; i < Math.min(TH, avail.length); i++) {
    const t = avail[i];
    houses.push({
      id: i, x: t.x, y: t.y, commune: t.commune,
      inhabitants: rand() < 0.5 ? 4 : 5,
      terrain: t.terrain,
      hasTerrainIssue: rand() < TI,
      status: "none",       // none|needsANC|devisSent|ordered|shipping|installing|installed
      channel: null,         // null|pointService|distributor|competitor
      product: null,         // null|ecoflo4|ecoflo5|eparco4|eparco5
      orderDay: null,
      devisSentDay: null,
      installDay: null,
      lastMaintenanceDay: null,
      satisfaction: 1,
      hasDemand: false,
      demandDay: null,
      isInitial: i < IH,
      appearedDay: i < IH ? 0 : null,
      isEquipped: false,
      needsMaintenance: false,
      maintenanceDueDay: null,  // jour ou la maintenance est devenue necessaire
      hasLeak: false,
      leakDay: null,
      // Milieu filtrant (Ecoflo uniquement)
      needsMediaReplacement: false,
      mediaDueDay: null,        // jour ou le besoin est apparu
      mediaInstallDay: null,    // dernier remplacement (reset de la duree de vie)
      mediaShipping: false,     // milieu filtrant en cours de livraison
      contractLost: false,      // contrat de maintenance perdu (media non remplace)
    });
    t.building = "house";
    t.houseId = i;
  }

  return { tiles, factory, pointService, distributors, houses };
}
