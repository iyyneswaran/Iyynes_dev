export const LAMPS = [
  [420, 308],
  [590, 308],
  [420, 410],
  [590, 410],
  [463, 574],
  [549, 574],
] as const;
export const WATER_AREAS = [
  { x: 0, y: 600, w: 477, h: 60 },
  { x: 534, y: 600, w: 490, h: 60 },
  { x: 59, y: 413, w: 84, h: 116 },
  { x: 902, y: 299, w: 87, h: 233 },
  { x: 818, y: 638, w: 161, h: 91 },
] as const;
import { createGrid, blockRect } from "./pathfinding";
import type { Season } from "./seasons";
export interface SolidArea {
  x: number;
  y: number;
  w: number;
  h: number;
}
export function navigationForSeason(solids: SolidArea[], season: Season) {
  const grid = createGrid();
  for (const a of solids) blockRect(grid, a.x - 6, a.y - 4, a.w + 12, a.h + 10);
  if (season !== "winter")
    for (const a of WATER_AREAS)
      blockRect(grid, a.x - 6, a.y - 4, a.w + 12, a.h + 10);
  return grid;
}
