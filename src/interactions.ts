import type { Point } from "./pathfinding";
/** Door access is determined afresh from position, even for previously visited places. */
export function isWithinReach(
  player: Point,
  door: Point,
  radius = 46,
): boolean {
  return Math.hypot(door.x - player.x, door.y + 10 - player.y) < radius;
}
