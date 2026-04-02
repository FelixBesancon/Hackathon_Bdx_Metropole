// =============================================================================
// map.js — Rendu tilemap, caméra, coordonnées GPS
// =============================================================================

const MapEngine = (() => {
  let grid = null;
  let canvas = null;
  let treeLayer = null;

  // ── Chargement grille ──────────────────────────────────
  function loadGrid(b64) {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  // ── Rendu tilemap ──────────────────────────────────────
  let _tileNames = [];

  function render(gridData, tileNames, tileColors) {
    grid = gridData;
    _tileNames = tileNames;
    canvas = document.getElementById('map-canvas');
    treeLayer = document.getElementById('tree-layer');
    const { COLS, ROWS, TILE_PX } = CONFIG;

    canvas.width  = COLS * TILE_PX;
    canvas.height = ROWS * TILE_PX;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(canvas.width, canvas.height);
    const px  = img.data;

    const colors = tileNames.map(n => (tileColors[n]?.base || [106,153,78]));
    function h(x,y) { return Math.abs((x*73856093^y*19349663)) % 40 - 20; }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const base = colors[gridData[r*COLS+c]] || [106,153,78];
        const v = h(c, r);
        for (let py = 0; py < TILE_PX; py++) {
          for (let p = 0; p < TILE_PX; p++) {
            const pv = h(c*TILE_PX+p, r*TILE_PX+py) >> 1;
            const ix = c*TILE_PX + p;
            const iy = (ROWS-1-r)*TILE_PX + py;
            const i  = (iy*canvas.width + ix) << 2;
            px[i]   = Math.max(0, Math.min(255, base[0]+v+pv));
            px[i+1] = Math.max(0, Math.min(255, base[1]+v+pv));
            px[i+2] = Math.max(0, Math.min(255, base[2]+v+pv));
            px[i+3] = 255;
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  // ── Caméra ────────────────────────────────────────────
  const cam = { x:0, y:0, zoom:1 };

  function applyCamera() {
    const t = `translate(${cam.x}px,${cam.y}px) scale(${cam.zoom})`;
    document.getElementById('map-canvas').style.transform = t;
    const tl = document.getElementById('tree-layer');
    tl.style.transform = t;
    tl.style.width  = (CONFIG.COLS * CONFIG.TILE_PX) + 'px';
    tl.style.height = (CONFIG.ROWS * CONFIG.TILE_PX) + 'px';
    document.getElementById('st-zoom').textContent = Math.round(cam.zoom*100) + '%';
  }

  function resetView() {
    const wrap = document.getElementById('wrap');
    const W = wrap.clientWidth, H = wrap.clientHeight;
    const mw = CONFIG.COLS * CONFIG.TILE_PX;
    const mh = CONFIG.ROWS * CONFIG.TILE_PX;
    cam.zoom = Math.min(W/mw, H/mh) * 0.95;
    cam.x = (W - mw*cam.zoom) / 2;
    cam.y = (H - mh*cam.zoom) / 2;
    applyCamera();
  }

  function zoomAt(factor, mx, my) {
    const nz = Math.min(CONFIG.MAX_ZOOM, Math.max(CONFIG.MIN_ZOOM, cam.zoom*factor));
    cam.x = mx - (mx - cam.x) * (nz / cam.zoom);
    cam.y = my - (my - cam.y) * (nz / cam.zoom);
    cam.zoom = nz;
    applyCamera();
  }

  function pan(dx, dy) {
    cam.x += dx; cam.y += dy;
    applyCamera();
  }

  // ── Conversions coordonnées ───────────────────────────
  function screenToMap(sx, sy) {
    return {
      mx: (sx - cam.x) / cam.zoom,
      my: (sy - cam.y) / cam.zoom,
    };
  }

  function mapToGrid(mx, my) {
    const { COLS, ROWS, TILE_PX } = CONFIG;
    return {
      col: Math.floor(mx / TILE_PX),
      row: ROWS - 1 - Math.floor(my / TILE_PX),
    };
  }

  function screenToGrid(sx, sy) {
    const { mx, my } = screenToMap(sx, sy);
    return { ...mapToGrid(mx, my), mx, my };
  }

  function toGPS(col, row) {
    const { S, N, W, E } = CONFIG.GPS;
    const { COLS, ROWS } = CONFIG;
    return {
      lat: S + (row / ROWS) * (N - S),
      lon: W + (col / COLS) * (E - W),
    };
  }

  function tileAt(col, row) {
    const { COLS, ROWS } = CONFIG;
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
    return grid[row * COLS + col];
  }

  function getCamera() { return cam; }

  function getTileNames() { return _tileNames; }
  return { loadGrid, render, resetView, zoomAt, pan, applyCamera,
           screenToGrid, toGPS, tileAt, getCamera, getTileNames };
})();
