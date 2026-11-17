import { describe, it, expect } from "vitest";
import {
  daylightAt,
  daylightAfter,
  DAY_LENGTH_MS,
  initialClimate,
  SEASONS,
} from "../src/seasons";
import { navigationForSeason, WATER_AREAS } from "../src/worldGeometry";
import { CELL, nearestWalkable, findPath } from "../src/pathfinding";
describe("automatic village time", () => {
  it("starts in summer daylight and completes exactly one day in two minutes", () => {
    expect(initialClimate.season).toBe("summer");
    expect(daylightAfter(0).clock).toBe("10:00");
    expect(daylightAfter(0).lightsOn).toBe(false);
    expect(DAY_LENGTH_MS).toBe(120000);
    expect(daylightAfter(50000)).toMatchObject({
      phase: "Night",
      lightsOn: true,
      clock: "20:00",
    });
    expect(daylightAfter(DAY_LENGTH_MS)).toEqual(daylightAfter(0));
    expect(daylightAfter(DAY_LENGTH_MS / 2)).toMatchObject({
      clock: "22:00",
      phase: "Night",
      lightsOn: true,
      darkness: 1,
    });
  });
  it("gradually turns on the torch and streetlights at dusk and switches them off after dawn", () => {
    const dusk = [17, 18, 19, 20].map(daylightAt);
    expect(dusk.map((d) => d.darkness)).toEqual(
      [...dusk.map((d) => d.darkness)].sort((a, b) => a - b),
    );
    expect(daylightAt(17).lightsOn).toBe(false);
    expect(daylightAt(19).lightsOn).toBe(true);
    expect(daylightAt(5).lightsOn).toBe(true);
    expect(daylightAt(8).lightsOn).toBe(false);
    for (const boundary of [5, 8, 17, 20])
      expect(
        Math.abs(
          daylightAt(boundary - 0.001).darkness -
            daylightAt(boundary + 0.001).darkness,
        ),
      ).toBeLessThan(0.001);
  });
  it("wraps midnight without invalid times or darkness values", () => {
    expect(daylightAt(24).clock).toBe("00:00");
    expect(daylightAt(-1).clock).toBe("23:00");
    for (let minute = 0; minute < 1440; minute++) {
      const d = daylightAt(minute / 60);
      expect(d.darkness).toBeGreaterThanOrEqual(0);
      expect(d.darkness).toBeLessThanOrEqual(1);
      expect(d.clock).toMatch(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
    }
  });
});
describe("seasonal physics and thawing", () => {
  it("freezes every water resource into walkable ice only in winter", () => {
    for (const season of SEASONS) {
      const grid = navigationForSeason([], season);
      for (const a of WATER_AREAS) {
        const x = Math.floor((a.x + a.w / 2) / CELL),
          y = Math.floor((a.y + a.h / 2) / CELL);
        expect(grid[y][x]).toBe(season === "winter" ? 0 : 1);
      }
    }
  });
  it("keeps buildings solid when water freezes and restores their bounds on repeated switches", () => {
    const solids = [{ x: 456, y: 451, w: 96, h: 52 }];
    for (const season of ["winter", "spring", "winter", "summer"] as const) {
      const grid = navigationForSeason(solids, season);
      expect(grid[59][62]).toBe(1);
      expect(grid[78][86]).toBe(season === "winter" ? 0 : 1);
    }
  });
  it("returns a visitor standing on thawing ice to a dry, navigable bank", () => {
    const onIce = { x: 700, y: 628 },
      winter = navigationForSeason([], "winter"),
      spring = navigationForSeason([], "spring");
    expect(findPath(winter, { x: 700, y: 580 }, onIce).length).toBeGreaterThan(
      0,
    );
    expect(findPath(spring, { x: 700, y: 580 }, onIce)).toEqual([]);
    const safe = nearestWalkable(spring, onIce);
    expect(safe).not.toBeNull();
    expect(spring[Math.floor(safe!.y / CELL)][Math.floor(safe!.x / CELL)]).toBe(
      0,
    );
    expect(Math.hypot(safe!.x - onIce.x, safe!.y - onIce.y)).toBeLessThan(45);
    expect(findPath(spring, safe!, { x: 700, y: 580 }).length).toBeGreaterThan(
      0,
    );
  });
});
