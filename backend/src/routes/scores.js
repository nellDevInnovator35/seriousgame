const express = require("express");

// L'EBITDA et la note sont RECALCULES cote serveur a partir des KPIs envoyes :
// un score publie ne peut pas annoncer un EBITDA incoherent avec ses composantes.
function computeEbitda(k = {}) {
  const costs = (k.totalCostProduction || 0) + (k.totalCostLogistics || 0)
    + (k.totalCostMaintenance || 0) + (k.totalCostFixed || 0)
    + (k.totalCostInvestment || 0);
  return (k.totalCA || 0) - costs;
}

function gradeOf(e) {
  return e > 150000 ? "A+" : e > 100000 ? "A" : e > 60000 ? "B"
    : e > 30000 ? "C" : e > 0 ? "D" : "E";
}

module.exports = function (db) {
  const router = express.Router();

  // Publier un score
  router.post("/", (req, res) => {
    try {
      const { name, difficulty, seed, kpis } = req.body;
      if (!name || typeof name !== "string" || !name.trim() || !kpis) {
        return res.status(400).json({ error: "name et kpis requis" });
      }
      const ebitda = Math.round(computeEbitda(kpis));
      const satisfaction = kpis.deliveryCount > 0
        ? Math.round((kpis.satisfiedClients / kpis.deliveryCount) * 1000) / 10
        : 100;
      const equipped = (kpis.totalEquipped || 0) + (kpis.totalCompetitor || 0);
      const ptShare = equipped > 0
        ? Math.round(((kpis.totalEquipped || 0) / equipped) * 1000) / 10
        : 0;
      const entry = {
        name: name.trim().slice(0, 30),
        difficulty: ["facile", "normal", "expert"].includes(difficulty) ? difficulty : "normal",
        seed: seed != null ? String(seed) : "",
        ebitda,
        ca: Math.round(kpis.totalCA || 0),
        satisfaction,
        ptShare,
        grade: gradeOf(ebitda),
      };
      const { rank } = db.addScore(entry);
      res.json({ success: true, rank, entry });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Classement : GET /api/scores?difficulty=normal&seed=2026&limit=50
  router.get("/", (req, res) => {
    try {
      const { difficulty, seed, limit } = req.query;
      res.json({ scores: db.getScores({ difficulty, seed, limit }) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
