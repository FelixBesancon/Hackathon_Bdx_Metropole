// =============================================================================
// map-engine.ts — Rendu tilemap, camera, coordonnees GPS
// =============================================================================

import { CONFIG, type GPS } from "./config";

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface GridCoords {
  col: number;
  row: number;
  mx: number;
  my: number;
}

export class MapEngine {
  private grid: Uint8Array | null = null;
  private tileNames: string[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private treeLayer: HTMLDivElement | null = null;
  readonly cam: Camera = { x: 0, y: 0, zoom: 1 };

  // ── Chargement grille ──────────────────────────────────
  loadGrid(b64: string): Uint8Array {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  // ── Rendu tilemap ──────────────────────────────────────
  render(
    gridData: Uint8Array,
    tileNames: string[],
    tileColors: Record<string, { base: [number, number, number] }>,
    canvasEl: HTMLCanvasElement,
    treeLayerEl: HTMLDivElement,
  ) {
    this.grid = gridData;
    this.tileNames = tileNames;
    this.canvas = canvasEl;
    this.treeLayer = treeLayerEl;
    const { COLS, ROWS, TILE_PX } = CONFIG;

    canvasEl.width = COLS * TILE_PX;
    canvasEl.height = ROWS * TILE_PX;
    const ctx = canvasEl.getContext("2d")!;
    const img = ctx.createImageData(canvasEl.width, canvasEl.height);
    const px = img.data;

    const colors = tileNames.map(
      (n) => tileColors[n]?.base || ([106, 153, 78] as [number, number, number]),
    );
    function h(x: number, y: number) {
      return (Math.abs((x * 73856093) ^ (y * 19349663)) % 40) - 20;
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const base = colors[gridData[r * COLS + c]] || [106, 153, 78];
        const v = h(c, r);
        for (let py = 0; py < TILE_PX; py++) {
          for (let p = 0; p < TILE_PX; p++) {
            const pv = h(c * TILE_PX + p, r * TILE_PX + py) >> 1;
            const ix = c * TILE_PX + p;
            const iy = (ROWS - 1 - r) * TILE_PX + py;
            const i = (iy * canvasEl.width + ix) << 2;
            px[i] = Math.max(0, Math.min(255, base[0] + v + pv));
            px[i + 1] = Math.max(0, Math.min(255, base[1] + v + pv));
            px[i + 2] = Math.max(0, Math.min(255, base[2] + v + pv));
            px[i + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  // ── Camera ────────────────────────────────────────────
  applyCamera() {
    const t = `translate(${this.cam.x}px,${this.cam.y}px) scale(${this.cam.zoom})`;
    if (this.canvas) this.canvas.style.transform = t;
    if (this.treeLayer) {
      this.treeLayer.style.transform = t;
      this.treeLayer.style.width = CONFIG.COLS * CONFIG.TILE_PX + "px";
      this.treeLayer.style.height = CONFIG.ROWS * CONFIG.TILE_PX + "px";
    }
  }

  resetView(wrapEl: HTMLDivElement) {
    const W = wrapEl.clientWidth;
    const H = wrapEl.clientHeight;
    const mw = CONFIG.COLS * CONFIG.TILE_PX;
    const mh = CONFIG.ROWS * CONFIG.TILE_PX;
    this.cam.zoom = Math.min(W / mw, H / mh) * 0.95;
    this.cam.x = (W - mw * this.cam.zoom) / 2;
    this.cam.y = (H - mh * this.cam.zoom) / 2;
    this.applyCamera();
  }

  zoomAt(factor: number, mx: number, my: number) {
    const nz = Math.min(
      CONFIG.MAX_ZOOM,
      Math.max(CONFIG.MIN_ZOOM, this.cam.zoom * factor),
    );
    this.cam.x = mx - (mx - this.cam.x) * (nz / this.cam.zoom);
    this.cam.y = my - (my - this.cam.y) * (nz / this.cam.zoom);
    this.cam.zoom = nz;
    this.applyCamera();
  }

  pan(dx: number, dy: number) {
    this.cam.x += dx;
    this.cam.y += dy;
    this.applyCamera();
  }

  // ── Conversions coordonnees ───────────────────────────
  screenToMap(sx: number, sy: number) {
    return {
      mx: (sx - this.cam.x) / this.cam.zoom,
      my: (sy - this.cam.y) / this.cam.zoom,
    };
  }

  mapToGrid(mx: number, my: number) {
    const { ROWS, TILE_PX } = CONFIG;
    return {
      col: Math.floor(mx / TILE_PX),
      row: ROWS - 1 - Math.floor(my / TILE_PX),
    };
  }

  screenToGrid(sx: number, sy: number): GridCoords {
    const { mx, my } = this.screenToMap(sx, sy);
    return { ...this.mapToGrid(mx, my), mx, my };
  }

  toGPS(col: number, row: number): GPS {
    const { S, N, W, E } = CONFIG.GPS;
    const { COLS, ROWS } = CONFIG;
    return {
      lat: S + (row / ROWS) * (N - S),
      lon: W + (col / COLS) * (E - W),
    };
  }

  tileAt(col: number, row: number): number | null {
    const { COLS, ROWS } = CONFIG;
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
    return this.grid![row * COLS + col];
  }

  getTileNames(): string[] {
    return this.tileNames;
  }
}
