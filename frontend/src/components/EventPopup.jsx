export default function EventPopup({ event, onClose }) {
  if (!event) return null;

  const icons = {
    leak: "\u{1F4A7}",
    factoryClosure: "\u{1F3ED}",
    competitorPriceWar: "\u{1F4B8}",
    distributorSwitch: "\u{1F4E6}",
    mediaDue: "\u{1F504}",
    mediaLost: "❌",
    maintenanceLost: "\u{1F527}",
    questDone: "\u{1F3AF}",
    questFailed: "\u{1F614}",
  };

  const titles = {
    leak: "Fuite detectee !",
    factoryClosure: "Usine fermee !",
    competitorPriceWar: "Guerre des prix !",
    distributorSwitch: "Distributeur perdu !",
    mediaDue: "Milieu filtrant en fin de vie !",
    mediaLost: "Contrat perdu !",
    maintenanceLost: "Contrat resilie !",
    questDone: "Objectif atteint !",
    questFailed: "Objectif manque...",
  };

  return (
    <div className="event-overlay">
      <div className="event-popup">
        <div className="event-icon">{icons[event.type] || "\u26A0"}</div>
        <h3>{titles[event.type] || "Evenement"}</h3>
        <p>{event.message}</p>
        <button className="btn btn-primary" onClick={onClose}>
          Compris !
        </button>
      </div>
    </div>
  );
}
