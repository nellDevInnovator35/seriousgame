import { useRef, useEffect, useCallback } from "react";
import { renderMap, screenToGrid } from "./IsometricRenderer.js";

export default function GameMap({ state, onHouseClick, onBuildingClick, selectedHouse }) {
  const canvasRef = useRef(null);
  const hovRef = useRef(null);
  const offRef = useRef({ offsetX: 0, offsetY: 0 });

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv || !state) return;
    offRef.current = renderMap(cv.getContext("2d"), cv, state, hovRef.current, selectedHouse);
  }, [state, selectedHouse]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const resize = () => {
      const p = cv.parentElement;
      cv.width = p.clientWidth;
      cv.height = p.clientHeight;
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  const onMove = useCallback((e) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const g = screenToGrid(
      e.clientX - r.left, e.clientY - r.top,
      offRef.current.offsetX, offRef.current.offsetY
    );
    hovRef.current = (g.x >= 0 && g.x < state.params.mapWidth && g.y >= 0 && g.y < state.params.mapHeight) ? g : null;
    draw();
  }, [state, draw]);

  const onClick = useCallback((e) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const g = screenToGrid(
      e.clientX - r.left, e.clientY - r.top,
      offRef.current.offsetX, offRef.current.offsetY
    );
    // Batiments cliquables -> fiche metier
    if (onBuildingClick) {
      const f = state.factory, ps = state.pointService;
      if (f && g.x === f.x && g.y === f.y) { onBuildingClick("usine"); return; }
      if (ps && g.x === ps.x && g.y === ps.y) { onBuildingClick("pointService"); return; }
      if (state.distributors.some(d => d.x === g.x && d.y === g.y)) { onBuildingClick("distributeur"); return; }
    }
    const house = state.houses.find(h =>
      h.x === g.x && h.y === g.y &&
      h.appearedDay !== null && h.appearedDay <= state.day
    );
    if (house) onHouseClick(house.id);
  }, [state, onHouseClick, onBuildingClick]);

  return (
    <div className="game-map-container">
      <canvas
        ref={canvasRef}
        onMouseMove={onMove}
        onClick={onClick}
        style={{ cursor: "pointer" }}
      />
    </div>
  );
}
