"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface VegetationProperties {
  nb_arbre: number;
  nom?: string;
  code_insee?: string;
}

interface DatahubRecord {
  geo_shape?: {
    geometry?: GeoJSON.Geometry;
    type?: string;
    coordinates?: unknown;
  };
  nb_arbre?: number;
  nom?: string;
  code_insee?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BORDEAUX_CENTER: [number, number] = [44.8378, -0.5792];
const BORDEAUX_ZOOM = 12;

const DATAHUB_BASE =
  "https://datahub.bordeaux-metropole.fr/api/explore/v2.1/catalog/datasets";

const VEGETATION_DATASET = "met_vegetation_urbaine";
const PAGE_SIZE = 100;
const MAX_RECORDS = 5000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function treeCountToColor(count: number, max: number): string {
  if (max === 0) return "rgba(74, 158, 99, 0.05)";
  const t = Math.pow(Math.min(count / max, 1), 0.6);
  const alpha = 0.05 + t * 0.82;
  const r = Math.round(220 - t * 155);
  const g = Math.round(237 - t * 70);
  const b = Math.round(200 - t * 130);
  return `rgba(${r},${g},${b},${alpha})`;
}

function treeBorderColor(count: number, max: number): string {
  if (max === 0) return "rgba(74, 158, 99, 0.2)";
  const t = Math.min(count / max, 1);
  return `rgba(74, 158, ${Math.round(60 + t * 40)}, ${0.15 + t * 0.55})`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BordeauxMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const vegetationLayerRef = useRef<L.GeoJSON | null>(null);

  const [vegVisible, setVegVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [maxTrees, setMaxTrees] = useState(1);
  const [totalZones, setTotalZones] = useState(0);

  // ── Map init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapContainerRef.current!, {
        center: BORDEAUX_CENTER,
        zoom: BORDEAUX_ZOOM,
        zoomControl: false,
      });

      L.tileLayer(
        "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 20,
        }
      ).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Data fetching ───────────────────────────────────────────────────────────
  const fetchVegetation = useCallback(async () => {
    setLoading(true);
    setStatus("Chargement des données…");

    try {
      const L = await import("leaflet");
      const allFeatures: GeoJSON.Feature<GeoJSON.Geometry, VegetationProperties>[] = [];
      let offset = 0;
      let totalCount: number | null = null;

      while (true) {
        const url = new URL(`${DATAHUB_BASE}/${VEGETATION_DATASET}/records`);
        url.searchParams.set("limit", String(PAGE_SIZE));
        url.searchParams.set("offset", String(offset));
        url.searchParams.set("select", "geo_shape,nb_arbre,nom,code_insee");
        url.searchParams.set("order_by", "nb_arbre DESC");

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

        const data = await res.json();

        if (totalCount === null) {
          totalCount = data.total_count ?? 0;
        }

        const pageFeatures = (data.results as DatahubRecord[])
          .map((rec) => {
            const geometry =
              rec.geo_shape?.geometry ??
              (rec.geo_shape?.type ? (rec.geo_shape as unknown as GeoJSON.Geometry) : null);

            if (!geometry) return null;

            return {
              type: "Feature" as const,
              geometry,
              properties: {
                nb_arbre: rec.nb_arbre ?? 0,
                nom: rec.nom ?? "",
                code_insee: rec.code_insee ?? "",
              },
            };
          })
          .filter(Boolean) as GeoJSON.Feature<GeoJSON.Geometry, VegetationProperties>[];

        allFeatures.push(...pageFeatures);
        offset += PAGE_SIZE;

        const pct = totalCount > 0 ? Math.round((allFeatures.length / totalCount) * 100) : "…";
        setStatus(`Chargement… ${pct}%`);

        if ((data.results as DatahubRecord[]).length < PAGE_SIZE) break;
        if (allFeatures.length >= Math.min(totalCount ?? MAX_RECORDS, MAX_RECORDS)) break;
      }

      const max = Math.max(...allFeatures.map((f) => f.properties.nb_arbre), 1);
      setMaxTrees(max);
      setTotalZones(allFeatures.length);

      const geoLayer = L.geoJSON(
        { type: "FeatureCollection", features: allFeatures },
        {
          style: (feature) => {
            const count = (feature?.properties as VegetationProperties).nb_arbre ?? 0;
            return {
              fillColor: treeCountToColor(count, max),
              fillOpacity: 1,
              color: treeBorderColor(count, max),
              weight: 0.8,
            };
          },
          onEachFeature: (feature, layer) => {
            const p = feature.properties as VegetationProperties;
            const fillColor = treeCountToColor(p.nb_arbre, max);

            layer.on("mouseover", () => {
              (layer as L.Path).setStyle({ weight: 2, color: "rgba(74,158,99,0.9)", fillOpacity: 1 });
            });
            layer.on("mouseout", () => {
              (layer as L.Path).setStyle({
                fillColor,
                color: treeBorderColor(p.nb_arbre, max),
                weight: 0.8,
                fillOpacity: 1,
              });
            });
            layer.bindPopup(`
              <div style="font-family: system-ui; min-width: 160px;">
                <div style="font-size: 18px; font-weight: 600; color: #2d6a4f; margin-bottom: 8px;">
                  ${p.nb_arbre.toLocaleString("fr-FR")} arbres
                </div>
                <div style="font-size: 13px; color: #555; line-height: 1.7;">
                  ${p.nom ? `<div><b>Zone :</b> ${p.nom}</div>` : ""}
                  ${p.code_insee ? `<div><b>INSEE :</b> ${p.code_insee}</div>` : ""}
                </div>
              </div>
            `);
          },
        }
      );

      vegetationLayerRef.current = geoLayer;
      setDataLoaded(true);
      setStatus(`${allFeatures.length} zones chargées`);

      if (mapRef.current) {
        geoLayer.addTo(mapRef.current);
      }
    } catch (err) {
      console.error("Erreur chargement végétation:", err);
      setStatus("Erreur de chargement — voir console");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Toggle handler ──────────────────────────────────────────────────────────
  const handleToggleVegetation = useCallback(async () => {
    if (!dataLoaded) {
      setVegVisible(true);
      await fetchVegetation();
      return;
    }

    if (vegVisible) {
      if (vegetationLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(vegetationLayerRef.current);
      }
      setVegVisible(false);
      setStatus(null);
    } else {
      if (vegetationLayerRef.current && mapRef.current) {
        vegetationLayerRef.current.addTo(mapRef.current);
      }
      setVegVisible(true);
      setStatus(`${totalZones} zones affichées`);
    }
  }, [dataLoaded, vegVisible, fetchVegetation, totalZones]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bordeaux-map-wrapper">
      {/* ── Toolbar ── */}
      <div className="map-toolbar">
        <div className="toolbar-left">
          <span className="toolbar-title">Bordeaux Métropole</span>
          <span className="toolbar-subtitle">Résilience urbaine · MVP</span>
        </div>

        <div className="toolbar-layers">
          <span className="layers-label">Couches</span>

          <button
            className={`layer-btn ${vegVisible ? "active" : ""}`}
            onClick={handleToggleVegetation}
            disabled={loading}
            aria-pressed={vegVisible}
          >
            <span className="layer-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
            </span>
            Végétation
            {loading && <span className="btn-spinner" />}
          </button>

          <button className="layer-btn" disabled>
            <span className="layer-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
              </svg>
            </span>
            Îlots de chaleur
          </button>

          <button className="layer-btn" disabled>
            <span className="layer-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v6m0 0c0 0-4 2-4 6s4 8 4 8 4-4 4-8-4-6-4-6z"/>
              </svg>
            </span>
            Fontaines
          </button>
        </div>

        {status && (
          <div className={`status-pill ${loading ? "loading" : ""}`}>
            {loading && <span className="pill-spinner" />}
            {status}
          </div>
        )}
      </div>

      {/* ── Map ── */}
      <div ref={mapContainerRef} className="map-container" />

      {/* ── Legend ── */}
      {vegVisible && !loading && (
        <div className="map-legend">
          <p className="legend-title">Arbres par zone</p>
          <div className="legend-gradient" />
          <div className="legend-labels">
            <span>0</span>
            <span>{maxTrees.toLocaleString("fr-FR")}</span>
          </div>
        </div>
      )}

      <style>{`
        .bordeaux-map-wrapper {
          position: relative; width: 100%; height: 100vh;
          display: flex; flex-direction: column;
          font-family: 'DM Sans', system-ui, sans-serif;
          background: #f7f6f2;
        }
        .map-toolbar {
          position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
          z-index: 1000; display: flex; align-items: center; gap: 16px;
          background: rgba(255,255,255,0.96); backdrop-filter: blur(12px);
          border: 1px solid rgba(0,0,0,0.08); border-radius: 14px;
          padding: 10px 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.10); white-space: nowrap;
        }
        .toolbar-left { display: flex; flex-direction: column; padding-right: 16px; border-right: 1px solid rgba(0,0,0,0.08); }
        .toolbar-title { font-size: 13px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.2px; }
        .toolbar-subtitle { font-size: 11px; color: #888; margin-top: 1px; }
        .toolbar-layers { display: flex; align-items: center; gap: 6px; }
        .layers-label { font-size: 11px; font-weight: 500; color: #aaa; text-transform: uppercase; letter-spacing: 0.6px; margin-right: 4px; }
        .layer-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px; font-size: 13px; font-weight: 500; color: #555;
          background: transparent; border: 1px solid rgba(0,0,0,0.12);
          border-radius: 8px; cursor: pointer; transition: all 0.15s ease;
          user-select: none; line-height: 1;
        }
        .layer-btn:not(:disabled):hover { background: #f0f9f4; border-color: rgba(45,106,79,0.4); color: #2d6a4f; }
        .layer-btn.active { background: #d8f3dc; border-color: #52b788; color: #1b4332; }
        .layer-btn:disabled { opacity: 0.38; cursor: not-allowed; }
        .layer-icon { display: flex; align-items: center; line-height: 0; }
        .btn-spinner { display: inline-block; width: 10px; height: 10px; border: 1.5px solid rgba(27,67,50,0.3); border-top-color: #2d6a4f; border-radius: 50%; animation: spin 0.7s linear infinite; margin-left: 2px; }
        .status-pill { display: flex; align-items: center; gap: 6px; padding: 5px 10px; background: #f0f9f4; border: 1px solid rgba(45,106,79,0.2); border-radius: 20px; font-size: 12px; color: #2d6a4f; font-weight: 500; }
        .status-pill.loading { color: #888; background: #f5f5f5; border-color: rgba(0,0,0,0.08); }
        .pill-spinner { display: inline-block; width: 10px; height: 10px; border: 1.5px solid rgba(0,0,0,0.15); border-top-color: #888; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .map-container { flex: 1; width: 100%; height: 100%; }
        .map-legend { position: absolute; bottom: 40px; left: 16px; z-index: 1000; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border: 1px solid rgba(0,0,0,0.08); border-radius: 10px; padding: 12px 14px; min-width: 150px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .legend-title { font-size: 11px; font-weight: 600; color: #333; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px; }
        .legend-gradient { width: 100%; height: 10px; border-radius: 5px; background: linear-gradient(to right, rgba(220,237,200,0.08), rgba(168,213,139,0.45), rgba(82,183,136,0.75), rgba(27,67,50,0.9)); border: 1px solid rgba(45,106,79,0.2); margin-bottom: 5px; }
        .legend-labels { display: flex; justify-content: space-between; font-size: 11px; color: #888; }
        .leaflet-popup-content-wrapper { border-radius: 10px !important; box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important; border: 1px solid rgba(0,0,0,0.06) !important; }
        .leaflet-popup-content { margin: 14px 16px !important; }
      `}</style>
    </div>
  );
}
