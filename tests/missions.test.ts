import { describe, it, expect } from "vitest";
import {
  planHunt,
  keepsakes,
  collectNearby,
  missionSnapshot,
  previousFromSpawns,
  parsePreviousHunt,
  inventoryStatus,
  emptyMission,
} from "../src/missions";
import type { PreviousHunt, KeepsakeId } from "../src/missions";
import { createGrid, blockRect, findPath, CELL } from "../src/pathfinding";
import { navigationForSeason } from "../src/worldGeometry";
const random = (seed: number) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
describe("five-object scavenger hunt", () => {
  it("places exactly five unique objects in distinct, reachable dry areas", () => {
    expect(keepsakes).toHaveLength(10);
    const grid = navigationForSeason([], "summer"),
      start = { x: 504, y: 393 };
    const plan = planHunt(grid, start, [], {}, random(123));
    expect(plan).toHaveLength(5);
    expect(new Set(plan.map((p) => p.id)).size).toBe(5);
    expect(plan.every((p) => keepsakes.some((k) => k.id === p.id))).toBe(true);
    expect(new Set(plan.map((p) => p.areaId)).size).toBe(5);
    for (const p of plan) {
      expect(grid[Math.floor(p.y / CELL)][Math.floor(p.x / CELL)]).toBe(0);
      expect(findPath(grid, start, p).length).toBeGreaterThan(0);
    }
  });
  it("moves every object to a different area and at least 96 pixels away on each reload", () => {
    const grid = navigationForSeason([], "summer");
    let previous: PreviousHunt = {};
    for (let reload = 0; reload < 35; reload++) {
      const plan = planHunt(
        grid,
        { x: 504, y: 393 },
        [],
        previous,
        random(913 + reload),
      );
      for (const p of plan) {
        const old = previous[p.id];
        if (old) {
          expect(p.areaId).not.toBe(old.areaId);
          expect(Math.hypot(p.x - old.x, p.y - old.y)).toBeGreaterThanOrEqual(
            96,
          );
        }
      }
      previous = previousFromSpawns(plan);
    }
  });
  it("does not hide objects in disconnected regions or behind scenery", () => {
    const grid = createGrid();
    blockRect(grid, 0, 416, 1024, 16);
    const hiddenRoof = { x: 414, y: 165, w: 272, h: 130 };
    const plan = planHunt(
      grid,
      { x: 504, y: 393 },
      [hiddenRoof],
      {},
      random(456),
    );
    for (const p of plan) {
      expect(p.y).toBeLessThan(416);
      const overlapping =
        p.x - 12 < hiddenRoof.x + hiddenRoof.w &&
        p.x + 12 > hiddenRoof.x &&
        p.y - 25 < hiddenRoof.y + hiddenRoof.h &&
        p.y + 4 > hiddenRoof.y;
      expect(overlapping).toBe(false);
    }
  });
  it("collects only nearby objects in clear line of sight and never awards the same object twice", () => {
    const grid = createGrid(),
      spawns = [
        { id: "acorn" as const, areaId: "village-square", x: 100, y: 100 },
      ],
      found = new Set<KeepsakeId>();
    expect(collectNearby(spawns, found, { x: 60, y: 100 }, grid)).toEqual([]);
    blockRect(grid, 88, 88, 8, 24);
    expect(collectNearby(spawns, found, { x: 80, y: 100 }, grid)).toEqual([]);
    expect(collectNearby(spawns, found, { x: 100, y: 108 }, grid)).toEqual([
      "acorn",
    ]);
    found.add("acorn");
    expect(collectNearby(spawns, found, { x: 100, y: 108 }, grid)).toEqual([]);
  });
  it("completes only after all five distinct keepsakes have been collected", () => {
    const plan = planHunt(createGrid(), { x: 504, y: 393 }, [], {}, random(39));
    const found = new Set<KeepsakeId>();
    expect(missionSnapshot(plan, found).complete).toBe(false);
    for (const item of plan.slice(0, 4)) found.add(item.id);
    expect(missionSnapshot(plan, found)).toMatchObject({
      foundCount: 4,
      complete: false,
    });
    found.add(plan[4].id);
    expect(missionSnapshot(plan, found)).toMatchObject({
      foundCount: 5,
      complete: true,
    });
    expect(missionSnapshot(plan, new Set()).foundCount).toBe(0);
  });
  it("randomizes the chosen five across the full ten-object catalog", () => {
    const seen = new Set<KeepsakeId>(),
      selections = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      const plan = planHunt(
        createGrid(),
        { x: 504, y: 393 },
        [],
        {},
        random(Math.imul(seed, 2654435761) >>> 0),
      );
      plan.forEach((item) => seen.add(item.id));
      selections.add(
        plan
          .map((p) => p.id)
          .sort()
          .join(","),
      );
    }
    expect(seen.size).toBe(10);
    expect(selections.size).toBeGreaterThan(10);
  });
  it("does not count inactive objects toward the current mission", () => {
    const plan = planHunt(createGrid(), { x: 504, y: 393 }, [], {}, random(4));
    const inactive = keepsakes.filter((k) => !plan.some((p) => p.id === k.id));
    const snapshot = missionSnapshot(plan, new Set(inactive.map((k) => k.id)));
    expect(snapshot.items).toHaveLength(5);
    expect(snapshot).toMatchObject({ foundCount: 0, complete: false });
    expect(missionSnapshot([], new Set()).complete).toBe(false);
  });
  it("shows found, hidden and inactive inventory statuses and resets for a fresh hunt", () => {
    const plan = planHunt(createGrid(), { x: 504, y: 393 }, [], {}, random(7));
    const snapshot = missionSnapshot(plan, new Set([plan[0].id]));
    expect(inventoryStatus(plan[0].id, snapshot)).toBe("found");
    expect(inventoryStatus(plan[1].id, snapshot)).toBe("hidden");
    const inactive = keepsakes.find((k) => !plan.some((p) => p.id === k.id))!;
    expect(inventoryStatus(inactive.id, snapshot)).toBe("inactive");
    expect(inventoryStatus(plan[0].id, missionSnapshot(plan, new Set()))).toBe(
      "hidden",
    );
    expect(inventoryStatus(plan[0].id, emptyMission)).toBe("inactive");
  });
  it("ignores malformed saved hiding places", () => {
    expect(parsePreviousHunt(null)).toEqual({});
    expect(
      parsePreviousHunt({
        acorn: { areaId: "unknown", x: 10, y: 10 },
        key: { areaId: "home-lane", x: "bad", y: 10 },
      }),
    ).toEqual({});
  });
});
