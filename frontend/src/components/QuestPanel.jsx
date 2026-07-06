import { QUEST_DEFS, questDeadlineDay } from "../config/quests.js";

// Panneau des objectifs de la partie (quetes selon la difficulte)
export default function QuestPanel({ state }) {
  const quests = state?.quests || [];
  if (!quests.length) return null;
  const p = state.params;

  return (
    <div className="production-panel quest-panel">
      <h3>🎯 Objectifs</h3>
      <ul className="quest-list">
        {quests.map(q => {
          const def = QUEST_DEFS[q.id];
          if (!def) return null;
          const done = q.status === "completed";
          const failed = q.status === "failed";
          const deadlineYear = Math.round(questDeadlineDay(def, p) / p.daysPerYear);
          const cur = def.progress ? def.progress(state) : null;
          return (
            <li key={q.id} className={"order-item quest-item" + (done ? " quest-done" : failed ? " quest-failed" : "")}>
              <div className="quest-title">
                <strong>{done ? "✅" : failed ? "❌" : def.icon} {def.title}</strong>
                <span className="quest-stars">{"⭐".repeat(def.stars)}</span>
              </div>
              <p className="quest-desc">
                {def.desc}
                {q.status === "active" && " · avant l'an " + deadlineYear}
                {def.reward ? " · prime " + def.reward.toLocaleString() + " €" : ""}
              </p>
              {def.progress != null && def.target != null && q.status === "active" && (
                <div className="quest-progress-row">
                  <div className="stock-bar">
                    <div className="stock-fill" style={{ width: Math.min(100, (cur / def.target) * 100) + "%" }} />
                  </div>
                  <span className="quest-progress">{cur}/{def.target}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
