const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

const DB_DIR = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : path.join(__dirname, "..", "data");
const DB_FILE = process.env.DB_PATH || path.join(DB_DIR, "smartcity.sqlite");

// Anciens fichiers JSON (pour migration automatique unique)
const SAVES_FILE = path.join(DB_DIR, "saves.json");
const PARAMS_FILE = path.join(DB_DIR, "params.json");

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

function readJSON(file) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (e) { /* ignore */ }
  return null;
}

// initDB est asynchrone : sql.js (WASM) doit etre charge avant usage.
async function initDB() {
  ensureDir();
  const SQL = await initSqlJs({
    locateFile: (f) => path.join(__dirname, "..", "node_modules", "sql.js", "dist", f),
  });

  const db = fs.existsSync(DB_FILE)
    ? new SQL.Database(fs.readFileSync(DB_FILE))
    : new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS saves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      state TEXT,
      created_at TEXT,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS params (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      difficulty TEXT,
      seed TEXT,
      ebitda INTEGER,
      ca INTEGER,
      satisfaction REAL,
      pt_share REAL,
      grade TEXT,
      created_at TEXT
    );
  `);

  const persist = () => {
    ensureDir();
    fs.writeFileSync(DB_FILE, Buffer.from(db.export()));
  };

  const api = {
    // === SAVES ===
    getSaves() {
      const stmt = db.prepare(
        "SELECT id, name, state, created_at, updated_at FROM saves ORDER BY updated_at DESC"
      );
      const rows = [];
      while (stmt.step()) {
        const r = stmt.getAsObject();
        try { r.state = JSON.parse(r.state); } catch (e) { r.state = null; }
        rows.push(r);
      }
      stmt.free();
      return rows;
    },
    getSave(name) {
      const stmt = db.prepare("SELECT id, name, state, created_at, updated_at FROM saves WHERE name = ?");
      stmt.bind([name]);
      let row = null;
      if (stmt.step()) {
        row = stmt.getAsObject();
        try { row.state = JSON.parse(row.state); } catch (e) { row.state = null; }
      }
      stmt.free();
      return row;
    },
    upsertSave(name, state) {
      const now = new Date().toISOString();
      db.run(
        `INSERT INTO saves (name, state, created_at, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(name) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`,
        [name, JSON.stringify(state), now, now]
      );
      persist();
    },
    deleteSave(id) {
      db.run("DELETE FROM saves WHERE id = ?", [Number(id)]);
      persist();
    },

    // === SCORES (leaderboard) ===
    addScore(e) {
      const now = new Date().toISOString();
      db.run(
        `INSERT INTO scores (name, difficulty, seed, ebitda, ca, satisfaction, pt_share, grade, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [e.name, e.difficulty, e.seed, e.ebitda, e.ca, e.satisfaction, e.ptShare, e.grade, now]
      );
      persist();
      // Rang dans la meme difficulte (1 = meilleur EBITDA)
      const stmt = db.prepare(
        "SELECT COUNT(*) AS n FROM scores WHERE difficulty = ? AND ebitda > ?"
      );
      stmt.bind([e.difficulty, e.ebitda]);
      stmt.step();
      const rank = stmt.getAsObject().n + 1;
      stmt.free();
      return { rank };
    },
    getScores({ difficulty, seed, limit = 50 } = {}) {
      let sql = "SELECT id, name, difficulty, seed, ebitda, ca, satisfaction, pt_share, grade, created_at FROM scores";
      const where = [], args = [];
      if (difficulty) { where.push("difficulty = ?"); args.push(difficulty); }
      if (seed) { where.push("seed = ?"); args.push(String(seed)); }
      if (where.length) sql += " WHERE " + where.join(" AND ");
      sql += " ORDER BY ebitda DESC, created_at ASC LIMIT " + Math.min(Number(limit) || 50, 200);
      const stmt = db.prepare(sql);
      stmt.bind(args);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows;
    },

    // === PARAMS ===
    getParams() {
      const stmt = db.prepare("SELECT data FROM params WHERE id = 1");
      let params = null;
      if (stmt.step()) {
        const r = stmt.getAsObject();
        try { params = JSON.parse(r.data); } catch (e) { params = null; }
      }
      stmt.free();
      return params;
    },
    setParams(params) {
      db.run(
        `INSERT INTO params (id, data) VALUES (1, ?)
         ON CONFLICT(id) DO UPDATE SET data = excluded.data`,
        [JSON.stringify(params)]
      );
      persist();
    },
  };

  migrateFromJSON(db, api, persist);
  return api;
}

// Migration unique des anciens fichiers JSON vers SQLite (si presents et base vide)
function migrateFromJSON(db, api, persist) {
  try {
    const countStmt = db.prepare("SELECT COUNT(*) AS n FROM saves");
    countStmt.step();
    const empty = countStmt.getAsObject().n === 0;
    countStmt.free();
    if (!empty) return;

    const oldSaves = readJSON(SAVES_FILE);
    if (Array.isArray(oldSaves)) {
      for (const s of oldSaves) {
        db.run(
          `INSERT OR IGNORE INTO saves (name, state, created_at, updated_at) VALUES (?, ?, ?, ?)`,
          [s.name, JSON.stringify(s.state), s.created_at || new Date().toISOString(), s.updated_at || new Date().toISOString()]
        );
      }
    }
    const oldParams = readJSON(PARAMS_FILE);
    if (oldParams) api.setParams(oldParams);
    persist();
    if (oldSaves || oldParams) console.log("Migration JSON -> SQLite effectuee.");
  } catch (e) { /* migration best-effort */ }
}

module.exports = { initDB };
