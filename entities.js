// =============================================================================
// entities.js — Arbres, fontaines, amas (clusters)
// =============================================================================

const Entities = (() => {
  // ── State ─────────────────────────────────────────────
  const trees     = [];   // { id, col, row, mx, my, tileName, date, gps }
  const fountains = [];   // { id, col, row, mx, my, tileName, date, gps }
  let treeCount    = 0;
  let fountainCount = 0;

  // ── Sprites nettoyés ─────────────────────────────────
  const sprites = {};

  function removeBlack(img, sz=128) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = sz;
    const cx = cv.getContext('2d');
    cx.drawImage(img, 0, 0, sz, sz);
    const id = cx.getImageData(0, 0, sz, sz);
    const px = id.data;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i]<40 && px[i+1]<40 && px[i+2]<40) px[i+3] = 0;
    }
    cx.putImageData(id, 0, 0);
    const out = new Image();
    out.src = cv.toDataURL('image/png');
    return out;
  }

  function initSprites(srcs) {
    // srcs : { tree, park, forest, tap }
    return Promise.all(Object.entries(srcs).map(([k, src]) =>
      new Promise(res => {
        const img = new Image();
        img.onload = () => { sprites[k] = removeBlack(img); res(); };
        img.src = src;
      })
    ));
  }

  // ── Amas d'arbres ─────────────────────────────────────
  function getClusterLevel(count) {
    for (let i = CLUSTER_LEVELS.length-1; i >= 0; i--) {
      if (count >= CLUSTER_LEVELS[i].min) return CLUSTER_LEVELS[i];
    }
    return CLUSTER_LEVELS[0];
  }

  function computeClusters() {
    // Groupement spatial : radius en tiles
    const radius = CONFIG.CLUSTER.RADIUS_PX;
    const visited = new Set();
    const clusters = [];

    trees.forEach((tree, i) => {
      if (visited.has(i)) return;
      const cluster = [i];
      visited.add(i);
      trees.forEach((other, j) => {
        if (visited.has(j)) return;
        const dx = Math.abs(tree.col - other.col);
        const dy = Math.abs(tree.row - other.row);
        if (dx <= radius && dy <= radius) {
          cluster.push(j);
          visited.add(j);
        }
      });
      clusters.push(cluster);
    });

    return clusters.map(idxs => {
      const members = idxs.map(i => trees[i]);
      const cx = members.reduce((s,t) => s+t.mx, 0) / members.length;
      const cy = members.reduce((s,t) => s+t.my, 0) / members.length;
      const col = Math.round(members.reduce((s,t) => s+t.col, 0) / members.length);
      const row = Math.round(members.reduce((s,t) => s+t.row, 0) / members.length);
      return { members, count: members.length, cx, cy, col, row };
    });
  }

  // ── Rendu des entités ────────────────────────────────
  function renderAll() {
    const layer = document.getElementById('tree-layer');
    // Conserver les fontaines existantes, reconstruire les arbres
    layer.querySelectorAll('.entity-tree, .cluster-label').forEach(e => e.remove());

    const clusters = computeClusters();

    clusters.forEach(cl => {
      const level = getClusterLevel(cl.count);
      const sz = level.size;
      const spriteKey = level.type === 'small_park' ? 'tree' : (level.type === 'park' ? 'park' : level.type === 'forest' ? 'forest' : 'tree');
      const sprite = sprites[spriteKey];

      const el = document.createElement('div');
      el.className = 'entity-tree planted-tree';
      el.style.cssText = `position:absolute;left:${cl.cx - sz/2}px;top:${cl.cy - sz}px;width:${sz}px;height:${sz}px;pointer-events:all;cursor:pointer;transform-origin:bottom center;z-index:20;`;

      if (sprite) {
        const img = document.createElement('img');
        img.src = sprite.src;
        img.width = sz; img.height = sz;
        img.style.imageRendering = 'pixelated';
        el.appendChild(img);
      }

      // Badge compteur si cluster > 1
      if (cl.count > 1) {
        const badge = document.createElement('div');
        badge.className = 'cluster-label';
        badge.textContent = cl.count;
        badge.style.cssText = `position:absolute;top:-6px;right:-6px;background:#1a3a1a;border:1px solid #7ee84a;color:#7ee84a;font-family:'Press Start 2P',monospace;font-size:7px;padding:2px 5px;pointer-events:none;z-index:25;`;
        el.appendChild(badge);
      }

      // Hover → tooltip amas
      el.addEventListener('mouseenter', e => UI.showClusterTooltip(e, cl, level));
      el.addEventListener('mouseleave', () => UI.hideTooltip());
      el.addEventListener('mousemove',  e => UI.moveTooltip(e));

      layer.appendChild(el);
    });
  }

  // ── Planter un arbre ──────────────────────────────────
  function plantTree(mx, my, col, row, tileName) {
    const tileNames = MapEngine.getTileNames();
    const meta = TILE_META[tileNames[tileName]] || TILE_META[tileName] || {};
    if (!meta.plantable) {
      UI.notify('❌ Zone non plantable : ' + (meta.label || tileName));
      return false;
    }
    const gps = MapEngine.toGPS(col, row);
    const tree = {
      id: Date.now() + Math.random(),
      col, row, mx, my, tileName,
      date: new Date().toLocaleDateString('fr-FR'),
      gps,
    };
    trees.push(tree);
    treeCount++;
    spawnSparkles(mx, my);
    renderAll();
    UI.updateStats(treeCount, fountainCount);
    UI.notify('🌱 Arbre planté ! ' + (meta.label||''));
    return true;
  }

  // ── Planter une fontaine ──────────────────────────────
  function plantFountain(mx, my, col, row, tileName) {
    const tileNames = MapEngine.getTileNames();
    const meta = TILE_META[tileNames[tileName]] || TILE_META[tileName] || {};
    if (!meta.plantable) {
      UI.notify('❌ Zone non plantable pour une fontaine');
      return false;
    }
    const gps = MapEngine.toGPS(col, row);
    const fountain = {
      id: Date.now() + Math.random(),
      col, row, mx, my, tileName,
      date: new Date().toLocaleDateString('fr-FR'),
      gps,
    };
    fountains.push(fountain);
    fountainCount++;

    renderFountain(fountain, true);
    UI.updateStats(treeCount, fountainCount);
    UI.notify('⛲ Point d\'eau installé !');
    return true;
  }

  function renderFountain(f, animate=false) {
    const layer = document.getElementById('tree-layer');
    const sz = CONFIG.FOUNTAIN_PX;
    const el = document.createElement('div');
    el.className = 'entity-fountain' + (animate ? ' planted-fountain' : '');
    el.dataset.id = f.id;
    el.style.cssText = `position:absolute;left:${f.mx - sz/2}px;top:${f.my - sz}px;width:${sz}px;height:${sz}px;pointer-events:all;cursor:pointer;transform-origin:bottom center;z-index:20;`;

    const img = document.createElement('img');
    img.src = sprites.tap?.src || '';
    img.width = sz; img.height = sz;
    img.style.imageRendering = 'pixelated';
    el.appendChild(img);

    el.addEventListener('mouseenter', e => UI.showFountainTooltip(e, f));
    el.addEventListener('mouseleave', () => UI.hideTooltip());
    el.addEventListener('mousemove',  e => UI.moveTooltip(e));

    layer.appendChild(el);
    if (animate) spawnSparkles(f.mx, f.my, '💧');
  }

  // ── Particules ────────────────────────────────────────
  function spawnSparkles(mx, my, emoji='✨') {
    const layer = document.getElementById('tree-layer');
    const sparks = ['✨','🍃','💚','🌿','⭐'];
    [emoji, ...sparks].slice(0,5).forEach((e, i) => {
      const s = document.createElement('div');
      s.style.cssText = `position:absolute;left:${mx-20+Math.random()*40}px;top:${my-50+Math.random()*30}px;font-size:13px;animation:spark .7s ease-out ${i*0.08}s forwards;z-index:30;pointer-events:none;`;
      s.textContent = e;
      layer.appendChild(s);
      setTimeout(() => s.remove(), 900);
    });
  }

  // ── Getters ───────────────────────────────────────────
  function getTreeCount()     { return treeCount; }
  function getFountainCount() { return fountainCount; }
  function getTrees()         { return trees; }
  function getFountains()     { return fountains; }

  return {
    initSprites, plantTree, plantFountain,
    getTreeCount, getFountainCount, getTrees, getFountains,
    computeClusters,
  };
})();
