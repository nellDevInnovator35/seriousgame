const express = require("express");

module.exports = function (db) {
  const router = express.Router();

  router.get("/params", (req, res) => {
    try {
      res.json({ params: db.getParams() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/params", (req, res) => {
    try {
      db.setParams(req.body.params);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
