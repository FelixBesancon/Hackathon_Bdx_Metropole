"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Leaflet requires browser APIs — disable SSR
const BordeauxMap = dynamic(() => import("./BordeauxMap"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", height: "100%", width: "100%", alignItems: "center", justifyContent: "center", background: "#f7f6f2" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "#aaa" }}>
        <div style={{ width: 32, height: 32, border: "2px solid #e0e0e0", borderTopColor: "#2d6a4f", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Chargement de la carte…</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  ),
});

type MapMode = "real" | "pixel";

export default function MapContainer() {
  const [mode, setMode] = useState<MapMode>("real");

  return (
    <div style={{ position: "relative", flex: 1, width: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Map mode toggle */}
      <div style={{
        position: "absolute",
        top: 16,
        right: 16,
        zIndex: 1100,
        display: "flex",
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 10,
        padding: 4,
        boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
        gap: 2,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <button
          onClick={() => setMode("real")}
          style={{
            padding: "6px 14px",
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
            background: mode === "real" ? "#d8f3dc" : "transparent",
            color: mode === "real" ? "#1b4332" : "#888",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          Carte réelle
        </button>
        <button
          onClick={() => setMode("pixel")}
          style={{
            padding: "6px 14px",
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
            transition: "all 0.15s ease",
            background: mode === "pixel" ? "#d8f3dc" : "transparent",
            color: mode === "pixel" ? "#1b4332" : "#888",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          Carte pixel
        </button>
      </div>

      {mode === "real" ? (
        <BordeauxMap />
      ) : (
        <div style={{
          flex: 1,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0d1117 0%, #1a2332 50%, #0d1117 100%)",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          gap: 16,
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 20px)",
            gridTemplateRows: "repeat(6, 20px)",
            gap: 3,
            opacity: 0.3,
          }}>
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} style={{
                width: 20, height: 20,
                background: `hsl(${140 + Math.random() * 40}, 60%, ${20 + Math.random() * 40}%)`,
                borderRadius: 2,
              }} />
            ))}
          </div>
          <div style={{ textAlign: "center", color: "white" }}>
            <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px", letterSpacing: "-0.3px" }}>
              Carte pixel
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>
              À venir — vue fictive de la ville
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
