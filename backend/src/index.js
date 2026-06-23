const express = require("express");
const cors = require("cors");
const { initDB } = require("./database");
const gameRoutes = require("./routes/game");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json({ limit: "10mb" }));

async function main() {
  const db = await initDB();
  app.use("/api/game", gameRoutes(db));
  app.use("/api/admin", adminRoutes(db));
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.listen(PORT, () => console.log("SmartCity ANC Backend port " + PORT));
}

main().catch((err) => {
  console.error("Echec du demarrage du backend :", err);
  process.exit(1);
});