// =============================================================================
// entities.ts — Arbres, fontaines, amas (clusters)
// =============================================================================

import {
  CONFIG,
  TILE_META,
  CLUSTER_LEVELS,
  type PlantedEntity,
  type Cluster,
  type ClusterLevel,
} from "./config";
import type { MapEngine } from "./map-engine";

export class Entities {
  private trees: PlantedEntity[] = [];
  private fountains: PlantedEntity[] = [];
  private sprites: Record<string, HTMLImageElement> = {};
  private treeLayer: HTMLDivElement | null = null;
  private engine: MapEngine;
  private onStatsChange: (trees: number, fountains: number) => void;
  private onNotify: (msg: string) => void;

  constructor(
    engine: MapEngine,
    onStatsChange: (trees: number, fountains: number) => void,
    onNotify: (msg: string) => void,
  ) {
    this.engine = engine;
    this.onStatsChange = onStatsChange;
    this.onNotify = onNotify;
  }

  setTreeLayer(el: HTMLDivElement) {
    this.treeLayer = el;
  }

  // ── Sprites nettoyés ─────────────────────────────────
  private removeBlack(img: HTMLImageElement, sz = 128): HTMLImageElement {
    const cv = document.createElement("canvas");
    cv.width = cv.height = sz;
    const cx = cv.getContext("2d")!;
    cx.drawImage(img, 0, 0, sz, sz);
    const id = cx.getImageData(0, 0, sz, sz);
    const px = id.data;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i] < 40 && px[i + 1] < 40 && px[i + 2] < 40) px[i + 3] = 0;
    }
    cx.putImageData(id, 0, 0);
    const out = new Image();
    out.src = cv.toDataURL("image/png");
    return out;
  }

  async initSprites(srcs: Record<string, string>) {
    await Promise.all(
      Object.entries(srcs).map(
        ([k, src]) =>
          new Promise<void>((res) => {
            const img = new Image();
            img.onload = () => {
              this.sprites[k] = this.removeBlack(img);
              res();
            };
            img.src = src;
          }),
      ),
    );
  }

  // ── Amas d'arbres ─────────────────────────────────────
  private getClusterLevel(count: number): ClusterLevel {
    for (let i = CLUSTER_LEVELS.length - 1; i >= 0; i--) {
      if (count >= CLUSTER_LEVELS[i].min) return CLUSTER_LEVELS[i];
    }
    return CLUSTER_LEVELS[0];
  }

  computeClusters(): Cluster[] {
    const radius = CONFIG.CLUSTER.RADIUS_PX;
    const visited = new Set<number>();
    const clusters: number[][] = [];

    this.trees.forEach((tree, i) => {
      if (visited.has(i)) return;
      const cluster = [i];
      visited.add(i);
      this.trees.forEach((other, j) => {
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

    return clusters.map((idxs) => {
      const members = idxs.map((i) => this.trees[i]);
      const cx = members.reduce((s, t) => s + t.mx, 0) / members.length;
      const cy = members.reduce((s, t) => s + t.my, 0) / members.length;
      const col = Math.round(
        members.reduce((s, t) => s + t.col, 0) / members.length,
      );
      const row = Math.round(
        members.reduce((s, t) => s + t.row, 0) / members.length,
      );
      return { members, count: members.length, cx, cy, col, row };
    });
  }

  // ── Rendu des entités ────────────────────────────────
  renderAll() {
    const layer = this.treeLayer;
    if (!layer) return;
    layer
      .querySelectorAll(".entity-tree, .cluster-label")
      .forEach((e) => e.remove());

    const clusters = this.computeClusters();

    clusters.forEach((cl) => {
      const level = this.getClusterLevel(cl.count);
      const sz = level.size;
      const spriteKey =
        level.type === "small_park"
          ? "tree"
          : level.type === "park"
            ? "park"
            : level.type === "forest"
              ? "forest"
              : "tree";
      const sprite = this.sprites[spriteKey];

      const el = document.createElement("div");
      el.className = "entity-tree planted-tree";
      el.style.cssText = `position:absolute;left:${cl.cx - sz / 2}px;top:${cl.cy - sz}px;width:${sz}px;height:${sz}px;pointer-events:all;cursor:pointer;transform-origin:bottom center;z-index:20;`;

      if (sprite) {
        const img = document.createElement("img");
        img.src = sprite.src;
        img.width = sz;
        img.height = sz;
        img.style.imageRendering = "pixelated";
        el.appendChild(img);
      }

      if (cl.count > 1) {
        const badge = document.createElement("div");
        badge.className = "cluster-label";
        badge.textContent = String(cl.count);
        badge.style.cssText = `position:absolute;top:-6px;right:-6px;background:#1a3a1a;border:1px solid #7ee84a;color:#7ee84a;font-family:'Press Start 2P',monospace;font-size:7px;padding:2px 5px;pointer-events:none;z-index:25;`;
        el.appendChild(badge);
      }

      layer.appendChild(el);
    });
  }

  // ── Planter un arbre ──────────────────────────────────
  plantTree(
    mx: number,
    my: number,
    col: number,
    row: number,
    tileName: number,
  ): boolean {
    const tileNames = this.engine.getTileNames();
    const meta = TILE_META[tileNames[tileName]] || TILE_META[tileName as unknown as string] || {};
    if (!meta.plantable) {
      this.onNotify("\u274C Zone non plantable : " + (meta.label || tileName));
      return false;
    }
    const gps = this.engine.toGPS(col, row);
    const tree: PlantedEntity = {
      id: Date.now() + Math.random(),
      col,
      row,
      mx,
      my,
      tileName,
      date: new Date().toLocaleDateString("fr-FR"),
      gps,
    };
    this.trees.push(tree);
    this.spawnSparkles(mx, my);
    this.renderAll();
    this.onStatsChange(this.trees.length, this.fountains.length);
    this.onNotify("\u{1F331} Arbre plante ! " + (meta.label || ""));
    return true;
  }

  // ── Planter une fontaine ──────────────────────────────
  plantFountain(
    mx: number,
    my: number,
    col: number,
    row: number,
    tileName: number,
  ): boolean {
    const tileNames = this.engine.getTileNames();
    const meta = TILE_META[tileNames[tileName]] || TILE_META[tileName as unknown as string] || {};
    if (!meta.plantable) {
      this.onNotify("\u274C Zone non plantable pour une fontaine");
      return false;
    }
    const gps = this.engine.toGPS(col, row);
    const fountain: PlantedEntity = {
      id: Date.now() + Math.random(),
      col,
      row,
      mx,
      my,
      tileName,
      date: new Date().toLocaleDateString("fr-FR"),
      gps,
    };
    this.fountains.push(fountain);
    this.renderFountain(fountain, true);
    this.onStatsChange(this.trees.length, this.fountains.length);
    this.onNotify("\u26F2 Point d'eau installe !");
    return true;
  }

  private renderFountain(f: PlantedEntity, animate = false) {
    const layer = this.treeLayer;
    if (!layer) return;
    const sz = CONFIG.FOUNTAIN_PX;
    const el = document.createElement("div");
    el.className = "entity-fountain" + (animate ? " planted-fountain" : "");
    el.dataset.id = String(f.id);
    el.style.cssText = `position:absolute;left:${f.mx - sz / 2}px;top:${f.my - sz}px;width:${sz}px;height:${sz}px;pointer-events:all;cursor:pointer;transform-origin:bottom center;z-index:20;`;

    const img = document.createElement("img");
    img.src = this.sprites.tap?.src || "";
    img.width = sz;
    img.height = sz;
    img.style.imageRendering = "pixelated";
    el.appendChild(img);

    layer.appendChild(el);
    if (animate) this.spawnSparklesFountain(f.mx, f.my, "\u{1F4A7}");
  }

  // ── Particules ────────────────────────────────────────
  private spawnSparkles(mx: number, my: number, emoji = "\u2728") {
    const layer = this.treeLayer;
    if (!layer) return;
    const sparks = ["\u2728", "\u{1F343}", "\u{1F49A}", "\u{1F33F}", "\u2B50"];
    [emoji, ...sparks].slice(0, 5).forEach((e, i) => {
      const s = document.createElement("div");
      s.style.cssText = `position:absolute;left:${mx - 20 + Math.random() * 40}px;top:${my - 50 + Math.random() * 30}px;font-size:13px;animation:spark .7s ease-out ${i * 0.08}s forwards;z-index:30;pointer-events:none;`;
      s.textContent = e;
      layer.appendChild(s);
      setTimeout(() => s.remove(), 900);
    });
  }

  private spawnSparklesFountain(mx: number, my: number, emoji = "\u{1F4A7}") {
    const layer = this.treeLayer;
    if (!layer) return;
    const sparksFountain = ["\u26F2", "\u{1F4A6}", "\u{1F30A}", "\u{1F4AB}", "\u2B50"];
    [emoji, ...sparksFountain].slice(0, 5).forEach((e, i) => {
      const s = document.createElement("div");
      s.style.cssText = `position:absolute;left:${mx - 20 + Math.random() * 40}px;top:${my - 50 + Math.random() * 30}px;font-size:13px;animation:spark .7s ease-out ${i * 0.08}s forwards;z-index:30;pointer-events:none;`;
      s.textContent = e;
      layer.appendChild(s);
      setTimeout(() => s.remove(), 900);
    });
  }

  // ── Getters ───────────────────────────────────────────
  getTreeCount() {
    return this.trees.length;
  }
  getFountainCount() {
    return this.fountains.length;
  }
  getTrees() {
    return this.trees;
  }
  getFountains() {
    return this.fountains;
  }
}
