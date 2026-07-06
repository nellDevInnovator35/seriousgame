const API = "/api";
export const gameApi = {
  async save(name, state) {
    const res = await fetch(API + "/game/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, state }),
    });
    return res.json();
  },
  async load(name) {
    const res = await fetch(API + "/game/load/" + encodeURIComponent(name));
    if (!res.ok) return null;
    return (await res.json()).state;
  },
  async list() {
    try { return (await (await fetch(API + "/game/list")).json()).saves || []; }
    catch (e) { return []; }
  },
  async getParams() {
    try { return (await (await fetch(API + "/admin/params")).json()).params; }
    catch (e) { return null; }
  },
  async publishScore(payload) {
    try {
      const res = await fetch(API + "/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e) { return null; }
  },
  async getScores({ difficulty, seed } = {}) {
    const q = new URLSearchParams();
    if (difficulty) q.set("difficulty", difficulty);
    if (seed) q.set("seed", seed);
    try { return (await (await fetch(API + "/scores?" + q)).json()).scores || []; }
    catch (e) { return []; }
  },
  async saveParams(params) {
    return fetch(API + "/admin/params", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ params }),
    }).then(r => r.json());
  },
};