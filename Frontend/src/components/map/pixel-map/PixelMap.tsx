"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CONFIG, TILE_META, type PixelMapData, type TileMeta } from "./config";
import { MapEngine } from "./map-engine";
import { Entities } from "./entities";

type ToolMode = "tree" | "fountain" | "pan" | "info";

const MODE_HINTS: Record<ToolMode, string> = {
  tree: "\u{1F331} Cliquez sur une zone pour planter un arbre.",
  fountain: "\u26F2 Cliquez pour installer un point d'eau.",
  pan: "\u270B Clic + glisser pour naviguer. Scroll pour zoomer.",
  info: "\u{1F50D} Cliquez sur une zone pour voir ses infos.",
};

const PIXEL_MAP_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');

.pm-wrap { position:relative; flex:1; overflow:hidden; cursor:crosshair; background:#050e05; }
.pm-wrap.pan { cursor:grab; }
.pm-wrap.pan.drag { cursor:grabbing; }
.pm-canvas { position:absolute; top:0; left:0; image-rendering:pixelated; image-rendering:crisp-edges; transform-origin:0 0; }
.pm-heat-canvas { position:absolute; top:0; left:0; transform-origin:0 0; pointer-events:none; z-index:5; }
.pm-tree-layer { position:absolute; top:0; left:0; transform-origin:0 0; pointer-events:none; z-index:10; }

@keyframes grow {
  0%   { transform:scaleY(0) scaleX(0.2); opacity:0; filter:brightness(3); }
  40%  { transform:scaleY(1.12) scaleX(1.04); filter:brightness(1.5); }
  70%  { transform:scaleY(0.96); }
  100% { transform:scaleY(1) scaleX(1); opacity:1; filter:brightness(1); }
}
@keyframes drop {
  0%   { transform:scaleY(0.1) scaleX(0.3) translateY(-60px); opacity:0; }
  45%  { transform:scaleY(1.15) scaleX(0.9) translateY(4px); opacity:1; }
  65%  { transform:scaleY(0.92) scaleX(1.06) translateY(0); }
  100% { transform:scaleY(1) scaleX(1) translateY(0); opacity:1; }
}
@keyframes spark {
  0%   { opacity:0; transform:scale(0) translateY(0); }
  40%  { opacity:1; transform:scale(1.4) translateY(-10px); }
  100% { opacity:0; transform:scale(.5) translateY(-35px); }
}
@keyframes fountain-pulse {
  0%,100% { filter:drop-shadow(0 0 3px #58d0f0); }
  50%     { filter:drop-shadow(0 0 8px #58d0f0); }
}
@keyframes nfade {
  0%  { opacity:0; transform:translateX(-50%) translateY(14px); }
  12% { opacity:1; transform:translateX(-50%) translateY(0); }
  78% { opacity:1; }
  100%{ opacity:0; transform:translateX(-50%) translateY(-8px); }
}

.planted-fountain { animation:drop .75s cubic-bezier(.22,1,.36,1) forwards; }
.planted-tree { animation:grow .85s cubic-bezier(.34,1.56,.64,1) forwards; }
.entity-tree, .entity-fountain { position:absolute; pointer-events:all; cursor:pointer; transform-origin:bottom center; }
.entity-tree img, .entity-fountain img { image-rendering:pixelated; display:block; }
.entity-fountain img { animation:fountain-pulse 2s ease-in-out infinite; }

.pm-notif {
  position:fixed; bottom:52px; left:50%; transform:translateX(-50%);
  background:rgba(10,24,10,0.93); border:2px solid #7ee84a;
  padding:8px 20px; font-family:'Press Start 2P',monospace; font-size:7px;
  color:#7ee84a; z-index:400; box-shadow:0 0 22px rgba(126,232,74,0.4);
  animation:nfade 2.4s ease-out forwards; pointer-events:none; white-space:nowrap;
}
`;

// Convertit une coordonnée GPS en pixels carte (inverse de MapEngine.toGPS)
function gpsToMapPixels(lat: number, lon: number): { mx: number; my: number } {
  const { S, N, W, E } = CONFIG.GPS;
  const { COLS, ROWS, TILE_PX } = CONFIG;
  const col = ((lon - W) / (E - W)) * COLS;
  const row = ((lat - S) / (N - S)) * ROWS;
  return {
    mx: col * TILE_PX,
    my: (ROWS - row) * TILE_PX, // Y inversé
  };
}

function getHeatColor(delta: number | null): string {
  if (delta === null || delta === undefined || isNaN(delta)) return "#999";
  if (delta >= 3)  return "#c1121f";
  if (delta >= 1)  return "#f77f00";
  if (delta >= -1) return "#ffd166";
  if (delta >= -3) return "#48cae4";
  return "#118ab2";
}

type HeatFeature = GeoJSON.Feature<GeoJSON.Geometry, { delta?: number }>;

export default function PixelMap() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatCanvasRef = useRef<HTMLCanvasElement>(null);
  const treeLayerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MapEngine | null>(null);
  const entitiesRef = useRef<Entities | null>(null);
  const heatFeaturesRef = useRef<HeatFeature[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadMsg, setLoadMsg] = useState("Initialisation...");
  const [loadPct, setLoadPct] = useState(0);
  const [mode, setModeState] = useState<ToolMode>("tree");
  const [treeCount, setTreeCount] = useState(0);
  const [fountainCount, setFountainCount] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [tileInfo, setTileInfo] = useState<{ meta: TileMeta; col: number; row: number; gps: { lat: number; lon: number } } | null>(null);
  const [activeTab, setActiveTab] = useState<"trees" | "fountains">("trees");
  const [cursorGps, setCursorGps] = useState<{ lat: number; lon: number } | null>(null);
  const [cursorZone, setCursorZone] = useState("");
  const [heatVisible, setHeatVisible] = useState(false);
  const [heatLoading, setHeatLoading] = useState(false);
  const heatVisibleRef = useRef(false);
  const modeRef = useRef<ToolMode>("tree");

  const notify = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2600);
  }, []);

  const onStatsChange = useCallback((trees: number, fountains: number) => {
    setTreeCount(trees);
    setFountainCount(fountains);
  }, []);

  const setMode = useCallback((m: ToolMode) => {
    modeRef.current = m;
    setModeState(m);
  }, []);

  // ── Overlay îlots de chaleur ─────────────────────────
  const drawHeatOverlay = useCallback(() => {
    const heatCanvas = heatCanvasRef.current;
    const engine = engineRef.current;
    if (!heatCanvas || !engine) return;

    const { COLS, ROWS, TILE_PX } = CONFIG;
    const W = COLS * TILE_PX;
    const H = ROWS * TILE_PX;

    // Dimensionner une seule fois — reset width efface le canvas et invalide le contexte
    if (heatCanvas.width !== W || heatCanvas.height !== H) {
      heatCanvas.width = W;
      heatCanvas.height = H;
    }

    const ctx = heatCanvas.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);

    if (!heatVisibleRef.current) return;

    const features = heatFeaturesRef.current;
    ctx.globalAlpha = 0.45;

    for (const feature of features) {
      const delta = feature.properties?.delta ?? null;
      ctx.fillStyle = getHeatColor(delta !== null ? Number(delta) : null);
      ctx.strokeStyle = "transparent";

      const drawPolygon = (ring: number[][]) => {
        ctx.beginPath();
        ring.forEach(([lon, lat], i) => {
          const { mx, my } = gpsToMapPixels(lat, lon);
          if (i === 0) ctx.moveTo(mx, my);
          else ctx.lineTo(mx, my);
        });
        ctx.closePath();
        ctx.fill();
      };

      const geom = feature.geometry;
      if (geom.type === "Polygon") {
        drawPolygon(geom.coordinates[0] as number[][]);
      } else if (geom.type === "MultiPolygon") {
        for (const poly of geom.coordinates) {
          drawPolygon(poly[0] as number[][]);
        }
      }
    }

    // Synchroniser le transform avec la caméra
    const t = `translate(${engine.cam.x}px,${engine.cam.y}px) scale(${engine.cam.zoom})`;
    heatCanvas.style.transform = t;
  }, []);

  const toggleHeat = useCallback(async () => {
    if (heatVisibleRef.current) {
      heatVisibleRef.current = false;
      setHeatVisible(false);
      drawHeatOverlay();
      return;
    }

    // Premier chargement
    if (heatFeaturesRef.current.length === 0) {
      setHeatLoading(true);
      try {
        const res = await fetch("/api/heatmap/source/geojson");
        const geoJson: GeoJSON.FeatureCollection = await res.json();
        heatFeaturesRef.current = geoJson.features as HeatFeature[];
      } finally {
        setHeatLoading(false);
      }
    }

    heatVisibleRef.current = true;
    setHeatVisible(true);
    drawHeatOverlay();
  }, [drawHeatOverlay]);

  // ── Boot ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms));

    async function boot() {
      setLoadMsg("Chargement des donnees...");
      setLoadPct(10);

      const res = await fetch("/pixel-map-data.json");
      const data: PixelMapData = await res.json();

      if (cancelled) return;

      setLoadMsg("Decodage de la grille...");
      setLoadPct(35);
      await tick();

      const engine = new MapEngine();
      const grid = engine.loadGrid(data.grid_b64);

      setLoadMsg("Rendu pixel art...");
      setLoadPct(55);
      await tick();

      engine.render(grid, data.tile_names, data.tile_colors, canvasRef.current!, treeLayerRef.current!);

      const entities = new Entities(engine, onStatsChange, notify);
      entities.setTreeLayer(treeLayerRef.current!);

      setLoadMsg("Chargement des sprites...");
      setLoadPct(72);
      await entities.initSprites({ ...data.sprites, tap: "/point_eau.png" });

      if (cancelled) return;

      engineRef.current = engine;
      entitiesRef.current = entities;

      engine.resetView(wrapRef.current!);

      setLoadMsg("Chargement des actions sauvegardees...");
      setLoadPct(88);
      await entities.loadFromDb();

      setLoadMsg("Pret !");
      setLoadPct(100);
      await tick(300);
      setLoading(false);
    }

    boot();
    return () => { cancelled = true; };
  }, [onStatsChange, notify]);

  // ── Events ──────────────────────────────────────────
  useEffect(() => {
    const wrap = wrapRef.current;
    const engine = engineRef.current;
    const entities = entitiesRef.current;
    if (!wrap || !engine || !entities || loading) return;

    let drag = false;
    let dx = 0, dy = 0, cx = 0, cy = 0;

    function onClick(e: MouseEvent) {
      if (drag) return;
      const rect = wrap!.getBoundingClientRect();
      const { col, row, mx, my } = engine!.screenToGrid(e.clientX - rect.left, e.clientY - rect.top);
      const tileIdx = engine!.tileAt(col, row);
      if (tileIdx === null) return;

      const tileName = engine!.getTileNames()[tileIdx];
      const meta = TILE_META[tileName];
      if (meta) {
        const gps = engine!.toGPS(col, row);
        setTileInfo({ meta, col, row, gps });
      }

      const m = modeRef.current;
      if (m === "tree") entities!.plantTree(mx, my, col, row, tileIdx);
      if (m === "fountain") entities!.plantFountain(mx, my, col, row, tileIdx);
    }

    function onMouseDown(e: MouseEvent) {
      if (e.button === 2 || modeRef.current === "pan") {
        drag = false;
        dx = e.clientX; dy = e.clientY;
        cx = engine!.cam.x; cy = engine!.cam.y;
        wrap!.classList.add("drag");
        e.preventDefault();
        wrap!.addEventListener("mousemove", onDrag);
      }
    }

    function onDrag(e: MouseEvent) {
      if (Math.abs(e.clientX - dx) + Math.abs(e.clientY - dy) > 3) drag = true;
      engine!.cam.x = cx + (e.clientX - dx);
      engine!.cam.y = cy + (e.clientY - dy);
      engine!.applyCamera();
      syncHeatTransform();
    }

    function syncHeatTransform() {
      const hc = heatCanvasRef.current;
      if (!hc) return;
      const t = `translate(${engine!.cam.x}px,${engine!.cam.y}px) scale(${engine!.cam.zoom})`;
      hc.style.transform = t;
    }

    function onMouseUp() {
      wrap!.removeEventListener("mousemove", onDrag);
      wrap!.classList.remove("drag");
      setTimeout(() => { drag = false; }, 50);
    }

    function onMouseMove(e: MouseEvent) {
      const rect = wrap!.getBoundingClientRect();
      const { col, row } = engine!.screenToGrid(e.clientX - rect.left, e.clientY - rect.top);
      const tileIdx = engine!.tileAt(col, row);
      if (tileIdx !== null) {
        setCursorGps(engine!.toGPS(col, row));
        setCursorZone(engine!.getTileNames()[tileIdx]);
      }
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = wrap!.getBoundingClientRect();
      engine!.zoomAt(e.deltaY < 0 ? 1.12 : 0.89, e.clientX - rect.left, e.clientY - rect.top);
      syncHeatTransform();
    }

    function onKeyDown(e: KeyboardEvent) {
      const s = Math.max(40, 90 * engine!.cam.zoom);
      if (e.key === "ArrowUp" || e.key === "z") { engine!.pan(0, s); syncHeatTransform(); }
      if (e.key === "ArrowDown" || e.key === "s") { engine!.pan(0, -s); syncHeatTransform(); }
      if (e.key === "ArrowLeft" || e.key === "q") { engine!.pan(s, 0); syncHeatTransform(); }
      if (e.key === "ArrowRight" || e.key === "d") { engine!.pan(-s, 0); syncHeatTransform(); }
      if (e.key === "+" || e.key === "=") { engine!.zoomAt(1.2, window.innerWidth / 2, window.innerHeight / 2); syncHeatTransform(); }
      if (e.key === "-") { engine!.zoomAt(0.83, window.innerWidth / 2, window.innerHeight / 2); syncHeatTransform(); }
      if (e.key === "r" || e.key === "R") { engine!.resetView(wrap!); syncHeatTransform(); }
      if (e.key === "1") setMode("tree");
      if (e.key === "2") setMode("fountain");
      if (e.key === "3") setMode("pan");
      if (e.key === "4") setMode("info");
    }

    function onContextMenu(e: Event) { e.preventDefault(); }
    function onResize() { engine!.resetView(wrap!); syncHeatTransform(); }

    wrap.addEventListener("click", onClick);
    wrap.addEventListener("mousedown", onMouseDown);
    wrap.addEventListener("mousemove", onMouseMove);
    wrap.addEventListener("wheel", onWheel, { passive: false });
    wrap.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    return () => {
      wrap.removeEventListener("click", onClick);
      wrap.removeEventListener("mousedown", onMouseDown);
      wrap.removeEventListener("mousemove", onMouseMove);
      wrap.removeEventListener("wheel", onWheel);
      wrap.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [loading, setMode]);

  // ── Stats calculées ─────────────────────────────────
  const eco = {
    co2: treeCount * CONFIG.ECO.TREE_CO2,
    temp: treeCount * CONFIG.ECO.TREE_TEMP,
    water: treeCount * CONFIG.ECO.TREE_WATER,
  };

  function getProgress(n: number, milestones: readonly number[]) {
    let prev = 0, next = milestones[0];
    for (const m of milestones) {
      if (n >= m) prev = m;
      else { next = m; break; }
    }
    const pct = prev === next ? 100 : Math.min(100, ((n - prev) / (next - prev)) * 100);
    const done = n >= milestones[milestones.length - 1];
    return { pct, next, remaining: next - n, done };
  }

  const treeProg = getProgress(treeCount, CONFIG.MILESTONES_TREES);
  const fountainProg = getProgress(fountainCount, CONFIG.MILESTONES_FOUNTAINS);

  // ── CSS vars ─────────────────────────────────────────
  const V = {
    dark: "#1a3a1a", mid: "#2d5a27", accent: "#7ee84a", accent2: "#ffd700",
    panel: "rgba(10,24,10,0.93)", border: "rgba(126,232,74,0.28)",
    text: "#c8e6c0", dim: "#6a9a60", red: "#f05050",
  };

  const btnStyle = (active: boolean, water = false): React.CSSProperties => ({
    fontFamily: "'Press Start 2P',monospace", fontSize: 7, letterSpacing: 0.5,
    background: active ? (water ? "#58d0f0" : V.accent) : V.mid,
    border: `2px solid ${active ? (water ? "#58d0f0" : V.accent) : "rgba(126,232,74,0.35)"}`,
    color: active ? V.dark : V.accent,
    padding: "6px 9px", cursor: "pointer", transition: "all .15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", fontFamily: "'VT323',monospace", fontSize: 18, color: V.text, background: "#0a180a" }}>
      <style>{PIXEL_MAP_STYLES}</style>

      {/* HEADER */}
      <header style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 14px", background: V.panel, borderBottom: `2px solid ${V.border}`, flexShrink: 0 }}>
        <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 10, color: V.accent, textShadow: `0 0 20px ${V.accent}`, whiteSpace: "nowrap" }}>
          BORDEAUX <span style={{ color: V.accent2 }}>VERT</span>
        </div>
        {(["tree", "fountain", "pan", "info"] as ToolMode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)} style={btnStyle(mode === m, m === "fountain")}>
            {m === "tree" ? "\u{1F331} ARBRE" : m === "fountain" ? "\u26F2 FONTAINE" : m === "pan" ? "\u270B NAVIGUER" : "\u{1F50D} INFOS"}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 7 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(126,232,74,0.07)", border: `1px solid ${V.border}`, padding: "3px 10px", fontSize: 15 }}>
            <span>{"\u{1F333}"}</span><span style={{ color: V.accent, fontSize: 18 }}>{treeCount}</span><span>arbres</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(126,232,74,0.07)", border: `1px solid ${V.border}`, padding: "3px 10px", fontSize: 15 }}>
            <span>{"\u{1F33F}"}</span><span style={{ color: V.accent, fontSize: 18 }}>{eco.co2.toLocaleString("fr-FR")}</span><span>kg CO2/an</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(126,232,74,0.07)", border: `1px solid ${V.border}`, padding: "3px 10px", fontSize: 15 }}>
            <span>{"\u26F2"}</span><span style={{ color: "#58d0f0", fontSize: 18 }}>{fountainCount}</span><span>fontaines</span>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* MAP */}
        <div ref={wrapRef} className={`pm-wrap${mode === "pan" ? " pan" : ""}`}>
          <canvas ref={canvasRef} className="pm-canvas" />
          <canvas ref={heatCanvasRef} className="pm-heat-canvas" />
          <div ref={treeLayerRef} className="pm-tree-layer" />
        </div>

        {/* SIDEBAR */}
        <div style={{ width: 268, flexShrink: 0, background: V.panel, borderLeft: `2px solid ${V.border}`, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {/* Mode */}
          <div style={{ padding: 13, borderBottom: `1px solid rgba(126,232,74,0.1)` }}>
            <h3 style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 6, color: V.dim, letterSpacing: 2, marginBottom: 9, textTransform: "uppercase" }}>Mode actif</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 8 }}>
              {(["tree", "fountain", "pan", "info"] as ToolMode[]).map((m) => (
                <button key={m} onClick={() => setMode(m)} style={{ ...btnStyle(mode === m, m === "fountain"), fontSize: 6 }}>
                  {m === "tree" ? "\u{1F331} ARBRE" : m === "fountain" ? "\u26F2 FONTAINE" : m === "pan" ? "\u270B NAVIGUER" : "\u{1F50D} INFOS"}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 13, color: V.dim, lineHeight: 1.7 }}>{MODE_HINTS[mode]}</div>
          </div>

          {/* Couches */}
          <div style={{ padding: 13, borderBottom: `1px solid rgba(126,232,74,0.1)` }}>
            <h3 style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 6, color: V.dim, letterSpacing: 2, marginBottom: 9, textTransform: "uppercase" }}>Couches</h3>
            <button
              onClick={toggleHeat}
              disabled={heatLoading}
              style={{
                width: "100%", fontFamily: "'Press Start 2P',monospace", fontSize: 6,
                padding: "7px 9px", cursor: heatLoading ? "wait" : "pointer",
                background: heatVisible ? "rgba(193,18,31,0.15)" : V.dark,
                border: `2px solid ${heatVisible ? "#c1121f" : "rgba(193,18,31,0.3)"}`,
                color: heatVisible ? "#f05050" : V.dim,
                display: "flex", alignItems: "center", gap: 7, transition: "all .15s",
              }}
            >
              <span style={{ fontSize: 12 }}>{heatLoading ? "⏳" : "☀️"}</span>
              {heatLoading ? "CHARGEMENT..." : (heatVisible ? "CHALEUR ON" : "CHALEUR OFF")}
            </button>
            {heatVisible && (
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 8, fontSize: 12 }}>
                {[
                  { color: "#c1121f", label: "Très chaud (Δ ≥ +3°C)" },
                  { color: "#f77f00", label: "Chaud (Δ ≥ +1°C)" },
                  { color: "#ffd166", label: "Neutre" },
                  { color: "#48cae4", label: "Frais (Δ ≤ -1°C)" },
                  { color: "#118ab2", label: "Très frais (Δ ≤ -3°C)" },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, background: color, flexShrink: 0 }} />
                    <span style={{ color: V.dim }}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tile info */}
          <div style={{ padding: 13, borderBottom: `1px solid rgba(126,232,74,0.1)` }}>
            <h3 style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 6, color: V.dim, letterSpacing: 2, marginBottom: 9, textTransform: "uppercase" }}>Zone selectionnee</h3>
            <div style={{ background: "rgba(126,232,74,0.05)", border: `1px solid ${V.border}`, padding: 9, fontSize: 16, lineHeight: 1.9, minHeight: 78 }}>
              {tileInfo ? (
                <>
                  <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 6, color: V.accent, marginBottom: 4 }}>{tileInfo.meta.icon} {tileInfo.meta.label}</div>
                  <div>{tileInfo.meta.eco}</div>
                  <div style={{ color: V.dim, fontSize: 14 }}>{tileInfo.gps.lat.toFixed(5)}°N  {tileInfo.gps.lon.toFixed(5)}°E</div>
                  <span style={{ display: "inline-block", border: `1px solid ${tileInfo.meta.plantable ? V.border : "rgba(240,80,80,.3)"}`, padding: "1px 7px", fontSize: 12, marginTop: 3, color: tileInfo.meta.plantable ? V.accent : V.red }}>
                    {tileInfo.meta.plantable ? "\u2713 Plantable" : "\u2717 Non plantable"}
                  </span>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 6, color: V.accent, marginBottom: 4 }}>&mdash;</div>
                  <div style={{ color: V.dim }}>Cliquez sur la carte</div>
                </>
              )}
            </div>
          </div>

          {/* Eco impact */}
          <div style={{ padding: 13, borderBottom: `1px solid rgba(126,232,74,0.1)` }}>
            <h3 style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 6, color: V.dim, letterSpacing: 2, marginBottom: 9, textTransform: "uppercase" }}>Impact ecologique</h3>
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              <button onClick={() => setActiveTab("trees")} style={{ flex: 1, fontFamily: "'Press Start 2P',monospace", fontSize: 6, padding: 5, background: activeTab === "trees" ? V.mid : V.dark, border: `1px solid ${activeTab === "trees" ? V.accent : V.border}`, color: activeTab === "trees" ? V.accent : V.dim, cursor: "pointer", textAlign: "center" }}>
                {"\u{1F333}"} ARBRES
              </button>
              <button onClick={() => setActiveTab("fountains")} style={{ flex: 1, fontFamily: "'Press Start 2P',monospace", fontSize: 6, padding: 5, background: activeTab === "fountains" ? V.mid : V.dark, border: `1px solid ${activeTab === "fountains" ? "#58d0f0" : V.border}`, color: activeTab === "fountains" ? "#58d0f0" : V.dim, cursor: "pointer", textAlign: "center" }}>
                {"\u{26F2}"} FONTAINES
              </button>
            </div>

            {activeTab === "trees" ? (
              <div>
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 22, color: V.accent, textShadow: `0 0 18px ${V.accent}`, display: "block", textAlign: "center", margin: "6px 0" }}>{treeCount}</span>
                <div style={{ fontSize: 13, textAlign: "center", color: V.dim, marginBottom: 7 }}>arbres plantes</div>
                <div style={{ height: 6, background: "rgba(126,232,74,0.1)", border: `1px solid ${V.border}`, margin: "5px 0", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: `linear-gradient(90deg,${V.mid},${V.accent})`, transition: "width .5s", width: `${treeProg.pct}%` }} />
                </div>
                <div style={{ fontSize: 13, color: V.dim, textAlign: "center", marginBottom: 9 }}>
                  {treeProg.done ? "\u{1F3C6} Objectif maximum atteint !" : `Objectif : ${treeProg.next} \u2192 ${treeProg.remaining} restants`}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "2px 0" }}>{"\u{1F33F}"} CO2 absorbe <span style={{ color: V.accent }}>{eco.co2.toLocaleString("fr-FR")} kg/an</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "2px 0" }}>{"\u{1F321}"} Temp. reduite <span style={{ color: V.accent }}>{eco.temp.toFixed(2)}°C</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "2px 0" }}>{"\u{1F4A7}"} Eau retenue <span style={{ color: V.accent }}>{eco.water.toLocaleString("fr-FR")} L/an</span></div>
              </div>
            ) : (
              <div>
                <span style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 22, color: "#58d0f0", textShadow: "0 0 18px #58d0f0", display: "block", textAlign: "center", margin: "6px 0" }}>{fountainCount}</span>
                <div style={{ fontSize: 13, textAlign: "center", color: V.dim, marginBottom: 7 }}>points d&apos;eau installes</div>
                <div style={{ height: 6, background: "rgba(126,232,74,0.1)", border: `1px solid ${V.border}`, margin: "5px 0", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "linear-gradient(90deg,#1a4a5a,#58d0f0)", transition: "width .5s", width: `${fountainProg.pct}%` }} />
                </div>
                <div style={{ fontSize: 13, color: V.dim, textAlign: "center", marginBottom: 9 }}>
                  {fountainProg.done ? "\u{1F3C6} Objectif maximum atteint !" : `Objectif : ${fountainProg.next} \u2192 ${fountainProg.remaining} restants`}
                </div>
              </div>
            )}
          </div>

          {/* Legende */}
          <div style={{ padding: 13, borderBottom: `1px solid rgba(126,232,74,0.1)` }}>
            <h3 style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 6, color: V.dim, letterSpacing: 2, marginBottom: 9, textTransform: "uppercase" }}>Legende carte</h3>
            {Object.entries(TILE_META).map(([name, meta]) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", fontSize: 14 }}>
                <div style={{ width: 12, height: 12, flexShrink: 0, border: "1px solid rgba(255,255,255,.1)", background: `rgb(${meta.color.join(",")})` }} />
                <span>{meta.icon} {meta.label}</span>
              </div>
            ))}
          </div>

          {/* Controles */}
          <div style={{ padding: 13 }}>
            <h3 style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 6, color: V.dim, letterSpacing: 2, marginBottom: 9, textTransform: "uppercase" }}>Controles</h3>
            <div style={{ fontSize: 13, color: V.dim, lineHeight: 2 }}>
              {"\u{1F5B1}"} Scroll &rarr; zoom<br />
              {"\u{1F5B1}"} Clic droit &rarr; naviguer<br />
              {"\u2328"} ZQSD / fleches &rarr; deplacer<br />
              {"\u2328"} +/- zoom &nbsp; R reset<br />
              {"\u2328"} 1=Arbre 2=Fontaine 3=Nav
            </div>
          </div>
        </div>
      </div>

      {/* STATUSBAR */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "4px 14px", background: V.panel, borderTop: `1px solid ${V.border}`, fontSize: 14, color: V.dim, flexShrink: 0 }}>
        <span>{"\u{1F4CD}"}<span style={{ color: V.text }}>{cursorGps ? `${cursorGps.lat.toFixed(5)}°N  ${cursorGps.lon.toFixed(5)}°E` : "\u2014"}</span></span>
        <span>Zone : <span style={{ color: V.text }}>{cursorZone || "\u2014"}</span></span>
        <span>Zoom : <span style={{ color: V.text }}>{engineRef.current ? Math.round(engineRef.current.cam.zoom * 100) + "%" : "\u2014"}</span></span>
        <span style={{ marginLeft: "auto" }}>Bordeaux Metropole \u00B7 28 communes \u00B7 OSM</span>
      </div>

      {/* LOADER */}
      {loading && (
        <div style={{ position: "absolute", inset: 0, background: "#0a180a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, zIndex: 1000 }}>
          <div style={{ fontSize: 48 }}>{"\u{1F331}"}</div>
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: 13, color: V.accent, textShadow: `0 0 28px ${V.accent}` }}>BORDEAUX VERT</div>
          <div style={{ width: 260, height: 6, background: "rgba(126,232,74,0.1)", border: `1px solid ${V.border}` }}>
            <div style={{ height: "100%", background: V.accent, width: `${loadPct}%`, transition: "width .4s" }} />
          </div>
          <div style={{ fontSize: 16, color: V.dim }}>{loadMsg}</div>
        </div>
      )}

      {/* NOTIFICATION */}
      {notification && <div className="pm-notif">{notification}</div>}
    </div>
  );
}
