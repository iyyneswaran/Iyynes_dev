import { CELL, findPath, blockRect } from "./pathfinding";
import type { Grid, Point } from "./pathfinding";
export const TALK_RADIUS = 48;
/** Occupied feet space is temporary: never mutate the seasonal collision grid. */
export function withResidentObstacles(
  grid: Grid,
  player: Point,
  residents: ReadonlyArray<Point & { id: string }>,
  omit?: string,
): Grid {
  const result = grid.map((row) => row.slice());
  for (const resident of residents)
    if (resident.id !== omit)
      blockRect(result, resident.x - 14, resident.y - 12, 28, 24);
  const x = Math.floor(player.x / CELL),
    y = Math.floor(player.y / CELL);
  if (grid[y]?.[x] === 0) result[y][x] = 0;
  return result;
}
/** Feet-to-feet visibility prevents conversations through buildings or fences. */
export function canTalk(grid: Grid, from: Point, to: Point): boolean {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  if (distance > TALK_RADIUS) return false;
  const steps = Math.max(1, Math.ceil(distance / (CELL / 2)));
  for (let i = 0; i <= steps; i++) {
    const x = Math.floor((from.x + ((to.x - from.x) * i) / steps) / CELL),
      y = Math.floor((from.y + ((to.y - from.y) * i) / steps) / CELL);
    if (grid[y]?.[x] !== 0) return false;
  }
  return true;
}
/** Pick a reachable standing spot beside a villager, not inside their physics body. */
export function approachPath(grid: Grid, from: Point, to: Point): Point[] {
  let best: Point[] = [];
  for (const [dx, dy] of [
    [0, 28],
    [28, 0],
    [-28, 0],
    [0, -28],
    [24, 24],
    [-24, 24],
    [24, -24],
    [-24, -24],
  ]) {
    const spot = { x: to.x + dx, y: to.y + dy };
    if (!canTalk(grid, spot, to)) continue;
    const route = findPath(grid, from, spot);
    if (route.length && (!best.length || route.length < best.length))
      best = route;
  }
  return best;
}
