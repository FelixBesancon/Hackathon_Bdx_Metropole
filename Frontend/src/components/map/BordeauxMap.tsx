"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DatahubRecord = Record<string, any>;

type FeatureCollectionWithMeta = GeoJSON.FeatureCollection & {
  meta?: {
    displayedCount: number;
    totalMatching: number;
    simplified: boolean;
  };
};

// ─── Constants ───────────────────────────────────────────────────────────────

const BORDEAUX_CENTER: [number, number] = [44.8378, -0.5792];
const BORDEAUX_ZOOM = 13;
const BORDEAUX_MIN_ZOOM = 11;
const BORDEAUX_MAX_ZOOM = 18;
const BORDEAUX_MAX_BOUNDS: [[number, number], [number, number]] = [
  [44.67, -0.92],
  [45.01, -0.30],
];

// LOD (Level of Detail) thresholds
const LOD_THRESHOLDS = {
  LOW_ZOOM: 11,
  MEDIUM_ZOOM: 13,
  HIGH_ZOOM: 15,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function BordeauxMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const canvasRendererRef = useRef<L.Renderer | null>(null);
  const vegetationLayerRef = useRef<L.Layer | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const fountainsLayerRef = useRef<L.Layer | null>(null);
  const vegetationRequestIdRef = useRef(0);
  const heatRequestIdRef = useRef(0);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [vegVisible, setVegVisible] = useState(false);
  const [heatVisible, setHeatVisible] = useState(false);
  const [fountainsVisible, setFountainsVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [heatLoading, setHeatLoading] = useState(false);
  const [fountainsLoading, setFountainsLoading] = useState(false);

  const [dataLoaded, setDataLoaded] = useState(false);
  const [heatDataLoaded, setHeatDataLoaded] = useState(false);
  const [fountainsDataLoaded, setFountainsDataLoaded] = useState(false);

  const [status, setStatus] = useState<string | null>(null);
  const [totalZones, setTotalZones] = useState(0);
  const [heatZones, setHeatZones] = useState(0);
  const [fountainsCount, setFountainsCount] = useState(0);

  const [currentZoom, setCurrentZoom] = useState(BORDEAUX_ZOOM);

  const buildViewportQuery = useCallback(() => {
    const map = mapRef.current;
    if (!map) return "";

    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ].join(",");

    return `?bbox=${encodeURIComponent(bbox)}&zoom=${encodeURIComponent(String(zoom))}`;
  }, []);

  const replaceLayer = useCallback((current: { current: L.Layer | null }, next: L.Layer | null, shouldDisplay: boolean) => {
    if (mapRef.current && current.current) {
      mapRef.current.removeLayer(current.current);
    }

    current.current = next;

    if (mapRef.current && next && shouldDisplay) {
      next.addTo(mapRef.current);
    }
  }, []);

  // ── Layer management ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    // Retirer toutes les couches
    if (vegetationLayerRef.current) mapRef.current.removeLayer(vegetationLayerRef.current);
    if (heatLayerRef.current) mapRef.current.removeLayer(heatLayerRef.current);
    if (fountainsLayerRef.current) mapRef.current.removeLayer(fountainsLayerRef.current);

    // Ajouter dans l'ordre souhaité : végétation (bas) -> îlots -> fontaines (haut)
    if (vegVisible && vegetationLayerRef.current) {
      vegetationLayerRef.current.addTo(mapRef.current);
    }
    if (heatVisible && heatLayerRef.current) {
      heatLayerRef.current.addTo(mapRef.current);
    }
    if (fountainsVisible && fountainsLayerRef.current) {
      fountainsLayerRef.current.addTo(mapRef.current);
    }
  }, [vegVisible, heatVisible, fountainsVisible]);

  // ── Status updates ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (vegVisible && dataLoaded) {
      setStatus(`${totalZones} zones affichées`);
    } else if (heatVisible && heatDataLoaded) {
      setStatus(`${heatZones} zones de chaleur/fraicheur affichées`);
    } else if (fountainsVisible && fountainsDataLoaded) {
      setStatus(`${fountainsCount} fontaines affichées`);
    } else if (!vegVisible && !heatVisible && !fountainsVisible) {
      setStatus(null);
    }
  }, [vegVisible, heatVisible, fountainsVisible, dataLoaded, heatDataLoaded, fountainsDataLoaded, totalZones, heatZones, fountainsCount]);
  // ── Map init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || mapRef.current) return;
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
        preferCanvas: true,
        minZoom: BORDEAUX_MIN_ZOOM,
        maxZoom: BORDEAUX_MAX_ZOOM,
        maxBounds: BORDEAUX_MAX_BOUNDS,
        maxBoundsViscosity: 1,
      });

      canvasRendererRef.current = L.canvas({ padding: 0.5 });

      L.tileLayer(
        "https://tiles.stadiamaps.com/tiles/alidade_bright/{z}/{x}/{y}{r}.png",
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
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Data fetching ───────────────────────────────────────────────────────────
  const fetchVegetation = useCallback(async (forceReload = false) => {
    setLoading(true);
    setStatus("Chargement des données…");

    const requestId = ++vegetationRequestIdRef.current;

    try {
      const L = await import("leaflet");

      const res = await fetch(`/api/heatmap/vegetation/geojson${buildViewportQuery()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const geoJson: FeatureCollectionWithMeta = await res.json();
      if (requestId !== vegetationRequestIdRef.current) return;

      console.log(`[Végétation] Features chargées: ${geoJson.features.length}`);
      setTotalZones(geoJson.meta?.totalMatching ?? geoJson.features.length);
      const layer = L.geoJSON(geoJson, {
        style: (feature) => {
          const nbArbre = feature?.properties ? (feature.properties as DatahubRecord)?.nb_arbre : null;
          return {
            ...getVegetationStyle(nbArbre),
            renderer: canvasRendererRef.current ?? undefined,
          };
        },
        onEachFeature: (feature, layerItem) => {
          const props = feature.properties ?? {};
          const rows = Object.entries(props)
            .filter(([k]) => k !== "geo_shape")
            .map(([k, v]) => `<div><b>${k}:</b> ${v}</div>`)
            .join("");
          if (rows) {
            layerItem.bindPopup(`<div style="font-family:system-ui;font-size:12px;max-height:200px;overflow:auto">${rows}</div>`);
          }
        },
      });

      replaceLayer(vegetationLayerRef, layer, vegVisible || forceReload);
      setDataLoaded(true);
      setStatus(
        geoJson.meta?.simplified
          ? `${geoJson.meta.displayedCount} / ${geoJson.meta.totalMatching} zones affichees`
          : `${geoJson.features.length} zones affichees`
      );
    } catch (err) {
      console.error("Erreur chargement végétation:", err);
      setStatus("Erreur de chargement — voir console");
    } finally {
      if (requestId === vegetationRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [buildViewportQuery, replaceLayer, vegVisible]);

  const getHeatColor = (delta: number | null): string => {
    if (delta === null || delta === undefined || Number.isNaN(delta)) return "#999";
    if (delta >= 3) return "#c1121f"; // chaud
    if (delta >= 1) return "#f77f00";
    if (delta >= -1) return "#ffd166";
    if (delta >= -3) return "#48cae4";
    return "#118ab2"; // frais
  };

  const getVegetationStyle = (nbArbre: number | null | undefined): L.PathOptions => {
    const count = Number(nbArbre ?? 0);
    if (!count || Number.isNaN(count) || count <= 0) {
      return {
        fillColor: "rgba(82, 183, 136, 0.08)",
        fillOpacity: 0.08,
        color: "rgba(45, 106, 79, 0.12)",
        weight: 0.5,
      };
    }

    const maxCount = 250;
    const ratio = Math.min(1, count / maxCount);
    const opacity = currentZoom <= LOD_THRESHOLDS.MEDIUM_ZOOM ? 0.06 + ratio * 0.28 : 0.08 + ratio * 0.42;
    const lightness = 70 - ratio * 40; // 70% -> 30%
    const fillColor = `hsl(140, 70%, ${lightness}%)`;

    return {
      fillColor,
      fillOpacity: opacity,
      color: "#2d6a4f",
      weight: 1,
    };
  };

  const fetchHeatIslands = useCallback(async () => {
    const requestId = ++heatRequestIdRef.current;
    setHeatLoading(true);
    setStatus("Chargement îlots de chaleur/fraicheur…");

    try {
      const L = await import("leaflet");

      const res = await fetch(`/api/heatmap/source/geojson${buildViewportQuery()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const geoJson: FeatureCollectionWithMeta = await res.json();
      if (requestId !== heatRequestIdRef.current) return;

      console.log(`[Îlots de chaleur] Features chargées: ${geoJson.features.length}`);
      setHeatZones(geoJson.meta?.totalMatching ?? geoJson.features.length);
      const layer = L.geoJSON(geoJson, {
        style: (feature) => {
          const delta = feature?.properties ? (feature.properties as DatahubRecord)?.delta : null;
          const diff = delta != null ? Number(delta) : null;
          const color = getHeatColor(diff);
          const fillOpacity = currentZoom <= LOD_THRESHOLDS.MEDIUM_ZOOM ? 0.22 : 0.3;
          return {
            color,
            fillColor: color,
            fillOpacity,
            weight: currentZoom <= LOD_THRESHOLDS.MEDIUM_ZOOM ? 0.7 : 1,
            renderer: canvasRendererRef.current ?? undefined,
          };
        },
        onEachFeature: (feature, layerItem) => {
          const props = feature.properties ?? {};
          const rows = Object.entries(props)
            .filter(([k]) => k !== "geo_shape")
            .map(([k, v]) => `<div><b>${k}:</b> ${v}</div>`)
            .join("");
          if (rows) {
            layerItem.bindPopup(`<div style="font-family:system-ui;font-size:12px;max-height:200px;overflow:auto">${rows}</div>`);
          }
        },
      });

      replaceLayer(heatLayerRef, layer, heatVisible);
      setHeatDataLoaded(true);
      setStatus(
        geoJson.meta?.simplified
          ? `${geoJson.meta.displayedCount} / ${geoJson.meta.totalMatching} zones affichees`
          : `${geoJson.features.length} zones de chaleur/fraicheur affichees`
      );
    } catch (err) {
      console.error("Erreur chargement îlots de chaleur:", err);
      setStatus("Erreur de chargement — voir console");
    } finally {
      if (requestId === heatRequestIdRef.current) {
        setHeatLoading(false);
      }
    }
  }, [buildViewportQuery, currentZoom, heatVisible, replaceLayer]);

  const fetchFountains = useCallback(async () => {
    setFountainsLoading(true);
    setStatus("Chargement des fontaines…");

    try {
      const L = await import("leaflet");

      // Use the new backend API instead of direct DataHub calls
      const res = await fetch("/api/heatmap/fountains/geojson");
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const geoJson: GeoJSON.FeatureCollection = await res.json();

      const layerGroup = L.layerGroup();

      for (const feature of geoJson.features) {
        if (feature.geometry.type === "Point" && feature.geometry.coordinates) {
          const [lng, lat] = feature.geometry.coordinates;
          const marker = L.circleMarker([lat, lng], {
            color: "#0066cc",
            fillColor: "#0099ff",
            fillOpacity: 0.8,
            radius: 6,
            weight: 2,
          });

          marker.on("mouseover", () => {
            marker.setStyle({ radius: 8, fillOpacity: 1 });
          });
          marker.on("mouseout", () => {
            marker.setStyle({ radius: 6, fillOpacity: 0.8 });
          });

          const props = Object.entries(feature.properties || {})
            .map(([k, v]) => `<div><b>${k}:</b> ${v}</div>`)
            .join("");
          if (props) {
            marker.bindPopup(`<div style="font-family:system-ui;font-size:12px;max-height:200px;overflow:auto">${props}</div>`);
          }

          layerGroup.addLayer(marker);
        }
      }

      const markers = layerGroup.getLayers();
      console.log(`[Fontaines] Total markers créés: ${markers.length}`);
      setFountainsCount(markers.length);

      replaceLayer(fountainsLayerRef, layerGroup, fountainsVisible);
      setFountainsDataLoaded(true);
      setStatus(`${markers.length} fontaines chargées`);

      // La couche sera ajoutée/retirée par le useEffect selon fountainsVisible
    } catch (err) {
      console.error("Erreur chargement fontaines:", err);
      setStatus("Erreur de chargement — voir console");
    } finally {
      setFountainsLoading(false);
    }
  }, [fountainsVisible, replaceLayer]);

  // ── Zoom / pan handler for viewport loading ────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    const handleViewportChange = () => {
      const zoom = mapRef.current!.getZoom();
      setCurrentZoom(zoom);

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = setTimeout(() => {
        if (vegVisible) {
          void fetchVegetation(true);
        }
        if (heatVisible) {
          void fetchHeatIslands();
        }
      }, 120);
    };

    mapRef.current.on("moveend", handleViewportChange);
    mapRef.current.on("zoomend", handleViewportChange);

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      mapRef.current?.off("moveend", handleViewportChange);
      mapRef.current?.off("zoomend", handleViewportChange);
    };
  }, [vegVisible, heatVisible, fetchVegetation, fetchHeatIslands]);

  // ── Toggle handler ──────────────────────────────────────────────────────────
  const handleToggleVegetation = useCallback(async () => {
    if (!dataLoaded) {
      await fetchVegetation();
    }
    setVegVisible((visible) => !visible);
  }, [dataLoaded, fetchVegetation]);

  const handleToggleHeat = useCallback(async () => {
    if (!heatDataLoaded) {
      await fetchHeatIslands();
    }
    setHeatVisible((visible) => !visible);
  }, [heatDataLoaded, fetchHeatIslands]);

  const handleToggleFountains = useCallback(async () => {
    if (!fountainsDataLoaded) {
      await fetchFountains();
    }
    setFountainsVisible((visible) => !visible);
  }, [fountainsDataLoaded, fetchFountains]);

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

          <button
            className={`layer-btn ${heatVisible ? "active" : ""}`}
            onClick={handleToggleHeat}
            disabled={heatLoading}
            aria-pressed={heatVisible}
          >
            <span className="layer-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </span>
            Îlots de chaleur/fraicheur
            {heatLoading && <span className="btn-spinner" />}
          </button>

          <button
            className={`layer-btn ${fountainsVisible ? "active" : ""}`}
            onClick={handleToggleFountains}
            disabled={fountainsLoading}
            aria-pressed={fountainsVisible}
          >
            <span className="layer-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
              </svg>
            </span>
            Fontaines
            {fountainsLoading && <span className="btn-spinner" />}
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
      {(vegVisible || heatVisible || fountainsVisible) && !(loading || heatLoading || fountainsLoading) && (
        <div className="map-legend">
          {vegVisible && (
            <div style={{ marginBottom: (heatVisible || fountainsVisible) ? 10 : 0 }}>
              <p className="legend-title">Végétation urbaine</p>
              <div className="legend-gradient" />
              <div className="legend-labels">
                <span>Faible végétation</span>
                <span>Forte végétation</span>
              </div>
            </div>
          )}

          {heatVisible && (
            <div style={{ marginBottom: fountainsVisible ? 10 : 0 }}>
              <p className="legend-title">Îlots de chaleur/fraicheur</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 16, height: 16, background: "#c1121f", border: "1px solid #a00017", borderRadius: 3 }} />
                  <span style={{ fontSize: 12, color: "#555" }}>+ chaud</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 16, height: 16, background: "#118ab2", border: "1px solid #0e6688", borderRadius: 3 }} />
                  <span style={{ fontSize: 12, color: "#555" }}>+ frais</span>
                </div>
                <span style={{ fontSize: 12, color: "#555" }}>{heatZones} zones</span>
              </div>
            </div>
          )}

          {fountainsVisible && (
            <div>
              <p className="legend-title">Fontaines d'eau potable</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, background: "#0099ff", border: "2px solid #0066cc", borderRadius: "50%" }} />
                <span style={{ fontSize: 12, color: "#555" }}>{fountainsCount} fontaines</span>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .bordeaux-map-wrapper {
          position: relative; width: 100%; height: 100%;
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

        /* Cluster styles */
        .vegetation-cluster-icon {
          background: transparent !important;
          border: none !important;
        }
        .vegetation-cluster {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 600;
          color: white;
          text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
        }
        .vegetation-cluster-small {
          background: linear-gradient(135deg, #52b788, #2d6a4f);
          box-shadow: 0 2px 8px rgba(45,106,79,0.4);
        }
        .vegetation-cluster-medium {
          background: linear-gradient(135deg, #40916c, #1b4332);
          box-shadow: 0 3px 12px rgba(27,67,50,0.5);
        }
        .vegetation-cluster-large {
          background: linear-gradient(135deg, #2d6a4f, #081c15);
          box-shadow: 0 4px 16px rgba(8,28,21,0.6);
        }

        .heat-cluster-icon {
          background: transparent !important;
          border: none !important;
        }
        .heat-cluster {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 600;
          color: white;
          text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
        }
        .heat-cluster-small {
          background: linear-gradient(135deg, #fb8b24, #e85d04);
          box-shadow: 0 2px 8px rgba(232,93,4,0.4);
        }
        .heat-cluster-medium {
          background: linear-gradient(135deg, #e85d04, #c1121f);
          box-shadow: 0 3px 12px rgba(193,18,31,0.5);
        }
        .heat-cluster-large {
          background: linear-gradient(135deg, #c1121f, #780000);
          box-shadow: 0 4px 16px rgba(120,0,0,0.6);
        }
      `}</style>
    </div>
  );
}
