const express = require("express");

module.exports = function (db) {
  const router = express.Router();

  router.post("/save", (req, res) => {
    try {
      const { name, state } = req.body;
      db.upsertSave(name, state);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/load/:name", (req, res) => {
    try {
      const save = db.getSave(req.params.name);
      if (!save) return res.status(404).json({ error: "Not found" });
      res.json({ state: save.state });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/list", (req, res) => {
    try {
      const saves = db.getSaves().map(({ state, ...rest }) => rest);
      res.json({ saves });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete("/:id", (req, res) => {
    try {
      db.deleteSave(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
