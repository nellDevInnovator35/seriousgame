const TW = 64, TH = 32;

const C = {
  grass: "#7ec850", grassDk: "#5ea030", trees: "#2d8a4e", slope: "#c4a86c",
  hNone: "#999", hNeed: "#ffcc00", hDevis: "#ff9900", hOrder: "#ff6600",
  hShip: "#9966ff", hInst: "#6699ff", hDone: "#00aa44", hComp: "#dd3333",
  hLeak: "#ff0000", hMaint: "#ff66cc", hMedia: "#00cccc",
  factory: "#555", factClosed: "#aa3333",
  ps: "#ff8800", dist: "#8844cc", distComp: "#cc2222",
  trPT: "#0066cc", trDist: "#ff8800",
};

export function gridToScreen(gx, gy, ox, oy) {
  return { x: (gx - gy) * (TW / 2) + ox, y: (gx + gy) * (TH / 2) + oy };
}

export function screenToGrid(sx, sy, ox, oy) {
  const mx = sx - ox, my = sy - oy;
  return {
    x: Math.floor((mx / (TW / 2) + my / (TH / 2)) / 2),
    y: Math.floor((my / (TH / 2) - mx / (TW / 2)) / 2),
  };
}

function diamond(ctx, sx, sy, color) {
  ctx.beginPath();
  ctx.moveTo(sx, sy - TH / 2);
  ctx.lineTo(sx + TW / 2, sy);
  ctx.lineTo(sx, sy + TH / 2);
  ctx.lineTo(sx - TW / 2, sy);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function drawHouse(ctx, sx, sy, status, leak, maint, comp, media) {
  let color = C.hNone;
  if (comp) color = C.hComp;
  else if (leak) color = C.hLeak;
  else if (media) color = C.hMedia;
  else if (maint) color = C.hMaint;
  else {
    const m = {
      needsANC: C.hNeed, devisSent: C.hDevis, ordered: C.hOrder,
      shipping: C.hShip, installing: C.hInst, installed: C.hDone,
    };
    color = m[status] || C.hNone;
  }
  // Murs
  ctx.fillStyle = color;
  ctx.fillRect(sx - 9, sy - 18, 18, 14);
  // Toit
  ctx.beginPath();
  ctx.moveTo(sx - 12, sy - 18);
  ctx.lineTo(sx, sy - 28);
  ctx.lineTo(sx + 12, sy - 18);
  ctx.closePath();
  ctx.fillStyle = comp ? "#aa1111" : "#885533";
  ctx.fill();
  // Porte
  ctx.fillStyle = "#333";
  ctx.fillRect(sx - 3, sy - 10, 6, 6);
  // Indicateurs
  if (leak) {
    ctx.fillStyle = "#0af";
    ctx.font = "bold 12px Arial";
    ctx.fillText("\u2022", sx - 3, sy - 30);
  }
  if (maint) {
    ctx.fillStyle = "#fa0";
    ctx.font = "bold 10px Arial";
    ctx.fillText("\u2699", sx - 5, sy - 30);
  }
  if (media) {
    ctx.fillStyle = "#0cc";
    ctx.font = "bold 10px Arial";
    ctx.fillText("\u21bb", sx + 2, sy - 30);
  }
}

function drawBuilding(ctx, sx, sy, color, roof, label) {
  ctx.fillStyle = color;
  ctx.fillRect(sx - 16, sy - 20, 32, 16);
  ctx.fillStyle = roof;
  ctx.fillRect(sx - 18, sy - 22, 36, 4);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 7px Arial";
  ctx.textAlign = "center";
  ctx.fillText(label, sx, sy - 9);
  ctx.textAlign = "start";
}

function drawFactory(ctx, sx, sy, closed) {
  ctx.fillStyle = closed ? C.factClosed : C.factory;
  ctx.fillRect(sx - 24, sy - 28, 48, 24);
  ctx.fillStyle = "#333";
  ctx.fillRect(sx - 26, sy - 30, 52, 4);
  // Cheminee
  ctx.fillStyle = "#444";
  ctx.fillRect(sx + 10, sy - 44, 8, 16);
  // Fumee
  if (!closed) {
    ctx.fillStyle = "rgba(200,200,200,0.5)";
    ctx.beginPath();
    ctx.arc(sx + 14, sy - 48, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#fff";
  ctx.font = "bold 9px Arial";
  ctx.textAlign = "center";
  ctx.fillText(closed ? "FERMEE" : "USINE PT", sx, sy - 12);
  ctx.textAlign = "start";
}

function drawTruck(ctx, sx, sy, type) {
  ctx.fillStyle = type === "pt" ? C.trPT : C.trDist;
  ctx.fillRect(sx - 8, sy - 6, 16, 8);
  ctx.fillStyle = "#222";
  ctx.fillRect(sx + 5, sy - 4, 5, 5);
}

function drawLegend(ctx, x, y) {
  ctx.fillStyle = "rgba(22,33,62,0.92)";
  ctx.fillRect(x, y, 160, 214);
  ctx.strokeStyle = "#444";
  ctx.strokeRect(x, y, 160, 214);
  ctx.font = "bold 10px Arial";
  ctx.fillStyle = "#aaa";
  ctx.fillText("Legende", x + 8, y + 14);
  const items = [
    [C.hNeed, "Besoin ANC"], [C.hDevis, "Devis envoye"],
    [C.hOrder, "Commande"], [C.hShip, "En livraison"],
    [C.hInst, "Installation"], [C.hDone, "Installe PT"],
    [C.hComp, "Concurrent"], [C.hLeak, "Fuite !"],
    [C.hMedia, "Milieu filtrant"],
    [C.ps, "Point Service"], [C.dist, "Distributeur PT"],
    [C.distComp, "Distrib. Concurrent"], [C.factory, "Usine PT"],
    [C.trPT, "Camion PT"], [C.trDist, "Camion Distrib."],
  ];
  ctx.font = "9px Arial";
  items.forEach(([c, l], i) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + 8, y + 24 + i * 12, 8, 8);
    ctx.fillStyle = "#ccc";
    ctx.fillText(l, x + 20, y + 31 + i * 12);
  });
}

export function renderMap(ctx, canvas, state, hoveredTile, selectedHouse, placing) {
  const { tiles, factory, pointService, distributors, houses, trucks, day, params } = state;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const ox = canvas.width / 2, oy = 80;

  // Tuiles
  for (const t of tiles) {
    const { x: sx, y: sy } = gridToScreen(t.x, t.y, ox, oy);
    let c = C.grass;
    if (t.terrain === "trees") c = C.grassDk;
    else if (t.terrain === "slope") c = C.slope;
    const hov = hoveredTile && hoveredTile.x === t.x && hoveredTile.y === t.y;
    diamond(ctx, sx, sy, hov ? "#aaddaa" : c);
    // Arbres decoratifs
    if (t.terrain === "trees" && !t.building) {
      ctx.fillStyle = C.trees;
      ctx.beginPath(); ctx.arc(sx - 6, sy - 12, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + 7, sy - 10, 4, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Spheres d'influence distributeurs
  for (const d of distributors) {
    const { x: sx, y: sy } = gridToScreen(d.x, d.y, ox, oy);
    const rPx = d.radius * TW / 2;
    ctx.beginPath();
    ctx.ellipse(sx, sy, rPx, rPx / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(136,68,204,0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(136,68,204,0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Mode placement d'un Point Service : surligner les tuiles libres
  if (placing) {
    const extra = state.extraPointServices || [];
    for (const t of tiles) {
      const free = !t.building && !extra.some(e => e.x === t.x && e.y === t.y);
      if (!free) continue;
      const { x: sx, y: sy } = gridToScreen(t.x, t.y, ox, oy);
      diamond(ctx, sx, sy, "rgba(126,200,80,0.45)");
      ctx.strokeStyle = "rgba(126,200,80,0.9)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Zone ciblee par la guerre des prix (mise en evidence rouge)
  const war = state.activeEvents?.find(e => e.type === "competitorPriceWar" && day <= e.endDay);
  if (war && war.zoneHouseIds) {
    const zone = new Set(war.zoneHouseIds);
    for (const h of houses) {
      if (!zone.has(h.id)) continue;
      const { x: sx, y: sy } = gridToScreen(h.x, h.y, ox, oy);
      diamond(ctx, sx, sy, "rgba(221,51,51,0.30)");
      ctx.strokeStyle = "rgba(221,51,51,0.75)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    const td = distributors.find(d => d.id === war.distributorId);
    if (td) {
      const { x: sx, y: sy } = gridToScreen(td.x, td.y, ox, oy);
      ctx.beginPath();
      ctx.arc(sx, sy - 8, 28, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(221,51,51,0.95)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Labels communes
  ctx.font = "bold 12px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.textAlign = "center";
  const cA = gridToScreen(4, 5, ox, oy);
  ctx.fillText("COMMUNE A", cA.x, cA.y);
  const cB = gridToScreen(14, 5, ox, oy);
  ctx.fillText("COMMUNE B", cB.x, cB.y);
  ctx.textAlign = "start";

  // Point Service
  const ps = gridToScreen(pointService.x, pointService.y, ox, oy);
  drawBuilding(ctx, ps.x, ps.y, C.ps, "#cc6600", "POINT SVC");

  // Points Service supplementaires (investissements)
  for (const eps of (state.extraPointServices || [])) {
    const e = gridToScreen(eps.x, eps.y, ox, oy);
    drawBuilding(ctx, e.x, e.y, C.ps, "#cc6600", "PT SVC +");
  }

  // Distributeurs
  for (const d of distributors) {
    const ds = gridToScreen(d.x, d.y, ox, oy);
    drawBuilding(ctx, ds.x, ds.y,
      d.isCompetitor ? C.distComp : C.dist,
      d.isCompetitor ? "#881111" : "#6622aa",
      d.isCompetitor ? "CONCURRENT" : "DISTRIB."
    );
  }

  // Maisons
  for (const h of houses) {
    if (h.appearedDay !== null && h.appearedDay <= day) {
      const hs = gridToScreen(h.x, h.y, ox, oy);
      drawHouse(ctx, hs.x, hs.y, h.status, h.hasLeak, h.needsMaintenance, h.channel === "competitor", h.needsMediaReplacement);
      if (selectedHouse === h.id) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(hs.x - 12, hs.y - 30, 24, 30);
      }
    }
  }

  // Usine
  const fs = gridToScreen(factory.x, factory.y, ox, oy);
  drawFactory(ctx, fs.x, fs.y, factory.isClosed);

  // Camions en mouvement
  for (const tr of trucks) {
    const prog = Math.min(1, (day - tr.departDay) / Math.max(1, tr.arriveDay - tr.departDay));
    const tx = tr.fromX + (tr.toX - tr.fromX) * prog;
    const ty = tr.fromY + (tr.toY - tr.fromY) * prog;
    const ts = gridToScreen(tx, ty, ox, oy);
    drawTruck(ctx, ts.x, ts.y, tr.type);
  }

  // Legende
  drawLegend(ctx, canvas.width - 170, 10);

  // Infos temps en haut a gauche
  ctx.fillStyle = "#ddd";
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "left";
  const yr = Math.floor(day / params.daysPerYear) + 1;
  const mo = (Math.floor(day / params.daysInMonth) % 12) + 1;
  const wk = (Math.floor(day / 7) % 4) + 1;
  ctx.fillText("Annee " + yr + " - Mois " + mo + " - Sem " + wk + " - Jour " + day, 10, 20);

  if (war) {
    ctx.fillStyle = "#ff5555";
    ctx.font = "bold 12px Arial";
    ctx.fillText("⚔ Guerre des prix : zone ciblee en rouge", 10, 38);
  }

  return { offsetX: ox, offsetY: oy };
}

export { TW, TH, C };
