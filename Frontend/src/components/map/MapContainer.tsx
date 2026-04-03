"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import PixelMap from "./pixel-map/PixelMap";

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

const TUTORIAL_CONTENT: Record<MapMode, { title: string; intro: string; items: { icon: string; label: string; description: string }[] }> = {
  real: {
    title: "Bienvenue sur la carte réelle",
    intro: "Explorez Bordeaux Métropole avec plusieurs couches de données interactives :",
    items: [
      { icon: "🌿", label: "Végétation", description: "Affiche les zones de végétation urbaine, colorées selon le nombre d'arbres." },
      { icon: "☀️", label: "Îlots de chaleur / fraîcheur", description: "Visualisez les zones chaudes (rouge) et fraîches (bleu) de la métropole." },
      { icon: "💧", label: "Fontaines", description: "Localisez les fontaines d'eau potable sur la carte." },
    ],
  },
  pixel: {
    title: "Bienvenue sur la carte pixel",
    intro: "Une vue interactive pixel art de Bordeaux Métropole :",
    items: [
      { icon: "🌱", label: "Planter des arbres", description: "Cliquez sur une zone compatible pour planter un arbre. Chaque arbre est sauvegardé et visible par tous." },
      { icon: "⛲", label: "Installer des fontaines", description: "Ajoutez des points d'eau sur les zones plantables pour améliorer la fraîcheur urbaine." },
      { icon: "☀️", label: "Îlots de chaleur", description: "Activez la couche chaleur dans la sidebar pour visualiser les zones chaudes et fraîches superposées à la carte pixel." },
    ],
  },
};

function TutorialPopup({ mode, onClose }: { mode: MapMode; onClose: () => void }) {
  const content = TUTORIAL_CONTENT[mode];
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }} onClick={onClose}>
      <div style={{
        background: "white", borderRadius: 16, padding: "28px 32px",
        maxWidth: 420, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        animation: "popIn 0.2s ease-out",
      }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#1b4332" }}>
          {content.title}
        </h2>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#666", lineHeight: 1.5 }}>
          {content.intro}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {content.items.map((item) => (
            <div key={item.label} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              background: "#f7f6f2", borderRadius: 10, padding: "10px 12px",
            }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1b4332" }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "#666", lineHeight: 1.4, marginTop: 2 }}>{item.description}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{
          marginTop: 20, width: "100%", padding: "10px 0",
          background: "#2d6a4f", color: "white", border: "none",
          borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: "pointer",
        }}>
          C&apos;est compris !
        </button>
      </div>
      <style>{`@keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}

export default function MapContainer() {
  const [mode, setMode] = useState<MapMode>("real");
  const [showTutorial, setShowTutorial] = useState(false);
  const [seenTutorials, setSeenTutorials] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const seen = JSON.parse(localStorage.getItem("mapTutorialsSeen") || "{}");
    setSeenTutorials(seen);
    if (!seen["real"]) {
      setShowTutorial(true);
    }
  }, []);

  useEffect(() => {
    if (!seenTutorials[mode] && Object.keys(seenTutorials).length > 0 || (!seenTutorials[mode] && mode === "pixel")) {
      const seen = JSON.parse(localStorage.getItem("mapTutorialsSeen") || "{}");
      if (!seen[mode]) {
        setShowTutorial(true);
      }
    }
  }, [mode, seenTutorials]);

  const closeTutorial = () => {
    setShowTutorial(false);
    const updated = { ...seenTutorials, [mode]: true };
    setSeenTutorials(updated);
    localStorage.setItem("mapTutorialsSeen", JSON.stringify(updated));
  };

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

      {/* Help button */}
      <button
        onClick={() => setShowTutorial(true)}
        title="Aide"
        style={{
          position: "absolute", top: 16, left: 16, zIndex: 1100,
          width: 34, height: 34, borderRadius: "50%",
          background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(0,0,0,0.08)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
          fontSize: 15, fontWeight: 700, color: "#2d6a4f",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        ?
      </button>

      {/* Tutorial popup */}
      {showTutorial && <TutorialPopup mode={mode} onClose={closeTutorial} />}

      {mode === "real" ? (
        <BordeauxMap />
      ) : (
        <PixelMap />
        /* Placeholder pour la carte pixel en développement * /
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
        */
      )}
    </div>
  );
}
