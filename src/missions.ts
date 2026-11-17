import { CELL, nearestWalkable } from "./pathfinding";
import type { Grid, Point } from "./pathfinding";

export const keepsakes = [
  {
    id: "acorn",
    name: "Golden acorn",
    description: "A tiny treasure from the treetops.",
    color: "#ba9656",
  },
  {
    id: "key",
    name: "Old brass key",
    description: "Someone’s pocket is a little lighter.",
    color: "#b79b64",
  },
  {
    id: "feather",
    name: "Bluebird feather",
    description: "A little piece of the sky.",
    color: "#719daa",
  },
  {
    id: "map",
    name: "Map fragment",
    description: "An adventure, folded into a corner.",
    color: "#8da172",
  },
  {
    id: "lantern",
    name: "Pocket lantern",
    description: "A small light for a long journey.",
    color: "#c0905d",
  },
  {
    id: "gem",
    name: "Rose quartz",
    description: "A little sparkle beneath your feet.",
    color: "#ba829a",
  },
  {
    id: "compass",
    name: "Wanderer’s compass",
    description: "For those who take the scenic route.",
    color: "#a39768",
  },
  {
    id: "mushroom",
    name: "Spotted mushroom",
    description: "A tiny red cap from the forest floor.",
    color: "#ba765f",
  },
  {
    id: "shell",
    name: "River shell",
    description: "The river left a little souvenir.",
    color: "#c5a58c",
  },
  {
    id: "coin",
    name: "Star coin",
    description: "A lucky token with a story to tell.",
    color: "#c3a555",
  },
] as const;
export const HUNT_SIZE = 5;
export type KeepsakeId = (typeof keepsakes)[number]["id"];
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface HidingArea extends Rect {
  id: string;
  name: string;
  hint: string;
}
export const hidingAreas: HidingArea[] = [
  {
    id: "home-lane",
    name: "Home lane",
    hint: "Take a slow walk around the red-roofed home and its garden lane.",
    x: 148,
    y: 270,
    w: 232,
    h: 45,
  },
  {
    id: "maker-patch",
    name: "Maker’s corner",
    hint: "Look around the little clearings beside the maker’s lab.",
    x: 414,
    y: 165,
    w: 272,
    h: 130,
  },
  {
    id: "workshop-garden",
    name: "Workshop garden",
    hint: "Try the gardens and grass near the blue-roofed workshop.",
    x: 680,
    y: 190,
    w: 212,
    h: 115,
  },
  {
    id: "west-walk",
    name: "Western walk",
    hint: "Follow the western stretch of the village’s main path.",
    x: 95,
    y: 320,
    w: 260,
    h: 85,
  },
  {
    id: "village-square",
    name: "Village square",
    hint: "Explore the paths and green spaces around the fountain.",
    x: 392,
    y: 285,
    w: 256,
    h: 135,
  },
  {
    id: "east-walk",
    name: "Eastern walk",
    hint: "Wander along the eastern paths, beyond the fountain.",
    x: 692,
    y: 315,
    w: 198,
    h: 90,
  },
  {
    id: "garden-green",
    name: "Garden green",
    hint: "Check the open grass by the story house and vegetable plots.",
    x: 303,
    y: 425,
    w: 135,
    h: 120,
  },
  {
    id: "lodge-green",
    name: "Lodge green",
    hint: "There are little green spaces beside the trophy lodge and fields.",
    x: 545,
    y: 430,
    w: 156,
    h: 116,
  },
  {
    id: "post-lane",
    name: "Post office lane",
    hint: "A delivery may have gone astray along the post office lane.",
    x: 706,
    y: 520,
    w: 186,
    h: 33,
  },
  {
    id: "north-bank",
    name: "Northern riverbank",
    hint: "Walk along the dry bank on the village side of the bridge.",
    x: 355,
    y: 564,
    w: 380,
    h: 26,
  },
  {
    id: "south-flowers",
    name: "Southern wildflowers",
    hint: "Cross the bridge and explore the wildflower meadow to the west.",
    x: 245,
    y: 670,
    w: 108,
    h: 20,
  },
  {
    id: "south-meadow",
    name: "Southern meadow",
    hint: "Across the bridge, the meadow to the east has a secret to keep.",
    x: 662,
    y: 670,
    w: 80,
    h: 20,
  },
  {
    id: "pond-edge",
    name: "Eastern pond",
    hint: "Look for a small clearing near the eastern pond.",
    x: 850,
    y: 355,
    w: 40,
    h: 188,
  },
];
export interface KeepsakeSpawn extends Point {
  id: KeepsakeId;
  areaId: string;
}
export type PreviousHunt = Partial<
  Record<KeepsakeId, { areaId: string; x: number; y: number }>
>;
export interface MissionItem {
  id: KeepsakeId;
  found: boolean;
  hint: string;
}
export interface MissionState {
  items: MissionItem[];
  foundCount: number;
  complete: boolean;
}
export const emptyMission: MissionState = {
  items: [],
  foundCount: 0,
  complete: false,
};
const shuffled = <T>(values: readonly T[], random: () => number): T[] => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
function reachableCells(grid: Grid, from: Point): Set<number> {
  const cols = grid[0].length,
    rows = grid.length,
    start = nearestWalkable(grid, from);
  if (!start) return new Set();
  const initial =
      Math.floor(start.y / CELL) * cols + Math.floor(start.x / CELL),
    visited = new Set([initial]),
    queue = [initial];
  let head = 0;
  while (head < queue.length) {
    const key = queue[head++],
      x = key % cols,
      y = Math.floor(key / cols);
    for (const [dx, dy] of [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        k = ny * cols + nx;
      if (
        nx >= 0 &&
        ny >= 0 &&
        nx < cols &&
        ny < rows &&
        !grid[ny][nx] &&
        !visited.has(k)
      ) {
        visited.add(k);
        queue.push(k);
      }
    }
  }
  return visited;
}
const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
/** Choose five distinct, visible and connected hiding areas; the previous hunt is excluded. */
export function planHunt(
  grid: Grid,
  from: Point,
  exclusions: readonly Rect[],
  previous: PreviousHunt,
  random: () => number,
): KeepsakeSpawn[] {
  const selected = shuffled(keepsakes, random).slice(0, HUNT_SIZE);
  const reachable = reachableCells(grid, from),
    cols = grid[0].length;
  const candidates = hidingAreas
    .map((area) => {
      const points: Point[] = [];
      for (
        let row = Math.ceil(area.y / CELL);
        row * CELL + CELL / 2 < area.y + area.h;
        row++
      )
        for (
          let col = Math.ceil(area.x / CELL);
          col * CELL + CELL / 2 < area.x + area.w;
          col++
        ) {
          const p = { x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 };
          if (
            !reachable.has(row * cols + col) ||
            Math.hypot(p.x - from.x, p.y - from.y) < 84
          )
            continue;
          const drawing = { x: p.x - 12, y: p.y - 25, w: 24, h: 29 };
          if (exclusions.some((r) => overlaps(drawing, r))) continue;
          points.push(p);
        }
      return { area, points: shuffled(points, random) };
    })
    .filter((value) => value.points.length);
  const chosen: KeepsakeSpawn[] = [];
  const used = new Set<string>();
  const assign = (index: number): boolean => {
    if (index === selected.length) return true;
    const id = selected[index].id,
      old = previous[id];
    for (const { area, points } of shuffled(candidates, random)) {
      if (used.has(area.id) || old?.areaId === area.id) continue;
      for (const p of points) {
        if (
          (old && Math.hypot(p.x - old.x, p.y - old.y) < 96) ||
          chosen.some((s) => Math.hypot(s.x - p.x, s.y - p.y) < 80)
        )
          continue;
        chosen.push({ ...p, id, areaId: area.id });
        used.add(area.id);
        if (assign(index + 1)) return true;
        chosen.pop();
        used.delete(area.id);
      }
    }
    return false;
  };
  if (!assign(0))
    throw new Error("The village needs five reachable hiding places.");
  return chosen;
}
export function collectNearby(
  spawns: readonly KeepsakeSpawn[],
  found: ReadonlySet<KeepsakeId>,
  player: Point,
  grid: Grid,
): KeepsakeId[] {
  return spawns
    .filter((item) => {
      if (
        found.has(item.id) ||
        Math.hypot(player.x - item.x, player.y - item.y) > 22
      )
        return false;
      const steps = Math.max(
        1,
        Math.ceil(
          Math.hypot(player.x - item.x, player.y - item.y) / (CELL / 2),
        ),
      );
      for (let i = 0; i <= steps; i++) {
        const x = Math.floor(
            (player.x + ((item.x - player.x) * i) / steps) / CELL,
          ),
          y = Math.floor((player.y + ((item.y - player.y) * i) / steps) / CELL);
        if (grid[y]?.[x] !== 0) return false;
      }
      return true;
    })
    .map((item) => item.id);
}
export function missionSnapshot(
  spawns: readonly KeepsakeSpawn[],
  found: ReadonlySet<KeepsakeId>,
): MissionState {
  const items = spawns.map((spawn) => ({
    id: spawn.id,
    found: found.has(spawn.id),
    hint:
      hidingAreas.find((a) => a.id === spawn.areaId)?.hint ??
      "Keep exploring the village.",
  }));
  const foundCount = items.filter((i) => i.found).length;
  return {
    items,
    foundCount,
    complete: items.length === HUNT_SIZE && foundCount === HUNT_SIZE,
  };
}
export type InventoryStatus = "found" | "hidden" | "inactive";
export function inventoryStatus(
  id: KeepsakeId,
  mission: MissionState,
): InventoryStatus {
  const item = mission.items.find((entry) => entry.id === id);
  return item ? (item.found ? "found" : "hidden") : "inactive";
}
export function previousFromSpawns(
  spawns: readonly KeepsakeSpawn[],
): PreviousHunt {
  return Object.fromEntries(
    spawns.map((s) => [s.id, { areaId: s.areaId, x: s.x, y: s.y }]),
  ) as PreviousHunt;
}
export function parsePreviousHunt(value: unknown): PreviousHunt {
  if (!value || typeof value !== "object") return {};
  const result: PreviousHunt = {};
  for (const item of keepsakes) {
    const entry = (value as Record<string, unknown>)[item.id];
    if (!entry || typeof entry !== "object") continue;
    const p = entry as Record<string, unknown>;
    if (
      typeof p.areaId === "string" &&
      hidingAreas.some((a) => a.id === p.areaId) &&
      typeof p.x === "number" &&
      typeof p.y === "number" &&
      Number.isFinite(p.x) &&
      Number.isFinite(p.y)
    )
      result[item.id] = { areaId: p.areaId, x: p.x, y: p.y };
  }
  return result;
}
