// Fil de notifications non bloquant : les evenements mineurs s'empilent ici
// sans mettre le jeu en pause. Cliquer une notification liee a une maison
// ouvre son panneau. Les toasts expirent d'eux-memes apres quelques jours de jeu.
const ICONS = {
  leak: "\u{1F4A7}", mediaDue: "\u{1F504}", mediaLost: "❌",
  maintenanceLost: "\u{1F527}", questDone: "\u{1F3AF}", questFailed: "\u{1F614}",
};
const KIND = {
  leak: "danger", mediaLost: "danger", maintenanceLost: "danger",
  mediaDue: "warning", questFailed: "warning", questDone: "success",
};
const VISIBLE_DAYS = 10; // duree d'affichage en jours de jeu
const MAX_SHOWN = 5;

export default function NotificationFeed({ state, onDismiss, onFocusHouse }) {
  if (!state) return null;
  const notifs = (state.notifications || [])
    .filter(n => state.day - n.day <= VISIBLE_DAYS)
    .slice(-MAX_SHOWN);
  if (!notifs.length) return null;

  return (
    <div className="notif-feed">
      {notifs.map(n => (
        <div
          key={n.id}
          className={"notif notif-" + (KIND[n.type] || "info") + (n.houseId != null ? " notif-clickable" : "")}
          onClick={() => { if (n.houseId != null) onFocusHouse(n.houseId); }}
          title={n.houseId != null ? "Cliquer pour voir la maison #" + n.houseId : undefined}
        >
          <span className="notif-icon">{ICONS[n.type] || "ℹ"}</span>
          <span className="notif-msg"><strong>J{n.day}</strong> — {n.message}</span>
          <button
            className="notif-close"
            onClick={e => { e.stopPropagation(); onDismiss(n.id); }}
            title="Fermer"
          >×</button>
        </div>
      ))}
    </div>
  );
}
