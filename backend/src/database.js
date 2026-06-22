const fs = require("fs");
const path = require("path");

const DB_DIR = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : path.join(__dirname, "..", "data");

const SAVES_FILE = path.join(DB_DIR, "saves.json");
const PARAMS_FILE = path.join(DB_DIR, "params.json");

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

function readJSON(file) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (e) {}
  return null;
}

function writeJSON(file, data) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

function initDB() {
  ensureDir();

  return {
    // === SAVES ===
    getSaves() {
      return readJSON(SAVES_FILE) || [];
    },
    getSave(name) {
      const saves = this.getSaves();
      return saves.find(s => s.name === name) || null;
    },
    upsertSave(name, state) {
      const saves = this.getSaves();
      const idx = saves.findIndex(s => s.name === name);
      const entry = {
        id: idx >= 0 ? saves[idx].id : Date.now(),
        name,
        state,
        created_at: idx >= 0 ? saves[idx].created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (idx >= 0) saves[idx] = entry;
      else saves.push(entry);
      writeJSON(SAVES_FILE, saves);
    },
    deleteSave(id) {
      let saves = this.getSaves();
      saves = saves.filter(s => s.id !== Number(id));
      writeJSON(SAVES_FILE, saves);
    },

    // === PARAMS ===
    getParams() {
      return readJSON(PARAMS_FILE);
    },
    setParams(params) {
      writeJSON(PARAMS_FILE, params);
    },
  };
}

module.exports = { initDB };
