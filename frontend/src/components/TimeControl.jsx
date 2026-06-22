export default function TimeControl({ state, onTogglePlay, onSetSpeed, onStopGame }) {
  const { isRunning, speed, day, params } = state;
  const yr = Math.floor(day / params.daysPerYear) + 1;
  const mo = (Math.floor(day / params.daysInMonth) % 12) + 1;
  const wk = (Math.floor(day / 7) % 4) + 1;
  const prog = (day / (params.gameDurationYears * params.daysPerYear)) * 100;

  return (
    <div className="time-control">
      <div className="time-display">
        <span className="time-year">An {yr}/{params.gameDurationYears}</span>
        <span className="time-detail">Mois {mo} - Sem. {wk}</span>
      </div>

      <div className="time-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: prog + "%" }} />
        </div>
      </div>

      <div className="time-buttons">
        <button
          className={"btn " + (isRunning ? "btn-pause" : "btn-play")}
          onClick={onTogglePlay}
        >
          {isRunning ? "\u23F8 Pause" : "\u25B6 Jouer"}
        </button>

        <div className="speed-buttons">
          {[1, 2, 5, 10].map(s => (
            <button
              key={s}
              className={"btn btn-speed " + (speed === s ? "active" : "")}
              onClick={() => onSetSpeed(s)}
            >
              x{s}
            </button>
          ))}
        </div>

        <button className="btn btn-danger btn-stop" onClick={onStopGame}>
          Stop
        </button>
      </div>
    </div>
  );
}
