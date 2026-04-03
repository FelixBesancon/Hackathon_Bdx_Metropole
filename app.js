// =============================================================================
// app.js — Point d'entrée, chargement données, événements
// =============================================================================

async function boot() {
  UI.setLoader('Chargement des données...', 10);

  // Chargement fetch (bien plus rapide que du JS inline)
  const res  = await fetch('data.json');
  const data = await res.json();

  UI.setLoader('Décodage de la grille...', 35);
  await tick();

  const grid = MapEngine.loadGrid(data.grid_b64);

  UI.setLoader('Rendu pixel art...', 55);
  await tick();

  MapEngine.render(grid, data.tile_names, data.tile_colors);

  UI.setLoader('Chargement des sprites...', 72);
  await Entities.initSprites(data.sprites);

  UI.setLoader('Finalisation...', 90);
  await tick();

  UI.buildLegend();
  MapEngine.resetView();
  UI.updateStats(0, 0);
  UI.setMode('tree');
  bindEvents();

  UI.setLoader('Prêt !', 100);
  await tick(300);
  UI.hideLoader();
}

function tick(ms=30) { return new Promise(r => setTimeout(r, ms)); }

function bindEvents() {
  const wrap = document.getElementById('wrap');
  let drag = false, dx = 0, dy = 0, cx = 0, cy = 0;

  wrap.addEventListener('click', e => {
    if (drag) return;
    const rect = wrap.getBoundingClientRect();
    const { col, row, mx, my } = MapEngine.screenToGrid(e.clientX - rect.left, e.clientY - rect.top);
    const tileIdx = MapEngine.tileAt(col, row);
    if (tileIdx === null) return;
    const tileName = MapEngine.getTileNames()[tileIdx];
    UI.showTileInfo(tileName, col, row);
    const mode = UI.getMode();
    if (mode === 'tree')     Entities.plantTree(mx, my, col, row, tileIdx);
    if (mode === 'fountain') Entities.plantFountain(mx, my, col, row, tileIdx);
  });

  wrap.addEventListener('mousedown', e => {
    if (e.button === 2 || UI.getMode() === 'pan') {
      drag = false;
      dx = e.clientX; dy = e.clientY;
      const cam = MapEngine.getCamera();
      cx = cam.x; cy = cam.y;
      wrap.classList.add('drag');
      e.preventDefault();
      wrap.addEventListener('mousemove', onDrag);
    }
  });

  function onDrag(e) {
    if (Math.abs(e.clientX-dx)+Math.abs(e.clientY-dy) > 3) drag = true;
    const cam = MapEngine.getCamera();
    cam.x = cx + (e.clientX - dx);
    cam.y = cy + (e.clientY - dy);
    MapEngine.applyCamera();
  }

  window.addEventListener('mouseup', () => {
    wrap.removeEventListener('mousemove', onDrag);
    wrap.classList.remove('drag');
    setTimeout(() => drag = false, 50);
  });

  wrap.addEventListener('mousemove', e => {
    const rect = wrap.getBoundingClientRect();
    const { col, row } = MapEngine.screenToGrid(e.clientX-rect.left, e.clientY-rect.top);
    const tileIdx = MapEngine.tileAt(col, row);
    if (tileIdx !== null) {
      const gps = MapEngine.toGPS(col, row);
      document.getElementById('st-pos').textContent  = gps.lat.toFixed(5) + '°N  ' + gps.lon.toFixed(5) + '°E';
      document.getElementById('st-zone').textContent = MapEngine.getTileNames()[tileIdx];
    }
  });

  wrap.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = wrap.getBoundingClientRect();
    MapEngine.zoomAt(e.deltaY < 0 ? 1.12 : 0.89, e.clientX-rect.left, e.clientY-rect.top);
  }, { passive: false });

  wrap.addEventListener('contextmenu', e => e.preventDefault());

  window.addEventListener('keydown', e => {
    const s = Math.max(40, 90 * MapEngine.getCamera().zoom);
    if (e.key==='ArrowUp'   ||e.key==='z') MapEngine.pan(0,  s);
    if (e.key==='ArrowDown' ||e.key==='s') MapEngine.pan(0, -s);
    if (e.key==='ArrowLeft' ||e.key==='q') MapEngine.pan( s, 0);
    if (e.key==='ArrowRight'||e.key==='d') MapEngine.pan(-s, 0);
    if (e.key==='+'||e.key==='=') MapEngine.zoomAt(1.2, window.innerWidth/2, window.innerHeight/2);
    if (e.key==='-')               MapEngine.zoomAt(.83, window.innerWidth/2, window.innerHeight/2);
    if (e.key==='r'||e.key==='R') MapEngine.resetView();
    if (e.key==='1') UI.setMode('tree');
    if (e.key==='2') UI.setMode('fountain');
    if (e.key==='3') UI.setMode('pan');
    if (e.key==='4') UI.setMode('info');
  });

  window.addEventListener('resize', () => MapEngine.resetView());
}

boot();
