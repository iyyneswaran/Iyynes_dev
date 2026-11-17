import type Phaser from "phaser";
import { makeCanvas, rng } from "./art";
import { drawKeepsake } from "./collectibleArt";
import {
  planHunt,
  keepsakes,
  collectNearby,
  missionSnapshot,
  parsePreviousHunt,
  previousFromSpawns,
} from "./missions";
import type {
  KeepsakeSpawn,
  KeepsakeId,
  MissionState,
  Rect,
  PreviousHunt,
} from "./missions";
import type { Grid, Point } from "./pathfinding";
import { audio } from "./audio";
const STORAGE_KEY = "greenleaf-previous-hunt-v1";
function previousHunt(): PreviousHunt {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return parsePreviousHunt(JSON.parse(saved));
  } catch {
    /* History retains the last layout when local storage is unavailable. */
  }
  return parsePreviousHunt(window.history.state?.greenleafHunt);
}
function remember(spawns: KeepsakeSpawn[]) {
  const previous = previousFromSpawns(spawns);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(previous));
  } catch {
    /* The current hunt still works without storage. */
  }
  try {
    window.history.replaceState(
      { ...window.history.state, greenleafHunt: previous },
      "",
    );
  } catch {
    /* Random generation still works in restricted frames. */
  }
}
export class HuntController {
  private scene: Phaser.Scene;
  private spawns: KeepsakeSpawn[];
  private found = new Set<KeepsakeId>();
  private images = new Map<KeepsakeId, Phaser.GameObjects.Image>();
  private onMission: (state: MissionState) => void;
  private onToast: (text: string) => void;
  constructor(
    scene: Phaser.Scene,
    dryGrid: Grid,
    spawn: Point,
    exclusions: Rect[],
    onMission: (state: MissionState) => void,
    onToast: (text: string) => void,
  ) {
    this.scene = scene;
    this.onMission = onMission;
    this.onToast = onToast;
    const seed = new Uint32Array(1);
    crypto.getRandomValues(seed);
    this.spawns = planHunt(
      dryGrid,
      spawn,
      exclusions,
      previousHunt(),
      rng(seed[0]),
    );
    remember(this.spawns);
    for (const item of this.spawns) {
      const { c, ctx } = makeCanvas(21, 25);
      ctx.fillStyle = "#3e5d3c30";
      ctx.fillRect(4, 21, 13, 3);
      drawKeepsake(ctx, item.id);
      const key = `keepsake-${item.id}`;
      scene.textures.addCanvas(key, c);
      this.images.set(
        item.id,
        scene.add
          .image(item.x, item.y, key)
          .setOrigin(0.5, 1)
          .setDepth(item.y - 0.1),
      );
    }
    this.onMission(missionSnapshot(this.spawns, this.found));
  }
  hit(point: Point): Point | null {
    return (
      this.spawns.find(
        (s) =>
          !this.found.has(s.id) &&
          Math.abs(point.x - s.x) < 12 &&
          point.y > s.y - 25 &&
          point.y < s.y + 4,
      ) ?? null
    );
  }
  update(player: Point, grid: Grid, enabled: boolean) {
    if (!enabled) return;
    for (const id of collectNearby(this.spawns, this.found, player, grid)) {
      this.found.add(id);
      const image = this.images.get(id)!;
      image.destroy();
      this.images.delete(id);
      const item = this.spawns.find((s) => s.id === id)!;
      for (let i = 0; i < 8; i++) {
        const p = this.scene.add
          .rectangle(
            item.x,
            item.y - 10,
            2,
            2,
            i % 2 ? 0xffedb3 : 0xc7ac67,
            0.9,
          )
          .setDepth(1100);
        this.scene.tweens.add({
          targets: p,
          x: item.x + Math.cos((i * Math.PI) / 4) * 19,
          y: item.y - 20 + Math.sin((i * Math.PI) / 4) * 15,
          alpha: 0,
          duration: 650,
          onComplete: () => p.destroy(),
        });
      }
      const state = missionSnapshot(this.spawns, this.found);
      this.onMission(state);
      audio.play("discover");
      this.onToast(
        state.complete
          ? "All five keepsakes found! Village Explorer badge earned."
          : `Found the ${keepsakes.find((k) => k.id === id)!.name.toLowerCase()}! ${state.foundCount} of 5 collected.`,
      );
    }
  }
}
