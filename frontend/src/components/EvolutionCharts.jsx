// Courbes d'evolution en SVG pur (aucune dependance externe).
// Affiche l'evolution des finances et de la performance au fil de la partie.

const PAD = { l: 56, r: 14, t: 12, b: 24 };
const W = 620, H = 200;

function niceMax(v) {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function LineChart({ title, data, series, yMin, yMax, fmt }) {
  if (!data || data.length === 0) {
    return <div className="chart-empty">Pas encore de donnees</div>;
  }
  const xs = data.map(d => d.day);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  let lo = yMin, hi = yMax;
  if (lo == null || hi == null) {
    const all = data.flatMap(d => series.map(s => d[s.key] ?? 0));
    lo = yMin != null ? yMin : Math.min(0, ...all);
    hi = yMax != null ? yMax : niceMax(Math.max(1, ...all));
  }
  const sx = x => PAD.l + (xMax === xMin ? 0 : (x - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const sy = y => PAD.t + (1 - (hi === lo ? 0 : (y - lo) / (hi - lo))) * (H - PAD.t - PAD.b);

  const yTicks = 4;
  const gridY = Array.from({ length: yTicks + 1 }, (_, i) => lo + (hi - lo) * i / yTicks);
  const years = [...new Set(data.map(d => Math.round(d.year)))];

  return (
    <div className="chart">
      <div className="chart-title">{title}</div>
      <div className="chart-legend">
        {series.map(s => (
          <span key={s.key} className="chart-legend-item">
            <span className="chart-swatch" style={{ background: s.color }} />{s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" preserveAspectRatio="xMidYMid meet">
        {gridY.map((v, i) => (
          <g key={i}>
            <line x1={PAD.l} y1={sy(v)} x2={W - PAD.r} y2={sy(v)} stroke="rgba(255,255,255,0.08)" />
            <text x={PAD.l - 6} y={sy(v) + 3} textAnchor="end" className="chart-axis">{fmt(v)}</text>
          </g>
        ))}
        {years.map((yr, i) => {
          const pt = data.find(d => Math.round(d.year) === yr);
          if (!pt) return null;
          return <text key={i} x={sx(pt.day)} y={H - 8} textAnchor="middle" className="chart-axis">An {yr}</text>;
        })}
        {lo < 0 && <line x1={PAD.l} y1={sy(0)} x2={W - PAD.r} y2={sy(0)} stroke="rgba(255,255,255,0.25)" />}
        {series.map(s => (
          <polyline
            key={s.key}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            points={data.map(d => `${sx(d.day)},${sy(d[s.key] ?? 0)}`).join(" ")}
          />
        ))}
      </svg>
    </div>
  );
}

const eur = v => Math.abs(v) >= 1000 ? Math.round(v / 1000) + "k€" : Math.round(v) + "€";
const pct = v => Math.round(v) + "%";

export default function EvolutionCharts({ history }) {
  if (!history || history.length < 2) {
    return <p className="text-muted">Les courbes apparaissent apres quelques mois de jeu.</p>;
  }
  return (
    <div className="charts">
      <LineChart
        title="💶 Finances cumulees"
        data={history}
        fmt={eur}
        series={[
          { key: "ca", label: "CA PT", color: "#4a90d9" },
          { key: "ebitda", label: "EBITDA", color: "#7ec850" },
          { key: "competitorCA", label: "CA concurrent", color: "#dd3333" },
        ]}
      />
      <LineChart
        title="📈 Performance (%)"
        data={history}
        fmt={pct}
        yMin={0}
        yMax={100}
        series={[
          { key: "satisfaction", label: "Satisfaction", color: "#ffcc00" },
          { key: "ptShare", label: "Part de marche PT", color: "#00aa88" },
        ]}
      />
    </div>
  );
}
