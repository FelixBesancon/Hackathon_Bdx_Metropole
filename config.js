// =============================================================================
// config.js — Configuration globale Bordeaux Vert
// =============================================================================

const CONFIG = {
  // ── Carte ──────────────────────────────────────────────
  COLS: 747, ROWS: 725, TILE_PX: 16, CELL_M: 50,
  GPS: { S: 44.73, N: 45.07, W: -0.82, E: -0.37 },

  // ── Caméra ─────────────────────────────────────────────
  MIN_ZOOM: 0.04, MAX_ZOOM: 9,

  // ── Amas d'arbres ──────────────────────────────────────
  CLUSTER: {
    RADIUS_PX: 3,    // rayon de regroupement en tiles
    SMALL_PARK: 5,   // seuil petit parc
    GROVE:      10,  // seuil bosquet
    FOREST:     15,  // seuil forêt
  },

  // ── Taille d'affichage des entités ─────────────────────
  TREE_PX:    40,
  CLUSTER_PX: { SMALL_PARK: 48, GROVE: 72, FOREST: 96 },
  FOUNTAIN_PX: 36,

  // ── Impact écologique ──────────────────────────────────
  ECO: {
    TREE_CO2:   22,   // kg CO2/an par arbre
    TREE_WATER: 150,  // litres/an
    TREE_TEMP:  0.02, // °C réduit par arbre
    FOUNTAIN_L: 500,  // litres eau économisés/an (point d'eau public)
  },

  // ── Milestones ─────────────────────────────────────────
  MILESTONES_TREES:     [10, 25, 50, 100, 250, 500, 1000],
  MILESTONES_FOUNTAINS: [5, 10, 25, 50, 100],
};

// ── Métadonnées par type de tile ───────────────────────────
const TILE_META = {
  BUILD_LARGE: { label:"Bâtiment",      eco:"Imperméable",  plantable:true,  color:[185,178,165], icon:"🏢" },
  FOREST:      { label:"Forêt",          eco:"Puits de CO₂", plantable:false, color:[52,100,52],   icon:"🌲" },
  GRASS:       { label:"Prairie",        eco:"Perméable",    plantable:true,  color:[106,153,78],  icon:"🌿" },
  INDUSTRY:    { label:"Zone indus.",    eco:"Polluante",    plantable:true,  color:[155,150,142], icon:"🏭" },
  PARK:        { label:"Parc / Jardin",  eco:"Zone verte",   plantable:true,  color:[130,185,90],  icon:"🌳" },
  RAIL:        { label:"Voie ferrée",    eco:"Neutre",       plantable:false, color:[140,130,120], icon:"🚂" },
  ROAD_MAJOR:  { label:"Route princ.",   eco:"Émetteur CO₂", plantable:false, color:[190,175,145], icon:"🛣" },
  ROAD_MINOR:  { label:"Rue second.",    eco:"Émetteur CO₂", plantable:false, color:[200,188,162], icon:"🛤" },
  WATER:       { label:"Eau / Garonne",  eco:"Ressource",    plantable:false, color:[80,140,200],  icon:"💧" },
};

// ── Niveaux d'amas ─────────────────────────────────────────
const CLUSTER_LEVELS = [
  { min: 1,  max: 4,  type: 'tree',       label: 'Arbre(s)',    size: 40 },
  { min: 5,  max: 9,  type: 'small_park', label: 'Petit parc',  size: 48 },
  { min: 10, max: 14, type: 'park',       label: 'Parc',        size: 72 },
  { min: 15, max: Infinity, type: 'forest', label: 'Forêt',     size: 96 },
];
