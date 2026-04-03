// =============================================================================
// ui.js — Sidebar, stats, tooltips, notifications, légende, modes
// =============================================================================

const UI = (() => {
  let currentMode = 'tree';  // 'tree' | 'fountain' | 'pan' | 'info'

  // ── Mode ──────────────────────────────────────────────
  function setMode(mode) {
    currentMode = mode;
    const wrap = document.getElementById('wrap');
    wrap.className = mode === 'pan' ? 'pan' : '';
    ['tree','fountain','pan','info'].forEach(m => {
      document.getElementById('btn-'+m)?.classList.toggle('active', m===mode);
      document.getElementById('sb-'+m)?.classList.toggle('active', m===mode);
    });
    const hints = {
      tree:     '🌱 Cliquez sur une zone herbeuse, parc ou bâtiment pour planter un arbre.',
      fountain: '⛲ Cliquez pour installer un point d\'eau sur une zone compatible.',
      pan:      '✋ Clic droit + glisser pour naviguer. Scroll pour zoomer.',
      info:     '🔍 Cliquez sur n\'importe quelle zone pour voir ses infos.',
    };
    document.getElementById('mode-hint').textContent = hints[mode] || '';
  }

  function getMode() { return currentMode; }

  // ── Stats ─────────────────────────────────────────────
  function updateStats(trees, fountains) {
    const { TREE_CO2, TREE_WATER, TREE_TEMP, FOUNTAIN_L } = CONFIG.ECO;

    // Header
    document.getElementById('h-trees').textContent    = trees;
    document.getElementById('h-co2').textContent      = (trees * TREE_CO2).toLocaleString('fr-FR');
    document.getElementById('h-fountains').textContent = fountains;

    // Sidebar arbres
    document.getElementById('tree-count').textContent = trees;
    document.getElementById('eco-co2').textContent    = (trees * TREE_CO2).toLocaleString('fr-FR') + ' kg/an';
    document.getElementById('eco-temp').textContent   = (trees * TREE_TEMP).toFixed(2) + '°C';
    document.getElementById('eco-water').textContent  = (trees * TREE_WATER).toLocaleString('fr-FR') + ' L/an';

    // Sidebar fontaines
    document.getElementById('fountain-count').textContent = fountains;

    _updateProgress('tree', trees, CONFIG.MILESTONES_TREES);
    _updateProgress('fountain', fountains, CONFIG.MILESTONES_FOUNTAINS);
  }

  function _updateProgress(type, n, milestones) {
    let prev = 0, next = milestones[0];
    for (const m of milestones) { if (n >= m) prev = m; else { next = m; break; } }
    const pct = prev === next ? 100 : Math.min(100, (n-prev)/(next-prev)*100);
    const fill = document.getElementById('pfill-'+type);
    const txt  = document.getElementById('milestone-'+type);
    if (fill) fill.style.width = pct + '%';
    if (txt) txt.textContent = n >= milestones[milestones.length-1]
      ? '🏆 Objectif maximum atteint !'
      : `Objectif : ${next} → ${next-n} restants`;
  }

  // ── Info tile ─────────────────────────────────────────
  function showTileInfo(tileName, col, row) {
    const meta = TILE_META[tileName] || {};
    const gps  = MapEngine.toGPS(col, row);
    document.getElementById('tile-box').innerHTML = `
      <div class="tt">${meta.icon||''} ${meta.label||tileName}</div>
      <div>${meta.eco||'—'}</div>
      <div style="color:var(--dim);font-size:14px">
        ${gps.lat.toFixed(5)}°N  ${gps.lon.toFixed(5)}°E
      </div>
      ${meta.plantable
        ? '<span class="badge">✓ Plantable</span>'
        : '<span class="badge no">✗ Non plantable</span>'}
    `;
    document.getElementById('st-zone').textContent = meta.label || tileName;
    document.getElementById('st-pos').textContent  = gps.lat.toFixed(5) + 'N  ' + gps.lon.toFixed(5) + 'E';
  }

  // ── Tooltip générique ─────────────────────────────────
  let _tipEl = null;
  function _tip() { return _tipEl || (_tipEl = document.getElementById('tip')); }

  function showClusterTooltip(e, cluster, level) {
    const gps = MapEngine.toGPS(cluster.col, cluster.row);
    document.getElementById('tip-title').textContent = level.label;
    document.getElementById('tip-content').innerHTML =
      `${cluster.count} arbre${cluster.count>1?'s':''} plantés<br>` +
      `CO₂ absorbé : ~${cluster.count * CONFIG.ECO.TREE_CO2} kg/an<br>` +
      `📍 ${gps.lat.toFixed(5)}°N  ${gps.lon.toFixed(5)}°E`;
    _tip().style.display = 'block';
    moveTooltip(e);
  }

  function showFountainTooltip(e, fountain) {
    document.getElementById('tip-title').textContent = '⛲ Point d\'eau';
    document.getElementById('tip-content').innerHTML =
      `Installé le : ${fountain.date}<br>` +
      `📍 ${fountain.gps.lat.toFixed(5)}°N  ${fountain.gps.lon.toFixed(5)}°E`;
    _tip().style.display = 'block';
    moveTooltip(e);
  }

  function moveTooltip(e) {
    _tip().style.left = (e.clientX + 14) + 'px';
    _tip().style.top  = (e.clientY - 10) + 'px';
  }

  function hideTooltip() { _tip().style.display = 'none'; }

  // ── Notification ─────────────────────────────────────
  function notify(msg) {
    document.querySelectorAll('.notif').forEach(e => e.remove());
    const n = document.createElement('div');
    n.className = 'notif';
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 2600);
  }

  // ── Légende ───────────────────────────────────────────
  function buildLegend() {
    const l = document.getElementById('legend');
    if (!l) return;
    l.innerHTML = '';
    Object.entries(TILE_META).forEach(([name, meta]) => {
      const d = document.createElement('div'); d.className = 'leg';
      const dot = document.createElement('div'); dot.className = 'dot';
      dot.style.background = `rgb(${meta.color.join(',')})`;
      const lbl = document.createElement('span');
      lbl.textContent = meta.icon + ' ' + meta.label;
      lbl.style.fontSize = '14px';
      d.append(dot, lbl); l.appendChild(d);
    });
  }

  // ── Loader ────────────────────────────────────────────
  function setLoader(msg, pct) {
    document.getElementById('lmsg').textContent = msg;
    document.getElementById('lbar').style.width = pct + '%';
  }

  function hideLoader() {
    document.getElementById('loader').style.display = 'none';
  }

  return {
    setMode, getMode, updateStats, showTileInfo,
    showClusterTooltip, showFountainTooltip,
    moveTooltip, hideTooltip,
    notify, buildLegend, setLoader, hideLoader,
  };
})();
