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

type VegetationDisplayOption = "none" | "nb_arbre" | "p_veg" | "p_can";

type VegetationMetricBounds = {
  min: number;
  max: number;
};

const ALL_HEAT_CATEGORIES = [
  "très_forte_chaleur",
  "forte_chaleur",
  "chaleur",
  "fraicheur",
  "forte_fraicheur",
  "très_forte_fraicheur",
] as const;
type HeatCategory = typeof ALL_HEAT_CATEGORIES[number];

const HEAT_CATEGORY_LABELS: Record<HeatCategory, string> = {
  très_forte_chaleur:   "Très forte chaleur (>= +9°C)",
  forte_chaleur:        "Forte chaleur (+5 à +8°C)",
  chaleur:              "Chaleur (+1 à +4°C)",
  fraicheur:            "Fraîcheur (-1 à -4°C)",
  forte_fraicheur:      "Forte fraîcheur (-5 à -8°C)",
  très_forte_fraicheur: "Très forte fraîcheur (<= -9°C)",
};

const HEAT_CATEGORY_COLORS: Record<HeatCategory, string> = {
  très_forte_chaleur:   "#780000",
  forte_chaleur:        "#c1121f",
  chaleur:              "#f77f00",
  fraicheur:            "#48cae4",
  forte_fraicheur:      "#118ab2",
  très_forte_fraicheur: "#023e8a",
};

function getHeatCategory(delta: number | null): HeatCategory | null {
  if (delta === null || !Number.isFinite(delta)) return null;
  if (delta >= 9)   return "très_forte_chaleur";
  if (delta >= 5)   return "forte_chaleur";
  if (delta >= 1)   return "chaleur";
  if (delta <= -9)  return "très_forte_fraicheur";
  if (delta <= -5)  return "forte_fraicheur";
  if (delta <= -1)  return "fraicheur";
  return null; // zone neutre (-1 < delta < +1)
}

function featureMatchesHeatFilters(feature: GeoJSON.Feature, filters: Set<HeatCategory>): boolean {
  const delta = (feature.properties as DatahubRecord)?.delta;
  const cat = getHeatCategory(delta != null ? Number(delta) : null);
  if (cat === null) return true; // zones neutres toujours visibles
  return filters.has(cat);
}

const VEG_TOOLTIPS: Record<"nb_arbre" | "p_veg" | "p_can", string> = {
  nb_arbre: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nombre total d'arbres recensés dans la zone hexagonale.",
  p_veg:    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pourcentage de surface végétalisée par rapport à la surface totale de la zone.",
  p_can:    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pourcentage de couverture par la canopée arborée au sein de la zone.",
};

// ─── Constants ───────────────────────────────────────────────────────────────

const BORDEAUX_CENTER: [number, number] = [44.8378, -0.5792];
const BORDEAUX_ZOOM = 13;
const BORDEAUX_MIN_ZOOM = 11;
const BORDEAUX_MAX_ZOOM = 18;
const BORDEAUX_MAX_BOUNDS: [[number, number], [number, number]] = [
  [44.67, -0.92],
  [45.05, -0.30],
];

const VEGETATION_PANE = "vegetationPane";
const HEAT_PANE = "heatPane";

// LOD (Level of Detail) thresholds
const LOD_THRESHOLDS = {
  LOW_ZOOM: 11,
  MEDIUM_ZOOM: 13,
  HIGH_ZOOM: 15,
};

function getFountainName(props: Record<string, unknown>): string {
  const find = (...keys: string[]) => findPropertyValue(props, ...keys);

  const candidates = [
    find("name"),
    find("nom"),
    find("nom_fontaine"),
    find("nom_points_d_eau"),
    find("nom_points_eau"),
    find("denomination"),
    find("libelle"),
    find("designation"),
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "Inconnu";
}

function getFountainStatus(props: Record<string, unknown>): "fonctionnelle" | "hors-service" | "inconnu" {
  const find = (...keys: string[]) => findPropertyValue(props, ...keys);

  const candidates = [
    find("etat"),
    find("status"),
    find("statut"),
    find("fonctionnelle"),
    find("fonctionnel"),
    find("disponible"),
  ];

  for (const value of candidates) {
    if (typeof value === "boolean") {
      return value ? "fonctionnelle" : "hors-service";
    }

    if (typeof value === "number") {
      return value === 1 ? "fonctionnelle" : value === 0 ? "hors-service" : "inconnu";
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["ok", "active", "actif", "fonctionnelle", "fonctionnel", "en service", "ouvert", "disponible", "oui", "true", "1"].includes(normalized)) {
        return "fonctionnelle";
      }
      if (["ko", "hs", "hors service", "hors-service", "inactive", "inactif", "panne", "ferme", "fermé", "non", "false", "0"].includes(normalized)) {
        return "hors-service";
      }
    }
  }

  return "inconnu";
}

function normalizePropertyKey(key: string): string {
  return key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function findPropertyValue(props: Record<string, unknown>, ...keys: string[]): unknown {
  const normalized = new Map<string, unknown>();

  for (const [key, value] of Object.entries(props)) {
    normalized.set(normalizePropertyKey(key), value);
  }

  for (const key of keys) {
    const value = normalized.get(normalizePropertyKey(key));
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

function toDisplayNumber(value: unknown): string {
  const asNumber = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(asNumber)) return "inconnu";
  return Number.isInteger(asNumber) ? String(asNumber) : asNumber.toFixed(2).replace(/\.00$/, "");
}

function toDisplayPercent(value: unknown): string {
  const asNumber = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(asNumber)) return "inconnu";
  return `${Number.isInteger(asNumber) ? asNumber : Number(asNumber.toFixed(2))} %`;
}

function formatDeltaTemperature(value: unknown): string {
  const asNumber = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(asNumber)) return "inconnu";

  const rounded = Number.isInteger(asNumber) ? asNumber : Number(asNumber.toFixed(2));
  if (rounded === 0) return "0 °C";
  return `${rounded > 0 ? "+" : ""}${rounded} °C`;
}

function extractVegetationMetricValue(
  props: Record<string, unknown>,
  display: VegetationDisplayOption
): number | null {
  if (display === "none") return null;

  const raw =
    display === "nb_arbre"
      ? findPropertyValue(props, "nb_arbre")
      : display === "p_veg"
        ? findPropertyValue(props, "p_veg")
        : findPropertyValue(props, "p_can");

  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return null;

  if (display !== "nb_arbre") {
    return numeric <= 1 ? numeric * 100 : numeric;
  }

  return numeric;
}

function computeVegetationMetricBounds(
  geoJson: FeatureCollectionWithMeta,
  display: VegetationDisplayOption
): VegetationMetricBounds | null {
  if (display === "none") return null;

  const values: number[] = [];

  for (const feature of geoJson.features) {
    const props = (feature.properties ?? {}) as Record<string, unknown>;
    const value = extractVegetationMetricValue(props, display);
    if (value !== null && Number.isFinite(value)) {
      values.push(value);
    }
  }

  if (!values.length) return null;

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BordeauxMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const canvasRendererRef = useRef<L.Renderer | null>(null);
  const svgRendererRef = useRef<L.Renderer | null>(null);
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
  const [vegetationDisplay, setVegetationDisplay] = useState<VegetationDisplayOption>("none");
  const [heatFilters, setHeatFilters] = useState<Set<HeatCategory>>(new Set(ALL_HEAT_CATEGORIES));
  const heatGeoJsonRef = useRef<FeatureCollectionWithMeta | null>(null);
  const allHeatFiltersSelected = ALL_HEAT_CATEGORIES.every((cat) => heatFilters.has(cat));

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
      svgRendererRef.current = L.svg({ padding: 0.5 });

      map.createPane(VEGETATION_PANE);
      map.createPane(HEAT_PANE);

      map.getPane(VEGETATION_PANE)!.style.zIndex = "390";
      map.getPane(HEAT_PANE)!.style.zIndex = "395";

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
  const fetchVegetation = useCallback(async (forceReload = false, displayMode: VegetationDisplayOption = vegetationDisplay) => {
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
      const metricBounds = computeVegetationMetricBounds(geoJson, displayMode);
      const layer = L.geoJSON(geoJson, {
        pane: VEGETATION_PANE,
        style: (feature) => {
          const props = (feature?.properties ?? {}) as DatahubRecord;
          return {
            ...getVegetationStyle(props, displayMode, metricBounds),
            renderer: canvasRendererRef.current ?? undefined,
          };
        },
        onEachFeature: (feature, layerItem) => {
          const props = (feature.properties ?? {}) as Record<string, unknown>;
          const nbArbre = findPropertyValue(props, "nb_arbre");
          const pVeg = findPropertyValue(props, "p_veg");
          const pCan = findPropertyValue(props, "p_can");
          const pArtif = findPropertyValue(props, "p_artif");

          layerItem.bindPopup(
            `<div style="font-family:system-ui;font-size:12px;line-height:1.5">
              <div><b>Nombre d'arbres:</b> ${toDisplayNumber(nbArbre)}</div>
              <div><b>Végétalisation:</b> ${toDisplayPercent(pVeg)}</div>
              <div><b>Canopée:</b> ${toDisplayPercent(pCan)}</div>
              <div><b>Surface artificialisée:</b> ${toDisplayPercent(pArtif)}</div>
            </div>`
          );
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
  }, [buildViewportQuery, replaceLayer, vegVisible, vegetationDisplay]);

  const getHeatColor = (delta: number | null): string => {
    if (delta === null || delta === undefined || Number.isNaN(delta)) return "#999";
    if (delta >= 3) return "#c1121f"; // chaud
    if (delta >= 1) return "#f77f00";
    if (delta >= -1) return "#ffd166";
    if (delta >= -3) return "#48cae4";
    return "#118ab2"; // frais
  };

  const getVegetationStyle = (
    props: DatahubRecord,
    displayMode: VegetationDisplayOption,
    bounds: VegetationMetricBounds | null
  ): L.PathOptions => {
    const sharedBorderColor = "rgba(86, 112, 98, 0.55)";
    const sharedBorderWeight = 0.7;

    if (displayMode === "none") {
      return {
        fillColor: "rgba(120, 120, 120, 0.06)",
        fillOpacity: 0.06,
        color: sharedBorderColor,
        weight: sharedBorderWeight,
      };
    }

    const count = extractVegetationMetricValue(props, displayMode);

    if (displayMode === "nb_arbre") {
      const n = count ?? 0;
      let fillColor: string;
      let fillOpacity: number;
      if (n < 10)        { fillColor = "transparent";             fillOpacity = 0; }
      else if (n < 50)  { fillColor = "hsl(126, 58%, 91%)";      fillOpacity = 0.18; }
      else if (n < 100) { fillColor = "hsl(126, 62%, 78%)";      fillOpacity = 0.28; }
      else if (n < 250) { fillColor = "hsl(126, 65%, 63%)";      fillOpacity = 0.37; }
      else if (n < 500) { fillColor = "hsl(126, 68%, 48%)";      fillOpacity = 0.46; }
      else if (n < 750) { fillColor = "hsl(126, 71%, 35%)";      fillOpacity = 0.53; }
      else if (n < 1000){ fillColor = "hsl(126, 73%, 25%)";      fillOpacity = 0.59; }
      else              { fillColor = "hsl(126, 76%, 16%)";      fillOpacity = 0.65; }
      return { fillColor, fillOpacity, color: sharedBorderColor, weight: sharedBorderWeight };
    }

    if (displayMode === "p_can") {
      const p = count ?? 0;
      let fillColor: string;
      let fillOpacity: number;
      if (p < 5)        { fillColor = "transparent";             fillOpacity = 0; }
      else if (p < 15)  { fillColor = "hsl(188, 56%, 88%)";      fillOpacity = 0.18; }
      else if (p < 30)  { fillColor = "hsl(188, 62%, 73%)";      fillOpacity = 0.28; }
      else if (p < 50)  { fillColor = "hsl(188, 67%, 56%)";      fillOpacity = 0.40; }
      else if (p < 70)  { fillColor = "hsl(188, 71%, 38%)";      fillOpacity = 0.50; }
      else if (p < 85)  { fillColor = "hsl(188, 74%, 26%)";      fillOpacity = 0.58; }
      else              { fillColor = "hsl(188, 76%, 17%)";      fillOpacity = 0.65; }
      return { fillColor, fillOpacity, color: sharedBorderColor, weight: sharedBorderWeight };
    }

    // p_veg: continuous scale (already satisfactory)
    if (count === null || count <= 0 || !bounds) {
      return {
        fillColor: "rgba(82, 183, 136, 0.08)",
        fillOpacity: 0.08,
        color: sharedBorderColor,
        weight: sharedBorderWeight,
      };
    }
    const range = Math.max(0.0001, bounds.max - bounds.min);
    const ratio = Math.min(1, Math.max(0, (count - bounds.min) / range));
    const opacity = currentZoom <= LOD_THRESHOLDS.MEDIUM_ZOOM ? 0.12 + ratio * 0.36 : 0.16 + ratio * 0.46;
    const lightness = 90 - ratio * 60;
    return {
      fillColor: `hsl(95, 75%, ${lightness}%)`,
      fillOpacity: opacity,
      color: sharedBorderColor,
      weight: sharedBorderWeight,
    };
  };

  useEffect(() => {
    if (!vegVisible || !dataLoaded) return;
    void fetchVegetation(true, vegetationDisplay);
  }, [vegetationDisplay, vegVisible, dataLoaded, fetchVegetation]);

  // ── Render heat layer from cached GeoJSON + active filters ────────────────
  const renderHeatLayer = useCallback(async (geoJson: FeatureCollectionWithMeta, filters: Set<HeatCategory>) => {
    const L = await import("leaflet");
    const filtered: FeatureCollectionWithMeta = {
      ...geoJson,
      features: geoJson.features.filter((f) => featureMatchesHeatFilters(f, filters)),
    };
    const layer = L.geoJSON(filtered, {
      pane: HEAT_PANE,
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
        const props = (feature.properties ?? {}) as Record<string, unknown>;
        const delta = findPropertyValue(props, "delta");
        layerItem.bindPopup(
          `<div style="font-family:system-ui;font-size:12px;line-height:1.5">
            <div><b>Delta de température:</b> ${formatDeltaTemperature(delta)}</div>
          </div>`
        );
      },
    });
    replaceLayer(heatLayerRef, layer, heatVisible);
  }, [currentZoom, heatVisible, replaceLayer]);

  const fetchHeatIslands = useCallback(async () => {
    const requestId = ++heatRequestIdRef.current;
    setHeatLoading(true);
    setStatus("Chargement îlots de chaleur/fraicheur…");

    try {
      const res = await fetch(`/api/heatmap/source/geojson${buildViewportQuery()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const geoJson: FeatureCollectionWithMeta = await res.json();
      if (requestId !== heatRequestIdRef.current) return;

      console.log(`[Îlots de chaleur] Features chargées: ${geoJson.features.length}`);
      setHeatZones(geoJson.meta?.totalMatching ?? geoJson.features.length);
      heatGeoJsonRef.current = geoJson;
      await renderHeatLayer(geoJson, heatFilters);
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
  }, [buildViewportQuery, heatFilters, renderHeatLayer]);

  // Re-render heat layer when filters change (or layer becomes visible again)
  useEffect(() => {
    if (!heatVisible || !heatDataLoaded || !heatGeoJsonRef.current) return;
    void renderHeatLayer(heatGeoJsonRef.current, heatFilters);
  }, [heatFilters, heatVisible, heatDataLoaded, renderHeatLayer]);

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
            renderer: svgRendererRef.current ?? undefined,
          });

          marker.on("mouseover", () => {
            marker.setStyle({ radius: 8, fillOpacity: 1 });
          });
          marker.on("mouseout", () => {
            marker.setStyle({ radius: 6, fillOpacity: 0.8 });
          });

          const rawProps = (feature.properties || {}) as Record<string, unknown>;
          const name = getFountainName(rawProps);
          const state = getFountainStatus(rawProps);

          marker.bindPopup(
            `<div style="font-family:system-ui;font-size:12px;line-height:1.45">
              <div><b>Nom:</b> ${name}</div>
              <div><b>Etat:</b> ${state}</div>
            </div>`
          );

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
          void fetchVegetation(true, vegetationDisplay);
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
  }, [vegVisible, heatVisible, vegetationDisplay, fetchVegetation, fetchHeatIslands]);

  // ── Toggle handler ──────────────────────────────────────────────────────────
  const handleToggleVegetation = useCallback(async () => {
    if (vegVisible) {
      setVegVisible(false);
      setVegetationDisplay("none");
      return;
    }

    setVegetationDisplay("nb_arbre");
    if (!dataLoaded) {
      await fetchVegetation(false, "nb_arbre");
    }
    setVegVisible(true);
  }, [dataLoaded, fetchVegetation, vegVisible]);

  const handleToggleHeat = useCallback(async () => {
    if (heatVisible) {
      setHeatVisible(false);
      return;
    }
    if (!heatDataLoaded) {
      await fetchHeatIslands();
    }
    setHeatVisible(true);
  }, [heatDataLoaded, fetchHeatIslands, heatVisible]);

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

          {vegVisible && (
            <div className="display-options">
              <span className="layers-label">Affichage</span>
              {(["nb_arbre", "p_veg", "p_can"] as const).map((key) => (
                <div key={key} className="display-option-row">
                  <label className="display-option-check">
                    <input
                      type="checkbox"
                      checked={vegetationDisplay === key}
                      onChange={() => setVegetationDisplay((prev) => (prev === key ? "none" : key))}
                    />
                    {key === "nb_arbre" ? "Nombre d'arbres" : key === "p_veg" ? "Végétalisation" : "Canopée"}
                  </label>
                  <span className="info-hover" aria-label="Information">
                    <span className="info-btn">?</span>
                    <span className="info-popover">{VEG_TOOLTIPS[key]}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

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

          {heatVisible && (
            <div className="display-options">
              <span className="layers-label">Filtres</span>
              <label className="display-option display-option-all">
                <input
                  type="checkbox"
                  checked={allHeatFiltersSelected}
                  onChange={() => {
                    setHeatFilters(allHeatFiltersSelected ? new Set<HeatCategory>() : new Set(ALL_HEAT_CATEGORIES));
                  }}
                />
                Tout
              </label>
              {ALL_HEAT_CATEGORIES.map((cat) => (
                <label key={cat} className="display-option">
                  <input
                    type="checkbox"
                    checked={heatFilters.has(cat)}
                    onChange={() => {
                      setHeatFilters((prev) => {
                        const next = new Set(prev);
                        if (next.has(cat)) next.delete(cat); else next.add(cat);
                        return next;
                      });
                    }}
                  />
                  <span className="heat-dot" style={{ background: HEAT_CATEGORY_COLORS[cat] }} />
                  {HEAT_CATEGORY_LABELS[cat]}
                </label>
              ))}
            </div>
          )}

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
              {vegetationDisplay === "none" ? (
                <span style={{ fontSize: 12, color: "#666" }}>Choisir un affichage pour colorer les hexagones</span>
              ) : vegetationDisplay === "nb_arbre" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {([
                    { color: "rgba(86,112,98,0.18)", label: "< 10 arbres" },
                    { color: "hsl(126, 58%, 91%)",  label: "10 – 49" },
                    { color: "hsl(126, 62%, 78%)",  label: "50 – 99" },
                    { color: "hsl(126, 65%, 63%)",  label: "100 – 249" },
                    { color: "hsl(126, 68%, 48%)",  label: "250 – 499" },
                    { color: "hsl(126, 71%, 35%)",  label: "500 – 749" },
                    { color: "hsl(126, 73%, 25%)",  label: "750 – 999" },
                    { color: "hsl(126, 76%, 16%)",  label: "≥ 1000" },
                  ] as { color: string; label: string }[]).map(({ color, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 14, height: 14, background: color, border: "1px solid rgba(86,112,98,0.55)", borderRadius: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: "#555" }}>{label}</span>
                    </div>
                  ))}
                </div>
              ) : vegetationDisplay === "p_can" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {([
                    { color: "rgba(86,112,98,0.18)", label: "< 5 %" },
                    { color: "hsl(188, 56%, 88%)",  label: "5 – 14 %" },
                    { color: "hsl(188, 62%, 73%)",  label: "15 – 29 %" },
                    { color: "hsl(188, 67%, 56%)",  label: "30 – 49 %" },
                    { color: "hsl(188, 71%, 38%)",  label: "50 – 69 %" },
                    { color: "hsl(188, 74%, 26%)",  label: "70 – 84 %" },
                    { color: "hsl(188, 76%, 17%)",  label: "≥ 85 %" },
                  ] as { color: string; label: string }[]).map(({ color, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 14, height: 14, background: color, border: "1px solid rgba(86,112,98,0.55)", borderRadius: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: "#555" }}>{label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div
                    className="legend-gradient"
                    style={{ background: "linear-gradient(to right, hsl(95, 75%, 90%), hsl(95, 75%, 30%))" }}
                  />
                  <div className="legend-labels">
                    <span>Faible %</span>
                    <span>Fort %</span>
                  </div>
                </>
              )}
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
          position: absolute; top: 12px; left: 16px;
          z-index: 1200; display: flex; flex-direction: column; align-items: stretch; gap: 10px;
          background: rgba(255,255,255,0.96); backdrop-filter: blur(12px);
          border: 1px solid rgba(0,0,0,0.08); border-radius: 14px;
          padding: 10px 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.10); width: 260px;
          max-height: min(52vh, calc(100% - 24px));
          overflow-y: auto;
          overflow-x: hidden;
        }
        .toolbar-left { display: flex; flex-direction: column; padding-bottom: 8px; border-bottom: 1px solid rgba(0,0,0,0.08); }
        .toolbar-title { font-size: 13px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.2px; }
        .toolbar-subtitle { font-size: 11px; color: #888; margin-top: 1px; }
        .toolbar-layers { display: flex; flex-direction: column; align-items: stretch; gap: 6px; }
        .layers-label { font-size: 11px; font-weight: 600; color: #7f8c8d; text-transform: uppercase; letter-spacing: 0.6px; margin-top: 2px; }
        .layer-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px; font-size: 13px; font-weight: 500; color: #555;
          background: transparent; border: 1px solid rgba(0,0,0,0.12);
          border-radius: 8px; cursor: pointer; transition: all 0.15s ease;
          user-select: none; line-height: 1; justify-content: flex-start; width: 100%;
        }
        .layer-btn:not(:disabled):hover { background: #f0f9f4; border-color: rgba(45,106,79,0.4); color: #2d6a4f; }
        .layer-btn.active { background: #d8f3dc; border-color: #52b788; color: #1b4332; }
        .layer-btn:disabled { opacity: 0.38; cursor: not-allowed; }
        .layer-icon { display: flex; align-items: center; line-height: 0; }
        .btn-spinner { display: inline-block; width: 10px; height: 10px; border: 1.5px solid rgba(27,67,50,0.3); border-top-color: #2d6a4f; border-radius: 50%; animation: spin 0.7s linear infinite; margin-left: 2px; }
        .status-pill { display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: #f0f9f4; border: 1px solid rgba(45,106,79,0.2); border-radius: 10px; font-size: 12px; color: #2d6a4f; font-weight: 500; }
        .status-pill.loading { color: #888; background: #f5f5f5; border-color: rgba(0,0,0,0.08); }
        .pill-spinner { display: inline-block; width: 10px; height: 10px; border: 1.5px solid rgba(0,0,0,0.15); border-top-color: #888; border-radius: 50%; animation: spin 0.7s linear infinite; }
        .display-options {
          border-top: 1px dashed rgba(0,0,0,0.12);
          margin-top: 4px;
          padding-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .display-option-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }
        .display-option-check {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #4a4a4a;
          cursor: pointer;
          flex: 1;
        }
        .display-option-check input {
          accent-color: #2d6a4f;
          width: 14px;
          height: 14px;
          cursor: pointer;
        }
        .info-hover {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .info-btn {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.2);
          background: #f0f0f0;
          color: #555;
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: background 0.1s;
        }
        .info-hover:hover .info-btn { background: #2d6a4f; color: #fff; border-color: #2d6a4f; }
        .info-popover {
          position: absolute;
          left: 22px;
          top: 50%;
          transform: translateY(-50%);
          min-width: 170px;
          max-width: 240px;
          font-size: 11px;
          color: #555;
          font-style: normal;
          line-height: 1.35;
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(45, 106, 79, 0.28);
          border-radius: 8px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
          padding: 7px 9px;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.12s ease;
          z-index: 20;
        }
        .info-hover:hover .info-popover { opacity: 1; visibility: visible; }
        .display-option {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #4a4a4a;
          cursor: pointer;
        }
        .display-option-all {
          font-weight: 600;
          color: #2d6a4f;
          padding-bottom: 2px;
          margin-bottom: 2px;
          border-bottom: 1px dotted rgba(45, 106, 79, 0.28);
        }
        .display-option input {
          accent-color: #2d6a4f;
          width: 14px;
          height: 14px;
          cursor: pointer;
        }
        .heat-dot {
          flex-shrink: 0;
          width: 10px;
          height: 10px;
          border-radius: 2px;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .map-container { flex: 1; width: 100%; height: 100%; }
        .map-legend { position: absolute; bottom: 18px; left: 16px; z-index: 1000; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border: 1px solid rgba(0,0,0,0.08); border-radius: 9px; padding: 9px 10px; min-width: 130px; max-width: 200px; max-height: 34vh; overflow: auto; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
        .legend-title { font-size: 10px; font-weight: 600; color: #333; text-transform: uppercase; letter-spacing: 0.45px; margin: 0 0 6px; }
        .legend-gradient { width: 100%; height: 8px; border-radius: 4px; background: linear-gradient(to right, rgba(220,237,200,0.08), rgba(168,213,139,0.45), rgba(82,183,136,0.75), rgba(27,67,50,0.9)); border: 1px solid rgba(45,106,79,0.2); margin-bottom: 4px; }
        .legend-labels { display: flex; justify-content: space-between; font-size: 9px; color: #888; }
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
